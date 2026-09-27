<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { trackGroups } from '@/data/trackGroups'
import MusicTrackGroup from './MusicTrackGroup.vue'

const route = useRoute()
const defaultGroup = trackGroups[0]?.id ?? ''
const selectedGroup = computed(() => {
  const groupId = String(route.params.groupId || '')
  return trackGroups.some((group) => group.id === groupId) ? groupId : defaultGroup
})
</script>

<template>
  <section id="back-to-batuk" class="flex min-h-svh items-center bg-background-soft px-5 pb-20 pt-32 scroll-mt-20 sm:px-16 lg:px-36" aria-labelledby="batuk-title">
    <div class="mx-auto w-full max-w-6xl">
      <h2 id="batuk-title" class="max-w-[12ch] font-serif text-[clamp(2.75rem,7vw,5.5rem)] font-normal leading-[0.9]">Back to Batuk</h2>
      <div class="mt-12 border-y border-border" aria-label="Track groups" role="tablist">
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
      <div v-if="selectedGroup" :id="`track-group-panel-${selectedGroup}`" class="mt-20">
        <template v-for="group in trackGroups" :key="group.id">
          <MusicTrackGroup
            v-if="selectedGroup === group.id"
            :id="group.id"
            :tracks="group.tracks"
          />
        </template>
      </div>
    </div>
  </section>
</template>
