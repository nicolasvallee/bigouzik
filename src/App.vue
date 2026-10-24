<script setup lang="ts">
import { Button } from '@/components/ui'
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header class="border-b border-border bg-background px-5 py-2 sm:px-16 lg:px-36">
    <div class="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3">
      <RouterLink class="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.08em]" to="/" aria-label="Bigouzik home">
        <span>Bigouzik</span>
      </RouterLink>

      <nav class="flex items-center gap-2 sm:gap-6" aria-label="Main navigation">
        <Button :as="RouterLink" to="/tuto" variant="ghost" size="sm">Tuto</Button>
        <Button :as="RouterLink" to="/back-to-batuk">Back to Batuk</Button>
      </nav>
    </div>
  </header>

  <main><RouterView /></main>
</template>
