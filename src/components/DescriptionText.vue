<script setup lang="ts">
import { computed } from 'vue'
import { descriptionLinks } from '@/lib/descriptionLinks'

const props = defineProps<{ text: string }>()
const parts = computed(() => descriptionLinks(props.text))
</script>

<template>
  <template v-for="(part, index) in parts" :key="index">
    <RouterLink v-if="part.href?.startsWith('/')" :to="part.href" class="text-blue-600 underline underline-offset-2 hover:text-blue-800">{{ part.text }}</RouterLink>
    <a v-else-if="part.href" :href="part.href" class="text-blue-600 underline underline-offset-2 hover:text-blue-800">{{ part.text }}</a>
    <template v-else>{{ part.text }}</template>
  </template>
</template>
