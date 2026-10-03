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
const showMusicSheets = ref(true)

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
  <section id="back-to-batuk" class="flex min-h-svh items-center bg-background-soft px-5 pb-20 pt-32 scroll-mt-20 sm:px-16 lg:px-36" aria-labelledby="batuk-title">
    <div class="mx-auto w-full max-w-6xl">
      <h2 id="batuk-title" class="max-w-[12ch] font-serif text-[clamp(2.75rem,7vw,5.5rem)] font-normal leading-[0.9]">Back to Batuk</h2>
      <div class="mt-6 flex justify-start">
        <label class="inline-flex cursor-pointer items-center gap-3 text-sm font-semibold text-foreground/70">
          <span>Afficher les partoches</span>
          <input
            v-model="showMusicSheets"
            class="peer sr-only"
            type="checkbox"
            role="switch"
            aria-label="Afficher les partitions"
          />
          <span
            class="relative h-6 w-10 rounded-full bg-border transition-colors peer-checked:bg-foreground peer-checked:[&>span]:translate-x-4 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
            aria-hidden="true"
          >
            <span class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform" />
          </span>
        </label>
      </div>
      <div class="mt-6 border-y border-border" aria-label="Track groups" role="tablist">
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
            :show-music-sheets="showMusicSheets"
          />
        </template>
      </div>
    </div>
  </section>
</template>
