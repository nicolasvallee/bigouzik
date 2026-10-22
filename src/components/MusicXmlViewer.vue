<script setup lang="ts">
import * as alphaTab from '@coderline/alphatab'
import { nextTick, onBeforeUnmount, onMounted, ref, toRefs, watch } from 'vue'
import { normalizeMusicXml } from '@/lib/normalizeMusicXml'
import { LOOP_COPIES, repeatMidi } from '@/lib/repeatMidi'
import { ACCENTED_PERCUSSION_VELOCITY_SCALE, GHOST_PERCUSSION_VELOCITY_SCALE, MUSIC_XML_SURDO_MIDI_NOTE, SIDE_STICK_MIDI_NOTE, SNARE_MIDI_NOTE, SURDO_1_COLOR, SURDO_1_MIDI_NOTE, SURDO_2_COLOR, SURDO_2_MIDI_NOTE, SURDO_3_COLOR, SURDO_3_MIDI_NOTE, TIMBALE_MIDI_NOTES } from '@/lib/percussion'
import type { CircularRhythmSection, SurdoBeat } from '@/data/trackGroups'
import CircularRhythmViewer from './CircularRhythmViewer.vue'
import DescriptionText from './DescriptionText.vue'

const props = defineProps<{
  src: string
  title: string
  description?: string
  sheetDescription?: string
  experimental?: boolean
  trackLink?: string
  kickVelocityScale?: number
  sideStickVelocityScale?: number
  timbaleVolume?: number
  surdo1?: SurdoBeat[]
  surdo2?: SurdoBeat[]
  surdo3?: SurdoBeat[]
  sheetScale?: number
  showSheet: boolean
  showCircle: boolean
  playbackSpeed: number
  selectedTrack: 'both' | 'snare' | 'kick'
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
const { selectedTrack, playbackSpeed } = toRefs(props)
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
let playbackCopies = 1
const ghostPercussionNotes = new Set<string>()
const accentedPercussionNotes = new Set<string>()
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
    ghostPercussionNotes.clear()
    accentedPercussionNotes.clear()

    for (const track of score.tracks) {
      track.percussionArticulations.forEach((articulation) => {
        articulation.staffLine = 0
      })
      track.staves.forEach((staff) => {
        staff.standardNotationLineCount = 1
        staff.bars.forEach((bar) => {
          bar.voices.forEach((voice) => {
            voice.beats.forEach((beat) => {
              beat.notes.forEach((note) => {
                const midiNote = track.percussionArticulations[note.percussionArticulation]?.outputMidiNumber
                if (midiNote === undefined) return

                const key = percussionNoteKey(midiNote, beat.absolutePlaybackStart)
                if (note.isGhost) ghostPercussionNotes.add(key)
                if (note.accentuated) accentedPercussionNotes.add(key)
              })
            })
          })
        })
      })
    }

    scoreTracks = score.tracks
    surdoVariantRanges = getSurdoVariantRanges()
    positionStackedSurdos()
    colorSurdoVariants()
    renderSelectedTracks(currentApi)
  })
  removeMidiLoadListener = currentApi.midiLoad.on((midi) => {
    const noteKeys = selectedTrack.value === 'snare' ? [SIDE_STICK_MIDI_NOTE, SNARE_MIDI_NOTE] : selectedTrack.value === 'kick' ? [MUSIC_XML_SURDO_MIDI_NOTE, SURDO_2_MIDI_NOTE, SURDO_3_MIDI_NOTE] : null
    const kickVelocityScale = props.kickVelocityScale ?? 1
    const sideStickVelocityScale = props.sideStickVelocityScale ?? 1
    const timbaleVolume = Math.max(1, Math.round(props.timbaleVolume ?? 1))
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
          if (event.type === alphaTab.midi.MidiEventType.NoteOn) applyPercussionArticulation(noteEvent, event.tick)
        }
        applySurdoVariants(track.events)
        boostTimbaleVolume(track.events, timbaleVolume)
      })
    } else if (
      kickVelocityScale !== 1
      || sideStickVelocityScale !== 1
      || timbaleVolume !== 1
      || ghostPercussionNotes.size > 0
      || accentedPercussionNotes.size > 0
      || surdoVariantRanges.length > 0
      || Number(SURDO_1_MIDI_NOTE) !== Number(MUSIC_XML_SURDO_MIDI_NOTE)
    ) {
      midi.tracks.forEach((track) => {
        track.events.forEach((event) => {
          if (!('noteKey' in event)) return

          const noteEvent = event as { noteKey: number; noteVelocity?: number }
          scalePercussionVelocity(noteEvent, kickVelocityScale, sideStickVelocityScale, event.tick)
          if (event.type === alphaTab.midi.MidiEventType.NoteOn) applyPercussionArticulation(noteEvent, event.tick)
        })
        applySurdoVariants(track.events)
        boostTimbaleVolume(track.events, timbaleVolume)
      })
    }

    playbackCopies = props.loop && currentApi.tickCache && repeatMidi(midi, currentApi.tickCache) ? LOOP_COPIES : 1

    if (pendingTimePosition !== null) {
      const timePosition = pendingTimePosition
      window.setTimeout(() => {
        if (!api) return
        api.timePosition = timePosition
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
    duration.value = endTime / playbackCopies
    endTick.value = finalTick / playbackCopies
    currentTime.value = playbackCopies > 1 && duration.value > 0 ? position % duration.value : position
    currentTick.value = playbackCopies > 1 && endTick.value > 0 ? tick % endTick.value : tick
  })

  void loadMusicXml(currentApi)
})

