<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, remove } = useToast()

function bg(type: string) {
  if (type === 'success') return 'border-primary/30 bg-primary text-on-primary'
  if (type === 'error') return 'border-error bg-error-container text-on-error-container'
  return 'border-outline-variant/30 bg-surface-container-high text-on-surface'
}
</script>

<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed top-16 right-4 z-[200] flex max-w-md flex-col gap-2 md:top-20"
      aria-live="polite"
    >
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-sm"
          :class="bg(t.type)"
          role="status"
        >
          <span class="material-symbols-outlined shrink-0 text-xl">{{
            t.type === 'success' ? 'check_circle' : t.type === 'error' ? 'error' : 'info'
          }}</span>
          <p class="min-w-0 flex-1 leading-snug">{{ t.message }}</p>
          <button
            type="button"
            class="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100"
            aria-label="Đóng"
            @click="remove(t.id)"
          >
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-move,
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(0.5rem);
}
</style>
