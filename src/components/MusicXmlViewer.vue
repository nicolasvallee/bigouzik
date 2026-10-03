<script setup lang="ts">
import * as alphaTab from '@coderline/alphatab'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { normalizeMusicXml } from '@/lib/normalizeMusicXml'

const PARENTHESIZED_SNARE_VELOCITY_SCALE = 0.15

const props = defineProps<{
  src: string
  title: string
  trackLink?: string
  kickVelocityScale?: number
  sideStickVelocityScale?: number
  sheetScale?: number
  compound?: boolean
  loop: boolean
}>()

const scoreElement = ref<HTMLElement | null>(null)
const audioState = ref<'loading' | 'ready'>('loading')
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const selectedTrack = ref<'both' | 'snare' | 'kick'>('both')
let api: alphaTab.AlphaTabApi | null = null
let removePlayerReadyListener: (() => void) | null = null
let removePlayerStateListener: (() => void) | null = null
let removePlayerPositionListener: (() => void) | null = null
let removeScoreLoadedListener: (() => void) | null = null
let removeMidiLoadListener: (() => void) | null = null
let removePlaybackListener: (() => void) | null = null
let creditObserver: MutationObserver | null = null
let pendingTimePosition: number | null = null
let pendingPlayback = false
let isWrappingLoop = false
const parenthesizedSnareTicks = new Set<number>()
let hasRenderedAllTracks = false
let layoutObserver: ResizeObserver | null = null
let removeWindowResizeListener: (() => void) | null = null

const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
const playbackEventName = 'music-track-playing'
const viewerId = Symbol('music-track-viewer')

