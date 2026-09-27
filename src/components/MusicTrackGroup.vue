<script setup lang="ts">
import MusicXmlViewer from './MusicXmlViewer.vue'
import type { MusicTrack } from '@/data/trackGroups'

defineProps<{
  id: string
  tracks: MusicTrack[]
}>()

const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
</script>

<template>
  <div :id="`track-group-${id}`" class="grid justify-items-center gap-6">
    <div
      v-for="track in tracks"
      :key="track.src"
      class="flex min-w-0 w-full justify-start"
    >
      <div class="min-w-0 w-full max-w-6xl">
        <figure v-if="track.image" class="mb-4 flex justify-start">
          <img
            class="aspect-[4/3] w-64 max-w-full border border-border object-cover"
            :src="publicAsset(track.image)"
            :alt="track.imageAlt || track.title"
          >
        </figure>
        <MusicXmlViewer
          :title="track.title"
          :src="track.src"
          :kick-velocity-scale="track.kickVelocityScale"
          :side-stick-velocity-scale="track.sideStickVelocityScale"
          :sheet-scale="track.sheetScale"
          :loop="track.loop"
        />
      </div>
    </div>
  </div>
</template>
