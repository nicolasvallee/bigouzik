<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { trackGroups, trackId } from '@/data/trackGroups'
import MusicTrackGroup from './MusicTrackGroup.vue'
import DescriptionText from './DescriptionText.vue'

const route = useRoute()
const defaultGroup = trackGroups[0]?.id ?? ''
const selectedGroup = computed(() => {
  const groupId = String(route.params.groupId || '')
  return trackGroups.some((group) => group.id === groupId) ? groupId : defaultGroup
})

const activeGroup = computed(() => trackGroups.find((group) => group.id === selectedGroup.value))
const showSheets = ref(false)
const showCircles = ref(false)
const playbackSpeed = ref(1)
const playbackSpeedOptions = [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3]
const selectedInstrument = ref<'both' | 'snare' | 'kick'>('both')

watch(selectedGroup, () => {
  playbackSpeed.value = 1
  selectedInstrument.value = 'both'
})

const selectedTrack = computed(() => {
  const track = String(route.params.trackId || '')
  const group = trackGroups.find((item) => item.id === selectedGroup.value)

  return group?.tracks.some((item) => trackId(item) === track) ? track : ''
})

watch(
  [selectedGroup, selectedTrack],
  async ([groupId, id]) => {
    if (!id) return

    await nextTick()
    document.getElementById(`track-${groupId}-${id}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  },
  { immediate: true },
)
</script>

<template>
  <section id="back-to-batuk" class="flex min-h-svh items-start bg-background-soft px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6 scroll-mt-20 sm:px-16 lg:px-36" aria-labelledby="batuk-title">
    <div class="mx-auto w-full max-w-6xl">
      <h2 id="batuk-title" class="max-w-[12ch] font-serif text-[clamp(2.75rem,7vw,5.5rem)] font-normal leading-[0.9]">Back to Batuk</h2>
      <div class="mt-8 -mx-5 bg-background-soft/95 px-5 sm:-mx-16 sm:px-16 lg:-mx-36 lg:px-36">
        <div class="mx-auto max-w-6xl border-y border-border py-3">
          <div class="flex flex-wrap gap-2" aria-label="Options d'affichage" role="group">
          <button
            class="inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors"
            :class="showSheets ? 'border-foreground bg-foreground text-background' : 'border-foreground text-foreground hover:bg-foreground/5'"
            type="button"
            :aria-pressed="showSheets"
            @click="showSheets = !showSheets"
          >
            <svg class="h-5 w-8" viewBox="0 0 32 24" aria-hidden="true">
              <g :fill="showSheets ? 'currentColor' : '#101010'" :stroke="showSheets ? 'currentColor' : '#101010'" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M7.5 17V5l10-2v12" fill="none" />
                      <path d="M7.5 6l10-2" fill="none" />
                <ellipse cx="6" cy="17" rx="2.5" ry="1.75" transform="rotate(-20 6 17)" stroke="none" />
                <ellipse cx="16" cy="15" rx="2.5" ry="1.75" transform="rotate(-20 16 15)" stroke="none" />
              </g>
              <g fill="var(--accent)" stroke="var(--accent)" stroke-width="1.75" stroke-linecap="round">
                      <path d="M27.5 17V4" fill="none" />
                <ellipse cx="26" cy="17" rx="2.5" ry="1.75" transform="rotate(-20 26 17)" stroke="none" />
              </g>
            </svg>
            Partoches
          </button>
          <button
            class="inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors"
            :class="showCircles ? 'border-foreground bg-foreground text-background' : 'border-foreground text-foreground hover:bg-foreground/5'"
            type="button"
            :aria-pressed="showCircles"
            @click="showCircles = !showCircles"
          >
                      <svg class="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" fill="none" stroke="#a3a3a3" stroke-width="1.5" />
                        <circle cx="12" cy="12" r="5" fill="none" stroke="#a3a3a3" stroke-width="1.5" />
                        <circle cx="12" cy="3" r="1.7" :fill="showCircles ? 'currentColor' : '#101010'" />
                        <circle cx="19.8" cy="7.5" r="1.7" :fill="showCircles ? 'currentColor' : '#101010'" />
                        <circle cx="12" cy="17" r="1.7" fill="var(--accent)" />
                      </svg>
            Cercles
          </button>
          </div>
        </div>
      </div>
      <div class="flex flex-wrap gap-2 border-b border-border py-3" aria-label="Track groups" role="tablist">
        <RouterLink
          v-for="group in trackGroups"
          :key="group.id"
          :to="`/back-to-batuk/${group.id}`"
          class="inline-flex h-9 items-center rounded-full border px-4 text-left text-sm font-semibold capitalize transition-colors"
          :class="selectedGroup === group.id ? 'border-foreground bg-foreground text-background' : 'border-foreground text-foreground hover:bg-foreground/5'"
          role="tab"
          :aria-selected="selectedGroup === group.id"
          :aria-controls="`track-group-panel-${group.id}`"
        >
          <span>{{ group.title }}</span>
        </RouterLink>
      </div>
      <p v-if="activeGroup?.description" class="mt-8 max-w-2xl text-base leading-relaxed text-foreground/65">
        <DescriptionText :text="activeGroup.description" />
      </p>
      <div v-if="selectedGroup" :id="`track-group-panel-${selectedGroup}`" class="mt-5">
        <template v-for="group in trackGroups" :key="group.id">
          <MusicTrackGroup
            v-if="selectedGroup === group.id"
            :id="group.id"
            :tracks="group.tracks"
            :show-sheets="showSheets"
            :show-circles="showCircles"
            :playback-speed="playbackSpeed"
            :selected-track="selectedInstrument"
          />
        </template>
      </div>
    </div>
    <div class="fixed inset-x-0 bottom-0 z-40 flex flex-nowrap items-center justify-center gap-[0.3em] whitespace-nowrap text-[min(17px,3.2vw)] border-t-1 border-foreground bg-background-soft px-[0.4em] pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-lg" aria-label="Réglages de lecture" role="group">
      <label class="inline-flex shrink-0 items-center gap-[0.3em] font-semibold text-foreground">
        <span>Vitesse</span>
        <span class="relative shrink-0">
          <select
            v-model.number="playbackSpeed"
            class="h-[2.5em] w-[4.2em] appearance-none rounded-full border border-foreground bg-background pl-[0.6em] pr-[1.2em] text-[inherit] font-semibold text-foreground outline-none transition-colors hover:bg-background-soft focus-visible:ring-2 focus-visible:ring-foreground/30"
            aria-label="Vitesse de lecture"
          >
            <option v-for="speed in playbackSpeedOptions" :key="speed" :value="speed">
              {{ speed.toFixed(1) }}x
            </option>
          </select>
          <svg class="pointer-events-none absolute right-[0.4em] top-1/2 h-[0.75em] w-[0.75em] -translate-y-1/2 text-foreground" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="m3 4.5 3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </label>
      <button
        v-for="track in ['both', 'snare', 'kick'] as const"
        :key="track"
        class="inline-flex h-[2.5em] shrink-0 items-center gap-[0.25em] rounded-full border px-[0.6em] text-[inherit] font-semibold capitalize transition-colors"
        :class="selectedInstrument === track ? 'border-foreground bg-foreground text-background' : 'border-foreground bg-background text-foreground hover:bg-background-soft'"
        type="button"
        :aria-pressed="selectedInstrument === track"
        @click="selectedInstrument = track"
      >
        <svg class="h-[1.35em] w-[1.35em] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <g v-if="track === 'both'">
            <path d="M11 4 6 8H3v8h3l5 4Z" />
            <path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
          </g>
          <g v-else-if="track === 'snare'">
            <path d="M5 2 15 10M19 2 9 10" />
            <ellipse cx="12" cy="10" rx="9" ry="3" />
            <path d="M3 10v8c0 1.7 4 3 9 3s9-1.3 9-3v-8M7 13v6m5-5v6m5-7v6" />
          </g>
          <g v-else>
            <path d="M4 21 18 5M20 21 6 5" stroke-width="2" />
            <circle cx="18" cy="5" r="3.5" fill="currentColor" stroke="none" />
            <circle cx="6" cy="5" r="3.5" fill="currentColor" stroke="none" />
          </g>
        </svg>
        {{ track === 'both' ? 'Tout' : track === 'snare' ? 'Caisse' : 'Surdo' }}
      </button>
    </div>
  </section>
</template>
