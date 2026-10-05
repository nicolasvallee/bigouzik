<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { trackGroups, trackId } from '@/data/trackGroups'
import MusicTrackGroup from './MusicTrackGroup.vue'

const route = useRoute()
const defaultGroup = trackGroups[0]?.id ?? ''
const selectedGroup = computed(() => {
  const groupId = String(route.params.groupId || '')
  return trackGroups.some((group) => group.id === groupId) ? groupId : defaultGroup
})

const activeGroup = computed(() => trackGroups.find((group) => group.id === selectedGroup.value))
const showSheets = ref(true)
const showCircles = ref(false)

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
  <section id="back-to-batuk" class="flex min-h-svh items-center bg-background-soft px-5 pb-20 pt-16 scroll-mt-20 sm:px-16 lg:px-36" aria-labelledby="batuk-title">
    <div class="mx-auto w-full max-w-6xl">
      <h2 id="batuk-title" class="max-w-[12ch] font-serif text-[clamp(2.75rem,7vw,5.5rem)] font-normal leading-[0.9]">Back to Batuk</h2>
      <div class="sticky top-0 z-30 isolate mt-8 -mx-5 bg-background-soft/95 px-5 backdrop-blur sm:-mx-16 sm:px-16 lg:-mx-36 lg:px-36">
        <div class="mx-auto max-w-6xl border-y border-border py-3">
          <div class="flex flex-wrap gap-2" aria-label="Options d'affichage" role="group">
          <button
            class="inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors"
            :class="showSheets ? 'border-foreground bg-foreground text-background' : 'border-border text-foreground/65 hover:border-foreground/50 hover:text-foreground'"
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
            :class="showCircles ? 'border-foreground bg-foreground text-background' : 'border-border text-foreground/65 hover:border-foreground/50 hover:text-foreground'"
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
      <div class="border-b border-border" aria-label="Track groups" role="tablist">
        <RouterLink
          v-for="group in trackGroups"
          :key="group.id"
          :to="`/back-to-batuk/${group.id}`"
          class="mr-6 inline-flex py-4 text-left text-base font-semibold capitalize transition-colors last:mr-0 sm:text-lg"
          :class="selectedGroup === group.id ? 'text-foreground' : 'text-foreground/45 hover:text-foreground'"
          role="tab"
          :aria-selected="selectedGroup === group.id"
          :aria-controls="`track-group-panel-${group.id}`"
        >
          <span>{{ group.title }}</span>
        </RouterLink>
      </div>
      <p v-if="activeGroup?.description" class="mt-8 max-w-2xl text-base leading-relaxed text-foreground/65">
        {{ activeGroup.description }}
      </p>
      <div v-if="selectedGroup" :id="`track-group-panel-${selectedGroup}`" class="mt-5">
        <template v-for="group in trackGroups" :key="group.id">
          <MusicTrackGroup
            v-if="selectedGroup === group.id"
            :id="group.id"
            :tracks="group.tracks"
            :show-sheets="showSheets"
            :show-circles="showCircles"
          />
        </template>
      </div>
    </div>
  </section>
</template>