async function loadMusicXml(currentApi: alphaTab.AlphaTabApi) {
  const response = await fetch(publicAsset(props.src))
  const xml = await response.text()
  const normalizedXml = normalizeMusicXml(addStackedSurdosToXml(xml), { compoundTempo: props.compound })
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
  // Let music play through the iOS silent switch when the Audio Session API is available.
  const audioSession = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
  if (audioSession) audioSession.type = 'playback'
  api?.playPause()
}

watch(playbackSpeed, (speed) => {
  if (api) api.playbackSpeed = speed
})

watch(() => props.showSheet, async (show) => {
  if (!show || !api) return

  await nextTick()
  api.render()
})

watch(selectedTrack, () => {
  if (!api || !scoreTracks.length) return

  renderSelectedTracks(api)
  pendingTimePosition = api.timePosition
  pendingPlayback = isPlaying.value
  isPlaying.value = false
  api.loadMidiForScore()
})

function renderSelectedTracks(currentApi: alphaTab.AlphaTabApi) {
  const tracks = selectedTrack.value === 'both'
    ? scoreTracks
    : scoreTracks.filter((track) => scoreTrackKind(track) === selectedTrack.value)

  currentApi.renderTracks(tracks)
}

function scoreTrackKind(track: alphaTab.model.Track): Exclude<typeof selectedTrack.value, 'both'> | 'other' {
  const name = `${track.name} ${track.shortName}`.toLowerCase().replace(/\s+/g, ' ')

  if (name.includes('snare') || name.includes('caisse')) return 'snare'
  if (name.includes('bass drum') || name.includes('kick') || name.includes('surdo') || name.split(/\s+/).includes('bd')) return 'kick'
  return 'other'
}

function getSurdoVariantRanges() {
  const variants = [
    ...(props.surdo1?.map((beat) => ({ ...beat, midiNote: SURDO_1_MIDI_NOTE })) ?? []),
    ...(props.surdo3?.map((beat) => ({ ...beat, midiNote: SURDO_3_MIDI_NOTE })) ?? []),
    ...(props.surdo2?.map((beat) => ({ ...beat, midiNote: SURDO_2_MIDI_NOTE })) ?? []),
  ]
  if (!variants.length) return []

  const bars = scoreTracks.find((track) => scoreTrackKind(track) === 'kick')?.staves[0]?.bars ?? []

  return variants.flatMap((variant) => {
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
    const sourceBeat = bar.voices
      .flatMap((voice) => voice.beats)
      .find((source) => source.absolutePlaybackStart === startTick)
    const duration = sourceBeat?.playbackDuration ?? (Number.isInteger(beat) ? beatDuration : beatDuration / 4)

    return [{ startTick, endTick: startTick + duration, midiNote: variant.midiNote }]
  })
}

