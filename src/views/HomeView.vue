<script setup lang="ts">
import { useCounterStore } from '@/stores/counter'

const counter = useCounterStore()
</script>

<template>
  <div class="min-h-dvh flex flex-col items-center justify-center p-6 bg-surface text-on-surface">
    <div class="max-w-lg w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-8 shadow-lg shadow-on-surface/5">
      <h1 class="text-2xl font-bold tracking-tight text-on-surface mb-2">Vue + Vite</h1>
      <p class="text-on-surface-variant text-sm mb-8">
        Base project: Vue Router, Pinia, Tailwind CSS 4, TypeScript. Extend from here.
      </p>

      <div class="rounded-lg bg-surface-container-low p-6 mb-6">
        <p class="text-sm font-medium text-on-surface-variant mb-2">Pinia example</p>
        <p class="text-3xl font-bold text-primary tabular-nums">{{ counter.count }}</p>
        <p class="text-xs text-outline mt-1">Double: {{ counter.doubleCount }}</p>
        <button
          type="button"
          class="mt-4 w-full py-3 rounded-lg primary-gradient text-on-primary font-semibold text-sm hover:opacity-90 transition-opacity"
          @click="counter.increment"
        >
          Increment
        </button>
      </div>

      <a
        class="text-sm font-semibold text-primary hover:underline"
        href="https://vuejs.org/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Vue docs →
      </a>
    </div>
  </div>
</template>
