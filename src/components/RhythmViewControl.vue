<script setup lang="ts">
withDefaults(defineProps<{
  mode: 'sheet' | 'circle'
  active?: boolean
  compact?: boolean
  as?: 'button' | 'span'
}>(), { active: false, compact: false, as: 'button' })
</script>

<template>
  <component
    :is="as"
    :type="as === 'button' ? 'button' : undefined"
    :aria-pressed="as === 'button' ? active : undefined"
    class="inline-flex items-center whitespace-nowrap rounded-full border border-foreground align-middle font-semibold"
    :class="[
      compact ? 'h-7 gap-1.5 px-2.5 text-xs' : 'h-9 gap-2 px-4 text-sm',
      active ? 'bg-foreground text-background' : 'text-foreground',
      as === 'button' && 'transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground',
      as === 'button' && !active && 'hover:bg-foreground/5',
    ]"
  >
    <svg v-if="mode === 'sheet'" :class="compact ? 'h-4 w-6' : 'h-5 w-8'" viewBox="0 0 32 24" aria-hidden="true">
      <g fill="currentColor" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
        <path d="M7.5 17V5l10-2v12M7.5 6l10-2" fill="none" />
        <ellipse cx="6" cy="17" rx="2.5" ry="1.75" transform="rotate(-20 6 17)" stroke="none" />
        <ellipse cx="16" cy="15" rx="2.5" ry="1.75" transform="rotate(-20 16 15)" stroke="none" />
      </g>
      <g fill="var(--accent)" stroke="var(--accent)" stroke-width="1.75" stroke-linecap="round">
        <path d="M27.5 17V4" fill="none" />
        <ellipse cx="26" cy="17" rx="2.5" ry="1.75" transform="rotate(-20 26 17)" stroke="none" />
      </g>
    </svg>
    <svg v-else :class="compact ? 'h-4 w-4' : 'h-5 w-5'" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="#a3a3a3" stroke-width="1.5" />
      <circle cx="12" cy="12" r="5" fill="none" stroke="#a3a3a3" stroke-width="1.5" />
      <circle cx="12" cy="3" r="1.7" fill="currentColor" />
      <circle cx="19.8" cy="7.5" r="1.7" fill="currentColor" />
      <circle cx="12" cy="17" r="1.7" fill="var(--accent)" />
    </svg>
    {{ mode === 'sheet' ? 'Partoches' : 'Cercles' }}
  </component>
</template>