function addStackedSurdosToXml(xml: string) {
  const stackedBeats = (props.surdo1 ?? []).filter((surdo1) =>
    props.surdo3?.some((surdo3) => surdo3.measure === surdo1.measure && surdo3.beat === surdo1.beat),
  )
  if (!stackedBeats.length) return xml

  const document = new DOMParser().parseFromString(xml, 'application/xml')
  const scorePart = Array.from(document.querySelectorAll('score-part')).find((part) =>
    /bass drum|kick|surdo/i.test(part.querySelector('part-name')?.textContent?.replace(/\s+/g, ' ') ?? ''),
  )
  const partId = scorePart?.getAttribute('id')
  const part = partId ? Array.from(document.querySelectorAll('part')).find((candidate) => candidate.getAttribute('id') === partId) : null
  if (!scorePart || !part) return xml

  const surdo3Id = `${partId}-surdo3`
  const scoreInstrument = document.createElement('score-instrument')
  scoreInstrument.setAttribute('id', surdo3Id)
  const instrumentName = document.createElement('instrument-name')
  instrumentName.textContent = 'Surdo 3'
  scoreInstrument.append(instrumentName)
  scorePart.append(scoreInstrument)
  const midiInstrument = document.createElement('midi-instrument')
  midiInstrument.setAttribute('id', surdo3Id)
  const midiChannel = document.createElement('midi-channel')
  midiChannel.textContent = '10'
  const midiUnpitched = document.createElement('midi-unpitched')
  midiUnpitched.textContent = '42'
  midiInstrument.append(midiChannel, midiUnpitched)
  scorePart.append(midiInstrument)

  let divisions = 1
  let denominator = 4
  Array.from(part.querySelectorAll(':scope > measure')).forEach((measure, measureIndex) => {
    divisions = Number(measure.querySelector('attributes > divisions')?.textContent) || divisions
    denominator = Number(measure.querySelector('attributes > time > beat-type')?.textContent) || denominator
    let cursor = 0

    Array.from(measure.querySelectorAll(':scope > note')).forEach((note) => {
      const duration = Number(note.querySelector('duration')?.textContent) || 0
      if (note.querySelector('chord')) return

      const isStacked = stackedBeats.some((beat) =>
        beat.measure === measureIndex + 1 && cursor === (Math.max(1, beat.beat ?? 1) - 1) * divisions * 4 / denominator,
      )
      if (isStacked && !note.querySelector('rest')) {
        const duplicate = note.cloneNode(true) as Element
        const chord = document.createElement('chord')
        duplicate.insertBefore(chord, duplicate.querySelector('unpitched'))
        duplicate.querySelector('display-step')?.replaceChildren('F')
        duplicate.querySelector('instrument')?.setAttribute('id', surdo3Id)
        note.after(duplicate)
      }
      cursor += duration
    })
  })

  return new XMLSerializer().serializeToString(document)
}

function positionStackedSurdos() {
  const surdo = scoreTracks.find((track) => scoreTrackKind(track) === 'kick')
  if (!surdo) return

  const surdo3Color = new alphaTab.model.Color(...SURDO_3_COLOR)
  surdo.percussionArticulations.forEach((articulation) => {
    if (articulation.outputMidiNumber === SURDO_1_MIDI_NOTE) articulation.staffLine = 1
    if (articulation.outputMidiNumber === SURDO_3_MIDI_NOTE) articulation.staffLine = -1
  })
  surdo.staves.forEach((staff) => {
    staff.bars.forEach((bar) => {
      bar.voices.forEach((voice) => {
        voice.beats.forEach((beat) => {
          beat.notes.forEach((note) => {
            if (surdo.percussionArticulations[note.percussionArticulation]?.outputMidiNumber !== SURDO_3_MIDI_NOTE) return

            note.style ??= new alphaTab.model.NoteStyle()
            note.style.colors.set(alphaTab.model.NoteSubElement.StandardNotationNoteHead, surdo3Color)
          })
        })
      })
    })
  })
}