onMounted(() => {
  if (!scoreElement.value) return

  const currentApi = new alphaTab.AlphaTabApi(scoreElement.value, {
    core: { engine: 'svg', fontDirectory: publicAsset('font/'), useWorkers: false },
    display: { layoutMode: 'page', scale: props.sheetScale ?? 1, padding: [5, 0], stretchForce: 0.5 },
    player: {
      soundFont: publicAsset('soundfont/GeneralUser-GS.sf2'),
      enableCursor: true,
      enableAnimatedBeatCursor: true,
      scrollMode: alphaTab.ScrollMode.Off,
      playerMode: alphaTab.PlayerMode.EnabledSynthesizer,
    },
  })
  api = currentApi
  currentApi.masterVolume = 5
  currentApi.isLooping = props.loop

  const pauseWhenAnotherTrackStarts = (event: Event) => {
    if ((event as CustomEvent<symbol>).detail !== viewerId) {
      currentApi.pause()
    }
  }
  window.addEventListener(playbackEventName, pauseWhenAnotherTrackStarts)
  removePlaybackListener = () => window.removeEventListener(playbackEventName, pauseWhenAnotherTrackStarts)

  layoutObserver = new ResizeObserver(() => updateResponsiveLayout(currentApi))
  layoutObserver.observe(scoreElement.value)
  const updateLayoutOnResize = () => updateResponsiveLayout(currentApi)
  window.addEventListener('resize', updateLayoutOnResize)
  removeWindowResizeListener = () => window.removeEventListener('resize', updateLayoutOnResize)

  creditObserver = new MutationObserver(hideAlphaTabCredit)
  creditObserver.observe(scoreElement.value, { childList: true, subtree: true })

  removePlayerReadyListener = currentApi.playerReady.on(() => {
    audioState.value = 'ready'
  })
  removeScoreLoadedListener = currentApi.scoreLoaded.on((score) => {
    if (hasRenderedAllTracks) return
    hasRenderedAllTracks = true
    removeScoreLoadedListener?.()
    removeScoreLoadedListener = null

    for (const track of score.tracks) {
      track.percussionArticulations.forEach((articulation) => {
        articulation.staffLine = 0
      })
      track.staves.forEach((staff) => {
        staff.standardNotationLineCount = 1
        staff.bars.forEach((bar) => {
          bar.voices.forEach((voice) => {
            voice.beats.forEach((beat) => {
              if (beat.notes.some((note) => note.isPercussion && note.isGhost)) {
                parenthesizedSnareTicks.add(beat.absolutePlaybackStart)
              }
            })
          })
        })
      })
    }

    currentApi.renderTracks(score.tracks)
  })
  removeMidiLoadListener = currentApi.midiLoad.on((midi) => {
    const noteKeys = selectedTrack.value === 'snare' ? [37, 38] : selectedTrack.value === 'kick' ? [36] : null
    const kickVelocityScale = props.kickVelocityScale ?? 1
    const sideStickVelocityScale = props.sideStickVelocityScale ?? 1
    if (noteKeys !== null) {
      midi.tracks.forEach((track) => {
        for (let index = track.events.length - 1; index >= 0; index -= 1) {
          const event = track.events[index]
          if (!('noteKey' in event)) continue

          const noteEvent = event as { noteKey: number; noteVelocity?: number }
          if (!noteKeys.includes(noteEvent.noteKey)) {
            track.events.splice(index, 1)
            continue
          }

          scalePercussionVelocity(noteEvent, kickVelocityScale, sideStickVelocityScale, event.tick)
        }
      })
    } else if (
      kickVelocityScale !== 1
      || sideStickVelocityScale !== 1
      || parenthesizedSnareTicks.size > 0
    ) {
      midi.tracks.forEach((track) => {
        track.events.forEach((event) => {
          if (!('noteKey' in event)) return

          const noteEvent = event as { noteKey: number; noteVelocity?: number }
          scalePercussionVelocity(noteEvent, kickVelocityScale, sideStickVelocityScale, event.tick)
        })
      })
    }

    if (pendingTimePosition !== null) {
      const timePosition = pendingTimePosition
      window.setTimeout(() => {
        if (!api) return
        api.timePosition = timePosition
        currentTime.value = timePosition
        pendingTimePosition = null
        if (pendingPlayback) {
          pendingPlayback = false
          api.play()
        }
      })
    }
  })
  removePlayerStateListener = currentApi.playerStateChanged.on(({ state }) => {
    isPlaying.value = state === alphaTab.synth.PlayerState.Playing
    if (isPlaying.value) {
      window.dispatchEvent(new CustomEvent(playbackEventName, { detail: viewerId }))
    }
  })
  removePlayerPositionListener = currentApi.playerPositionChanged.on(({ currentTime: position, endTime, currentTick, endTick }) => {
    currentTime.value = position
    duration.value = endTime

    const loopBoundary = endTick - 20
    if (props.loop && isPlaying.value && !isWrappingLoop && currentTick >= loopBoundary) {
      isWrappingLoop = true
      currentApi.tickPosition = currentApi.playbackRange?.startTick ?? 0
    } else if (currentTick < loopBoundary) {
      isWrappingLoop = false
    }
  })

  void loadMusicXml(currentApi)
})

async function loadMusicXml(currentApi: alphaTab.AlphaTabApi) {
  const response = await fetch(publicAsset(props.src))
  const xml = await response.text()
  const normalizedXml = normalizeMusicXml(xml, { compoundTempo: props.compound })
  currentApi.load(new TextEncoder().encode(normalizedXml))
}

onBeforeUnmount(() => {
  layoutObserver?.disconnect()
  creditObserver?.disconnect()
  removePlayerReadyListener?.()
  removePlayerStateListener?.()
  removePlayerPositionListener?.()
  removeScoreLoadedListener?.()
  removeMidiLoadListener?.()
  removePlaybackListener?.()
  removeWindowResizeListener?.()
  api?.destroy()
})

function updateResponsiveLayout(currentApi: alphaTab.AlphaTabApi) {
  if (!scoreElement.value) return

  const nextLayout = alphaTab.LayoutMode.Page
  if (currentApi.settings.display.layoutMode === nextLayout) {
    currentApi.render()
    return
  }

  currentApi.settings.display.layoutMode = nextLayout
  currentApi.updateSettings()
  currentApi.render()
}

