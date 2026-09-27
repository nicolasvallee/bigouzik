<script setup lang="ts">
import { Button } from '@/components/ui'
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-10 flex items-center justify-between gap-8 border-b border-border bg-background/90 px-5 py-4 backdrop-blur-xl sm:px-10 lg:px-16">
    <RouterLink class="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.08em]" to="/" aria-label="Bigouzik home">
      <span class="grid size-8 place-items-center rounded-full border border-accent font-serif text-lg font-normal tracking-normal text-accent" aria-hidden="true">B</span>
      <span>Bigouzik</span>
    </RouterLink>

    <nav class="flex items-center gap-2 sm:gap-6" aria-label="Main navigation">
      <Button :as="RouterLink" to="/" variant="ghost" size="sm">Home</Button>
      <Button :as="RouterLink" to="/back-to-batuk">Back to Batuk</Button>
    </nav>
  </header>

  <main><RouterView /></main>
</template>