function colorSurdoVariants() {
  const colors = new Map([
    [SURDO_1_MIDI_NOTE, new alphaTab.model.Color(...SURDO_1_COLOR)],
    [SURDO_2_MIDI_NOTE, new alphaTab.model.Color(...SURDO_2_COLOR)],
    [SURDO_3_MIDI_NOTE, new alphaTab.model.Color(...SURDO_3_COLOR)],
  ])
  scoreTracks
    .filter((track) => scoreTrackKind(track) === 'kick')
    .forEach((track) => {
      track.staves.forEach((staff) => {
        staff.bars.forEach((bar) => {
          bar.voices.forEach((voice) => {
            voice.beats.forEach((beat) => {
              const hasStackedSurdos = surdoVariantRanges.some((surdo1) =>
                surdo1.midiNote === SURDO_1_MIDI_NOTE
                && beat.absolutePlaybackStart >= surdo1.startTick
                && beat.absolutePlaybackStart < surdo1.endTick
                && surdoVariantRanges.some((surdo3) =>
                  surdo3.midiNote === SURDO_3_MIDI_NOTE
                  && surdo3.startTick === surdo1.startTick
                  && surdo3.endTick === surdo1.endTick,
                ),
              )
              if (hasStackedSurdos) {
                const color = colors.get(SURDO_1_MIDI_NOTE)
                beat.notes
                  .filter((note) => track.percussionArticulations[note.percussionArticulation]?.outputMidiNumber === SURDO_1_MIDI_NOTE)
                  .forEach((note) => {
                    note.style ??= new alphaTab.model.NoteStyle()
                    note.style.colors.set(alphaTab.model.NoteSubElement.StandardNotationNoteHead, color!)
                  })
                return
              }

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

function applySurdoVariants(events: alphaTab.midi.MidiEvent[]) {
  const activeNotes: number[] = []

  for (const event of events) {
    const noteEvent = event as alphaTab.midi.NoteEvent
    if (noteEvent.noteKey !== MUSIC_XML_SURDO_MIDI_NOTE) continue

    if (event.type === alphaTab.midi.MidiEventType.NoteOn) {
      let midiNote = SURDO_1_MIDI_NOTE

      for (let index = surdoVariantRanges.length - 1; index >= 0; index -= 1) {
        const variant = surdoVariantRanges[index]
        if (variant.midiNote === SURDO_1_MIDI_NOTE) continue
        if (event.tick >= variant.startTick && event.tick < variant.endTick) {
          if (surdoVariantRanges.some((surdo1) => surdo1.midiNote === SURDO_1_MIDI_NOTE && surdo1.startTick === variant.startTick && surdo1.endTick === variant.endTick)) break
          midiNote = variant.midiNote
          break
        }
      }

      noteEvent.noteKey = midiNote
      activeNotes.push(midiNote)
    } else if (event.type === alphaTab.midi.MidiEventType.NoteOff) {
      const midiNote = activeNotes.shift()
      if (midiNote !== undefined) noteEvent.noteKey = midiNote
    }
  }
}

function seek(event: Event) {
  if (!api) return
  const cycleStart = playbackCopies > 1 && duration.value > 0
    ? Math.min(playbackCopies - 1, Math.floor(api.timePosition / duration.value)) * duration.value
    : 0
  api.timePosition = cycleStart + Number((event.target as HTMLInputElement).value)
}

function formatTime(milliseconds: number) {
  const seconds = Math.max(0, Math.round(milliseconds / 1000))
  const minutes = Math.floor(seconds / 60)

  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}

function scaleVelocity(velocity: number, scale: number) {
  return Math.max(0, Math.min(127, Math.round(velocity * scale)))
}

function boostTimbaleVolume(events: alphaTab.midi.MidiEvent[], volume: number) {
  if (volume === 1) return

  const duplicates: alphaTab.midi.MidiEvent[] = []
  for (const event of events) {
    const noteEvent = event as alphaTab.midi.NoteEvent
    if (!TIMBALE_MIDI_NOTES.some((key) => key === noteEvent.noteKey)) continue

    if (event.type === alphaTab.midi.MidiEventType.NoteOn) {
      for (let index = 1; index < volume; index += 1) {
        duplicates.push(new alphaTab.midi.NoteOnEvent(noteEvent.track, event.tick, noteEvent.channel, noteEvent.noteKey, noteEvent.noteVelocity))
      }
    } else if (event.type === alphaTab.midi.MidiEventType.NoteOff) {
      for (let index = 1; index < volume; index += 1) {
        duplicates.push(new alphaTab.midi.NoteOffEvent(noteEvent.track, event.tick, noteEvent.channel, noteEvent.noteKey, noteEvent.noteVelocity))
      }
    }
  }
  events.push(...duplicates)
  events.sort((a, b) => a.tick - b.tick)
}

function percussionNoteKey(midiNote: number, tick: number) {
  return `${midiNote}:${tick}`
}

function applyPercussionArticulation(noteEvent: { noteKey: number; noteVelocity?: number }, tick: number) {
  if (noteEvent.noteVelocity === undefined) return

  const key = percussionNoteKey(noteEvent.noteKey, tick)
  const articulationScale = ghostPercussionNotes.has(key)
    ? GHOST_PERCUSSION_VELOCITY_SCALE
    : accentedPercussionNotes.has(key)
      ? ACCENTED_PERCUSSION_VELOCITY_SCALE
      : 1
  if (articulationScale !== 1) noteEvent.noteVelocity = scaleVelocity(noteEvent.noteVelocity, articulationScale)
}

function scalePercussionVelocity(
  noteEvent: { noteKey: number; noteVelocity?: number },
  kickScale: number,
  sideStickScale: number,
  tick: number,
) {
  if (noteEvent.noteVelocity === undefined) return

  const scale = noteEvent.noteKey === MUSIC_XML_SURDO_MIDI_NOTE
    ? kickScale
    : noteEvent.noteKey === SIDE_STICK_MIDI_NOTE
      ? sideStickScale
      : 1
  if (scale !== 1) noteEvent.noteVelocity = scaleVelocity(noteEvent.noteVelocity, scale)
}
</script>

<template>
  <div
    class="min-w-0 w-full max-w-full overflow-hidden rounded-2xl border border-border bg-white px-4 py-5 text-foreground shadow-2xl shadow-black/10 sm:px-6"
  >
    <div :class="src && 'mb-5'">
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
          <div v-if="experimental || (showSheet && (surdo1?.length || surdo2?.length || surdo3?.length))" class="mt-2 flex flex-wrap gap-1.5" aria-label="Track badges">
            <span v-if="experimental" class="inline-flex items-center rounded-full border border-accent bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
              Expérimental
            </span>
            <span v-if="showSheet && surdo1?.length" class="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold" :style="{ color: `rgb(${SURDO_1_COLOR.join(', ')})` }">
              <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: `rgb(${SURDO_1_COLOR.join(', ')})` }" />
              Surdo 1
            </span>
            <span v-if="showSheet && surdo2?.length" class="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold" :style="{ color: `rgb(${SURDO_2_COLOR.join(', ')})` }">
              <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: `rgb(${SURDO_2_COLOR.join(', ')})` }" />
              Surdo 2
            </span>
            <span v-if="showSheet && surdo3?.length" class="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold" :style="{ color: `rgb(${SURDO_3_COLOR.join(', ')})` }">
              <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: `rgb(${SURDO_3_COLOR.join(', ')})` }" />
              Surdo 3
            </span>
          </div>
        </div>
        <button
          v-if="src"
          class="-mt-1.5 inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground shadow-lg shadow-accent/20 transition-transform hover:-translate-y-0.5 hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
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
      <p v-if="description" class="mt-2 text-sm leading-relaxed text-foreground/65">
        <DescriptionText :text="description" />
      </p>
    </div>
    <div v-if="src" v-show="showSheet" ref="scoreElement" class="alpha-tab relative z-0 min-h-32 min-w-0 overflow-hidden" aria-label="Rendered MusicXML score" />
    <CircularRhythmViewer
      v-if="src"
      :src="src"
      :show-circle="showCircle"
      :circular-rhythm="circularRhythm"
      :surdo1="surdo1"
      :surdo2="surdo2"
      :surdo3="surdo3"
      :compound="compound"
      :current-tick="currentTick"
      :end-tick="endTick"
      :selected-track="selectedTrack"
    />
    <div v-if="src && !showSheet && !showCircle" class="mt-2 flex items-center gap-3 text-xs tabular-nums text-foreground/60">
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
    <p v-if="showSheet && sheetDescription" class="mt-3 max-w-2xl text-sm italic leading-relaxed text-foreground/65">
      <DescriptionText :text="sheetDescription" />
    </p>
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