function hideAlphaTabCredit() {
  scoreElement.value?.querySelectorAll('svg text').forEach((text) => {
    if (text.textContent?.trim() !== 'rendered by alphaTab') return

    text.setAttribute('visibility', 'hidden')
  })
}

function togglePlayback() {
  api?.playPause()
}

function selectTrack(track: 'both' | 'snare' | 'kick') {
  selectedTrack.value = track
  if (!api) return

  pendingTimePosition = currentTime.value
  pendingPlayback = isPlaying.value
  isPlaying.value = false
  api.loadMidiForScore()
}

function seek(event: Event) {
  if (!api) return
  const value = Number((event.target as HTMLInputElement).value)
  currentTime.value = value
  api.timePosition = value
}

function formatTime(milliseconds: number) {
  const seconds = Math.floor(milliseconds / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function scaleVelocity(velocity: number, scale: number) {
  return Math.max(0, Math.min(127, Math.round(velocity * scale)))
}

function scalePercussionVelocity(
  noteEvent: { noteKey: number; noteVelocity?: number },
  kickScale: number,
  sideStickScale: number,
  tick: number,
) {
  if (noteEvent.noteVelocity === undefined) return

  const parenthesizedSnareScale = noteEvent.noteKey === 38 && parenthesizedSnareTicks.has(tick)
    ? PARENTHESIZED_SNARE_VELOCITY_SCALE
    : 1
  const scale = noteEvent.noteKey === 36
    ? kickScale
    : noteEvent.noteKey === 37
      ? sideStickScale
      : parenthesizedSnareScale
  if (scale !== 1) noteEvent.noteVelocity = scaleVelocity(noteEvent.noteVelocity, scale)
}
</script>

<template>
  <div
    class="min-w-0 w-full max-w-full overflow-hidden rounded-2xl border border-border bg-white px-4 py-5 text-foreground shadow-2xl shadow-black/10 sm:px-6"
  >
    <div class="mb-5 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <h2 class="font-serif text-2xl font-bold sm:text-3xl">
          <RouterLink
            v-if="trackLink"
            :to="trackLink"
            class="transition-colors hover:text-accent"
          >
            {{ title }}
          </RouterLink>
          <template v-else>{{ title }}</template>
        </h2>
        <button
          class="inline-flex h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground shadow-lg shadow-accent/20 transition-transform hover:-translate-y-0.5 hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
          type="button"
          :disabled="audioState !== 'ready'"
          :aria-label="isPlaying ? `Pause ${title}` : `Play ${title}`"
          @click="togglePlayback"
        >
          {{ audioState === 'ready' ? (isPlaying ? 'Pause' : 'Play') : 'Loading audio' }}
        </button>
      </div>
      <div class="ml-auto flex flex-wrap items-center justify-end gap-2" aria-label="Track selector" role="group">
        <button
          v-for="track in ['both', 'snare', 'kick'] as const"
          :key="track"
          class="h-8 rounded-full border px-3 text-xs font-semibold capitalize transition-colors"
          :class="selectedTrack === track ? 'border-foreground bg-foreground text-background' : 'border-border bg-transparent text-foreground/60 hover:border-foreground/50 hover:text-foreground'"
          type="button"
          :aria-pressed="selectedTrack === track"
          @click="selectTrack(track)"
        >
          {{ track === 'both' ? 'Tout' : track === 'snare' ? 'Caisse' : 'Surdo' }}
        </button>
      </div>
    </div>
    <div ref="scoreElement" class="alpha-tab min-h-32 min-w-0 overflow-hidden" aria-label="Rendered MusicXML score" />
  </div>
</template>

<style scoped>
.alpha-tab :deep(svg) {
  display: block;
  max-width: 100%;
  min-width: 0;
  width: 100%;
}

.alpha-tab :deep(.at-cursor-beat) {
  width: 3px;
  background: var(--accent);
  opacity: 0.9;
}

</style>
