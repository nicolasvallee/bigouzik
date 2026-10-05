<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { CircularRhythmSection } from '@/data/trackGroups'

type TrackSelection = 'both' | 'snare' | 'kick'
type RhythmKind = Exclude<TrackSelection, 'both'> | 'other'

interface RhythmHit {
  time: number
  parenthesized: boolean
  drumStick: boolean
}

interface RhythmMeasure {
  start: number
  duration: number
  hits: RhythmHit[]
}

interface ParsedRing {
  id: string
  label: string
  kind: RhythmKind
  hits: RhythmHit[]
  measures: RhythmMeasure[]
  duration: number
}

interface CircleSection {
  id: string
  rings: ParsedRing[]
  sourceDuration: number
  playbackStart: number
  playbackDuration: number
  repeats: number
}

const props = defineProps<{
  src: string
  showCircle: boolean
  circularRhythm?: CircularRhythmSection[]
  compound?: boolean
  currentTick: number
  endTick: number
  selectedTrack: TrackSelection
}>()

const sections = ref<CircleSection[]>([])
const cycleDuration = ref(0)
const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`

const progress = computed(() => props.endTick > 0 ? props.currentTick / props.endTick : 0)
const currentQuarter = computed(() => progress.value * cycleDuration.value)

function visibleRings(section: CircleSection) {
  return section.rings.filter(
    (ring) => props.selectedTrack === 'both' || ring.kind === props.selectedTrack,
  )
}

function beatCount(section: CircleSection) {
  return Math.max(1, Math.min(Math.ceil(section.sourceDuration), 32))
}

function offBeatCount() {
  return props.compound ? 2 : 1
}

function offBeatProgress(offBeat: number, section: CircleSection) {
  const beats = beatCount(section)
  const subdivisions = offBeatCount() + 1
  const beat = Math.floor((offBeat - 1) / offBeatCount())
  const subdivision = ((offBeat - 1) % offBeatCount()) + 1

  return (beat + (subdivision / subdivisions)) / beats
}

function pointAt(progressValue: number, radius: number) {
  const angle = (progressValue * Math.PI * 2) - (Math.PI / 2)

  return {
    x: 160 + (Math.cos(angle) * radius),
    y: 160 + (Math.sin(angle) * radius),
  }
}

function radiusFor(index: number, ringCount: number) {
  return ringCount === 1 ? 74 : 90 - (index * 32)
}

function sectionProgress(section: CircleSection) {
  const elapsed = currentQuarter.value - section.playbackStart
  if (elapsed <= 0) return 0
  if (elapsed >= section.playbackDuration) return 1

  return (elapsed % section.sourceDuration) / section.sourceDuration
}

function isActive(hit: RhythmHit, section: CircleSection) {
  if (!section.sourceDuration || !props.endTick) return false

  const distance = Math.abs((hit.time / section.sourceDuration) - sectionProgress(section))
  return Math.min(distance, 1 - distance) < 0.025
}

function hitSize(hit: RhythmHit, section: CircleSection) {
  if (hit.parenthesized) return isActive(hit, section) ? 4 : 2.5
  return isActive(hit, section) ? 12 : 7
}

function stickSize(hit: RhythmHit, section: CircleSection) {
  if (hit.parenthesized) return isActive(hit, section) ? 3 : 2
  return isActive(hit, section) ? 7 : 4
}

onMounted(async () => {
  const response = await fetch(publicAsset(props.src))
  const xml = await response.text()
  const document = new DOMParser().parseFromString(xml, 'application/xml')
  const names = new Map(
    Array.from(document.querySelectorAll('score-part')).map((part) => [
      part.getAttribute('id') ?? '',
      part.querySelector('part-name')?.textContent?.trim() ?? 'Percussion',
    ]),
  )
  const instrumentNames = new Map(
    Array.from(document.querySelectorAll('score-instrument')).map((instrument) => [
      instrument.getAttribute('id') ?? '',
      instrument.querySelector('instrument-name')?.textContent?.trim().toLowerCase() ?? '',
    ]),
  )
  const parsedRings = Array.from(document.querySelectorAll('part')).map((part) => {
    const id = part.getAttribute('id') ?? ''
    const label = names.get(id) ?? 'Percussion'
    const parsed = parsePart(part, instrumentNames)

    return { id, label, kind: rhythmKind(label), ...parsed }
  }).filter((ring) => ring.hits.length > 0)

  cycleDuration.value = Math.max(...parsedRings.map((ring) => ring.duration), 0)
  sections.value = buildSections(parsedRings, props.circularRhythm)
})

function buildSections(rings: ParsedRing[], structure?: CircularRhythmSection[]) {
  if (!structure?.length) {
    return [{
      id: 'full-track',
      rings,
      sourceDuration: cycleDuration.value,
      playbackStart: 0,
      playbackDuration: cycleDuration.value,
      repeats: 1,
    }]
  }

  const referenceMeasures = rings[0]?.measures ?? []
  let playbackMeasure = 0

  return structure.map((definition, index) => {
    const from = Math.max(1, definition.fromMeasure) - 1
    const to = Math.max(from + 1, definition.toMeasure)
    const sourceStart = referenceMeasures[from]?.start ?? 0
    const sourceEndMeasure = referenceMeasures[to - 1]
    const sourceDuration = Math.max(
      (sourceEndMeasure?.start ?? sourceStart) + (sourceEndMeasure?.duration ?? 1) - sourceStart,
      0.25,
    )
    const repeats = Math.max(1, definition.repeats ?? 1)
    const writtenMeasureCount = (to - from) * repeats
    const playbackStart = referenceMeasures[playbackMeasure]?.start ?? sourceStart
    const playbackEndMeasure = referenceMeasures[playbackMeasure + writtenMeasureCount - 1]
    const playbackDuration = Math.max(
      (playbackEndMeasure?.start ?? playbackStart) + (playbackEndMeasure?.duration ?? sourceDuration) - playbackStart,
      sourceDuration * repeats,
    )
    playbackMeasure += writtenMeasureCount

    return {
      id: `circle-${index}`,
      rings: rings.map((ring) => ({
        ...ring,
        hits: ring.measures
          .slice(from, to)
          .flatMap((measure) => measure.hits)
          .map((hit) => ({ ...hit, time: hit.time - sourceStart })),
      })),
      sourceDuration,
      playbackStart,
      playbackDuration,
      repeats,
    }
  })
}

function parsePart(part: Element, instrumentNames: Map<string, string>) {
  const hits: RhythmHit[] = []
  const measures: RhythmMeasure[] = []
  let divisions = 1
  let timeline = 0

  part.querySelectorAll(':scope > measure').forEach((measure) => {
    let cursor = 0
    let measureDuration = 0
    const measureHits: RhythmHit[] = []

    Array.from(measure.children).forEach((element) => {
      if (element.tagName === 'attributes') {
        const nextDivisions = Number(element.querySelector('divisions')?.textContent)
        if (Number.isFinite(nextDivisions) && nextDivisions > 0) divisions = nextDivisions
        return
      }

      const duration = Number(element.querySelector('duration')?.textContent) / divisions
      if (!Number.isFinite(duration)) return

      if (element.tagName === 'backup') {
        cursor -= duration
        return
      }
      if (element.tagName === 'forward') {
        cursor += duration
        measureDuration = Math.max(measureDuration, cursor)
        return
      }
      if (element.tagName !== 'note') return

      const isTiedContinuation = element.querySelector('tie[type="stop"], tied[type="stop"]') !== null
      if (!element.querySelector('rest') && !isTiedContinuation) {
        measureHits.push({
          time: cursor,
          parenthesized: element.querySelector('notehead[parentheses="yes"]') !== null,
          drumStick: instrumentNames.get(element.querySelector('instrument')?.getAttribute('id') ?? '')?.includes('side stick') ?? false,
        })
      }
      if (!element.querySelector('chord')) cursor += duration
      measureDuration = Math.max(measureDuration, cursor)
    })

    const parsedMeasure = {
      start: timeline,
      duration: measureDuration,
      hits: measureHits.map((hit) => ({ ...hit, time: hit.time + timeline })),
    }
    measures.push(parsedMeasure)
    hits.push(...parsedMeasure.hits)
    timeline += measureDuration
  })

  return { hits, measures, duration: timeline }
}

function rhythmKind(label: string): RhythmKind {
  const name = label.toLowerCase()
  if (name.includes('snare') || name.includes('caisse')) return 'snare'
  if (name.includes('kick') || name.includes('bass drum') || name.includes('surdo')) return 'kick'
  return 'other'
}
</script>

<template>
  <section v-if="showCircle && sections.length" class="circular-rhythm -mb-3 mt-0 border-t border-border pt-0" aria-label="Vue circulaire du rythme">
    <div class="flex flex-wrap items-center justify-center gap-3">
      <div
        v-for="section in sections"
        :key="section.id"
        class="flex items-center gap-1"
      >
        <svg
          class="block"
          :class="sections.length > 1 ? 'w-44 sm:w-48' : 'w-72 max-w-full'"
          viewBox="0 48 320 224"
          role="img"
          aria-label="Rythme représenté en cercle"
        >
          <template v-if="visibleRings(section).length">
          <line
            v-for="beat in beatCount(section)"
            :key="beat"
            x1="160"
            y1="160"
            :x2="pointAt((beat - 1) / beatCount(section), radiusFor(0, visibleRings(section).length)).x"
            :y2="pointAt((beat - 1) / beatCount(section), radiusFor(0, visibleRings(section).length)).y"
            class="rhythm-grid"
          />
          <line
            v-for="offBeat in beatCount(section) * offBeatCount()"
            :key="`offbeat-${offBeat}`"
            x1="160"
            y1="160"
            :x2="pointAt(offBeatProgress(offBeat, section), radiusFor(0, visibleRings(section).length)).x"
            :y2="pointAt(offBeatProgress(offBeat, section), radiusFor(0, visibleRings(section).length)).y"
            class="rhythm-offbeat-grid"
          />
          <circle
            v-for="(ring, index) in visibleRings(section)"
            :key="ring.id"
            cx="160"
            cy="160"
            :r="radiusFor(index, visibleRings(section).length)"
            class="rhythm-ring"
          />
          <line
            x1="160"
            y1="160"
            :x2="pointAt(sectionProgress(section), radiusFor(0, visibleRings(section).length)).x"
            :y2="pointAt(sectionProgress(section), radiusFor(0, visibleRings(section).length)).y"
            class="rhythm-cursor"
          />
          <g v-for="(ring, index) in visibleRings(section)" :key="`${ring.id}-hits`">
            <template v-for="(hit, hitIndex) in ring.hits" :key="hitIndex">
              <g v-if="hit.drumStick" class="rhythm-stick-hit">
                <line
                  :x1="pointAt(hit.time / section.sourceDuration, radiusFor(index, visibleRings(section).length)).x - stickSize(hit, section)"
                  :y1="pointAt(hit.time / section.sourceDuration, radiusFor(index, visibleRings(section).length)).y - stickSize(hit, section)"
                  :x2="pointAt(hit.time / section.sourceDuration, radiusFor(index, visibleRings(section).length)).x + stickSize(hit, section)"
                  :y2="pointAt(hit.time / section.sourceDuration, radiusFor(index, visibleRings(section).length)).y + stickSize(hit, section)"
                />
                <line
                  :x1="pointAt(hit.time / section.sourceDuration, radiusFor(index, visibleRings(section).length)).x - stickSize(hit, section)"
                  :y1="pointAt(hit.time / section.sourceDuration, radiusFor(index, visibleRings(section).length)).y + stickSize(hit, section)"
                  :x2="pointAt(hit.time / section.sourceDuration, radiusFor(index, visibleRings(section).length)).x + stickSize(hit, section)"
                  :y2="pointAt(hit.time / section.sourceDuration, radiusFor(index, visibleRings(section).length)).y - stickSize(hit, section)"
                />
              </g>
              <circle
                v-else
                :cx="pointAt(hit.time / section.sourceDuration, radiusFor(index, visibleRings(section).length)).x"
                :cy="pointAt(hit.time / section.sourceDuration, radiusFor(index, visibleRings(section).length)).y"
                :r="hitSize(hit, section)"
                class="rhythm-hit"
                :class="ring.kind === 'snare' ? 'rhythm-hit--snare' : ''"
              />
            </template>
          </g>
          <circle cx="160" cy="160" r="4" class="rhythm-center" />
          </template>
        </svg>
        <span
          v-if="sections.length > 1"
          class="-ml-6 text-sm font-semibold tabular-nums text-foreground/60"
          :aria-label="`Répété ${section.repeats} fois`"
        >
          x{{ section.repeats }}
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.rhythm-ring,
.rhythm-grid {
  fill: none;
  stroke: color-mix(in srgb, currentColor 28%, transparent);
}

.rhythm-grid {
  stroke-width: 2.5;
}

.rhythm-offbeat-grid {
  stroke: color-mix(in srgb, currentColor 18%, transparent);
  stroke-width: 0.75;
}

.rhythm-ring {
  stroke-width: 2.5;
}

.rhythm-cursor {
  stroke: var(--accent);
  stroke-width: 3;
}

.rhythm-hit {
  fill: currentColor;
  transition: r 120ms ease;
}

.rhythm-hit--snare {
  fill: var(--accent);
}

.rhythm-stick-hit line {
  stroke: var(--accent);
  stroke-width: 2;
  stroke-linecap: round;
}

.rhythm-center {
  fill: currentColor;
}
</style>
