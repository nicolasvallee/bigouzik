<script setup lang="ts">
import * as alphaTab from '@coderline/alphatab'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { normalizeMusicXml } from '@/lib/normalizeMusicXml'
import type { CircularRhythmSection, SurdoVariant } from '@/data/trackGroups'
import CircularRhythmViewer from './CircularRhythmViewer.vue'

const PARENTHESIZED_SNARE_VELOCITY_SCALE = 0.15

const props = defineProps<{
  src: string
  title: string
  description?: string
  trackLink?: string
  kickVelocityScale?: number
  sideStickVelocityScale?: number
  surdoVariants?: SurdoVariant[]
  sheetScale?: number
  showSheet: boolean
  showCircle: boolean
  circularRhythm?: CircularRhythmSection[]
  compound?: boolean
  loop: boolean
}>()

const scoreElement = ref<HTMLElement | null>(null)
const audioState = ref<'loading' | 'ready'>('loading')
const isPlaying = ref(false)
const currentTime = ref(0)
const currentTick = ref(0)
const endTick = ref(0)
const duration = ref(0)
const selectedTrack = ref<'both' | 'snare' | 'kick'>('both')
const playbackSpeed = ref(1)
const playbackSpeedOptions = [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2]
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
let scoreTracks: alphaTab.model.Track[] = []
let surdoVariantRanges: Array<{ startTick: number; endTick: number; midiNote: number }> = []
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
  currentApi.playbackSpeed = playbackSpeed.value
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

  creditObserver = new MutationObserver(() => {
    hideAlphaTabCredit()
    updatePercussionLabels()
  })
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

    scoreTracks = score.tracks
    surdoVariantRanges = getSurdoVariantRanges()
    colorSurdoVariants()
    renderSelectedTracks(currentApi)
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
        applySurdoVariants(track.events)
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
        applySurdoVariants(track.events)
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
  removePlayerPositionListener = currentApi.playerPositionChanged.on(({ currentTime: position, endTime, currentTick: tick, endTick: finalTick }) => {
    currentTime.value = position
    currentTick.value = tick
    endTick.value = finalTick
    duration.value = endTime

    const loopBoundary = finalTick - 20
    if (props.loop && isPlaying.value && !isWrappingLoop && tick >= loopBoundary) {
      isWrappingLoop = true
      currentApi.tickPosition = currentApi.playbackRange?.startTick ?? 0
    } else if (tick < loopBoundary) {
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

function updatePercussionLabels() {
  scoreElement.value?.querySelectorAll('svg text').forEach((text) => {
    const label = text.textContent?.trim()
    if (label === 'SD') {
      text.textContent = 'caisse'
      text.setAttribute('fill', 'var(--accent)')
    } else if (label === 'BD') {
      text.textContent = 'surdo'
      text.setAttribute('fill', '#111111')
    }
  })
}

function togglePlayback() {
  api?.playPause()
}

function updatePlaybackSpeed() {
  if (api) api.playbackSpeed = playbackSpeed.value
}

watch(() => props.showSheet, async (show) => {
  if (!show || !api) return

  await nextTick()
  api.render()
})

function selectTrack(track: 'both' | 'snare' | 'kick') {
  selectedTrack.value = track
  if (!api) return

  renderSelectedTracks(api)
  pendingTimePosition = currentTime.value
  pendingPlayback = isPlaying.value
  isPlaying.value = false
  api.loadMidiForScore()
}

function renderSelectedTracks(currentApi: alphaTab.AlphaTabApi) {
  const tracks = selectedTrack.value === 'both'
    ? scoreTracks
    : scoreTracks.filter((track) => scoreTrackKind(track) === selectedTrack.value)

  currentApi.renderTracks(tracks)
}

function scoreTrackKind(track: alphaTab.model.Track): Exclude<typeof selectedTrack.value, 'both'> | 'other' {
  const name = `${track.name} ${track.shortName}`.toLowerCase()

  if (name.includes('snare') || name.includes('caisse')) return 'snare'
  if (name.includes('bass drum') || name.includes('kick') || name.includes('surdo') || name.split(/\s+/).includes('bd')) return 'kick'
  return 'other'
}

function getSurdoVariantRanges() {
  if (!props.surdoVariants?.length) return []

  const bars = scoreTracks.find((track) => scoreTrackKind(track) === 'kick')?.staves[0]?.bars ?? []

  return props.surdoVariants.flatMap((variant) => {
    const bar = bars[variant.measure - 1]
    const barStart = Math.min(...(bar?.voices.flatMap((voice) => voice.beats.map((beat) => beat.absolutePlaybackStart)) ?? []))
    if (!bar || !Number.isFinite(barStart)) return []

    const { timeSignatureNumerator: numerator, timeSignatureDenominator: denominator } = bar.masterBar
    const beatsInBar = denominator === 8 && numerator >= 6 && numerator % 3 === 0
      ? numerator / 3
      : numerator
    const beatDuration = bar.calculateDuration() / beatsInBar
    const beat = Math.max(1, variant.beat ?? 1)
    const startTick = barStart + (beat - 1) * beatDuration
    const duration = Number.isInteger(beat) ? beatDuration : beatDuration / 4

    return [{ startTick, endTick: startTick + duration, midiNote: variant.midiNote }]
  })
}

function colorSurdoVariants() {
  const colors = new Map([
    [41, new alphaTab.model.Color(220, 38, 38)],
    [43, new alphaTab.model.Color(22, 163, 74)],
  ])
  scoreTracks
    .filter((track) => scoreTrackKind(track) === 'kick')
    .forEach((track) => {
      track.staves.forEach((staff) => {
        staff.bars.forEach((bar) => {
          bar.voices.forEach((voice) => {
            voice.beats.forEach((beat) => {
              let color: alphaTab.model.Color | undefined
              for (let index = surdoVariantRanges.length - 1; index >= 0; index -= 1) {
                const variant = surdoVariantRanges[index]
                if (beat.absolutePlaybackStart >= variant.startTick && beat.absolutePlaybackStart < variant.endTick) {
                  color = colors.get(variant.midiNote)
                  break
                }
              }
              if (!color) return

              beat.notes.forEach((note) => {
                note.style ??= new alphaTab.model.NoteStyle()
                note.style.colors.set(alphaTab.model.NoteSubElement.StandardNotationNoteHead, color)
              })
            })
          })
        })
      })
    })
}

function applySurdoVariants(events: Array<{ tick: number; type: alphaTab.midi.MidiEventType; noteKey?: number }>) {
  const activeNotes: number[] = []

  for (const event of events) {
    if (event.noteKey !== 36) continue

    if (event.type === alphaTab.midi.MidiEventType.NoteOn) {
      let midiNote = 36

      for (let index = surdoVariantRanges.length - 1; index >= 0; index -= 1) {
        const variant = surdoVariantRanges[index]
        if (event.tick >= variant.startTick && event.tick < variant.endTick) {
          midiNote = variant.midiNote
          break
        }
      }

      event.noteKey = midiNote
      activeNotes.push(midiNote)
    } else if (event.type === alphaTab.midi.MidiEventType.NoteOff) {
      const midiNote = activeNotes.shift()
      if (midiNote !== undefined) event.noteKey = midiNote
    }
  }
}

function seek(event: Event) {
  if (!api) return
  api.timePosition = Number((event.target as HTMLInputElement).value)
}

function formatTime(milliseconds: number) {
  const seconds = Math.max(0, Math.round(milliseconds / 1000))
  const minutes = Math.floor(seconds / 60)

  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
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
      <div class="flex min-w-0 items-start gap-4">
        <div class="min-w-0">
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
          <p v-if="description" class="mt-1 max-w-2xl text-sm leading-relaxed text-foreground/65">
            {{ description }}
          </p>
        </div>
        <button
          class="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground shadow-lg shadow-accent/20 transition-transform hover:-translate-y-0.5 hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
          type="button"
          :disabled="audioState !== 'ready'"
          :aria-label="isPlaying ? `Pause ${title}` : `Play ${title}`"
          @click="togglePlayback"
        >
          <span v-if="audioState === 'ready'" class="playback-icon" aria-hidden="true">
            <span v-if="isPlaying" class="pause-icon" />
            <span v-else class="play-icon" />
          </span>
          <span>{{ audioState === 'ready' ? (isPlaying ? 'Pause' : 'Play') : 'Loading audio' }}</span>
        </button>
      </div>
      <div class="ml-auto flex flex-wrap items-center justify-end gap-2" aria-label="Track selector" role="group">
        <label class="inline-flex h-8 items-center gap-2 text-xs font-semibold text-foreground/70">
          <span>Vitesse</span>
          <span class="relative">
            <select
              v-model.number="playbackSpeed"
              class="h-8 appearance-none rounded-full border border-border bg-background px-2 pr-6 text-xs font-semibold text-foreground outline-none transition-colors hover:border-foreground/50 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="audioState !== 'ready'"
              aria-label="Vitesse de lecture"
              @change="updatePlaybackSpeed"
            >
              <option v-for="speed in playbackSpeedOptions" :key="speed" :value="speed">
                {{ speed.toFixed(1) }}x
              </option>
            </select>
            <svg class="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-foreground/60" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="m3 4.5 3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
        </label>
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
    <div v-show="showSheet" ref="scoreElement" class="alpha-tab relative z-0 min-h-32 min-w-0 overflow-hidden" aria-label="Rendered MusicXML score" />
    <CircularRhythmViewer
      :src="src"
      :show-circle="showCircle"
      :circular-rhythm="circularRhythm"
      :surdo-variants="surdoVariants"
      :compound="compound"
      :current-tick="currentTick"
      :end-tick="endTick"
      :selected-track="selectedTrack"
    />
    <div v-if="!showSheet && !showCircle" class="mt-2 flex items-center gap-3 text-xs tabular-nums text-foreground/60">
      <span>{{ formatTime(currentTime) }}</span>
      <input
        class="w-full accent-accent"
        type="range"
        min="0"
        step="10"
        :max="duration || 1"
        :value="currentTime"
        :disabled="audioState !== 'ready' || duration === 0"
        :aria-label="`Position dans ${title}`"
        @input="seek"
      >
      <span>{{ formatTime(duration) }}</span>
    </div>
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
  z-index: 1 !important;
}

.playback-icon {
  display: inline-flex;
  width: 0.9rem;
  height: 0.9rem;
  align-items: center;
  justify-content: center;
}

.play-icon {
  width: 0;
  height: 0;
  border-top: 0.3rem solid transparent;
  border-bottom: 0.3rem solid transparent;
  border-left: 0.5rem solid currentColor;
}

.pause-icon {
  display: inline-flex;
  width: 0.5rem;
  height: 0.7rem;
  gap: 0.15rem;
}

.pause-icon::before,
.pause-icon::after {
  content: '';
  flex: 1;
  background: currentColor;
}

</style>
