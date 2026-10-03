<script setup lang="ts">
import MusicXmlViewer from './MusicXmlViewer.vue'
import { trackId, type MusicTrack } from '@/data/trackGroups'

defineProps<{
  id: string
  tracks: MusicTrack[]
  showMusicSheets: boolean
}>()

const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
</script>

<template>
  <div :id="`track-group-${id}`" class="grid justify-items-center gap-6">
    <div
      v-for="track in tracks"
      :key="track.src"
      :id="`track-${id}-${trackId(track)}`"
      class="flex min-w-0 w-full scroll-mt-24 justify-start"
    >
      <div class="min-w-0 w-full max-w-6xl">
        <figure
          v-if="track.images?.length"
          class="mb-4 flex flex-wrap justify-start gap-3"
        >
          <img
            v-for="image in track.images"
            :key="image"
            class="aspect-[4/3] w-40 max-w-full border border-border object-cover sm:w-48"
            :src="publicAsset(image)"
            :alt="track.imageAlt || track.title"
          >
        </figure>
        <MusicXmlViewer
          :title="track.title"
          :description="track.description"
          :src="track.src"
          :show-sheet="showMusicSheets"
          :track-link="`/back-to-batuk/${id}/${trackId(track)}`"
          :kick-velocity-scale="track.kickVelocityScale"
          :side-stick-velocity-scale="track.sideStickVelocityScale"
          :sheet-scale="track.sheetScale"
          :compound="track.compound"
          :loop="track.loop"
        />
      </div>
    </div>
  </div>
</template>
