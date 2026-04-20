<script setup lang="ts">
import { useConfirm } from '@/composables/useConfirm'

const { open, title, message, yes, no } = useConfirm()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[210] flex items-center justify-center bg-on-surface/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="'confirm-title'"
      @click.self="no"
    >
      <div
        class="w-full max-w-md rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-xl"
        @click.stop
      >
        <h2 id="confirm-title" class="font-headline text-lg font-bold text-on-surface">{{ title }}</h2>
        <p class="mt-3 text-sm leading-relaxed text-on-surface-variant whitespace-pre-wrap">{{ message }}</p>
        <div class="mt-6 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-lg border border-outline-variant/40 px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low"
            @click="no"
          >
            Hủy
          </button>
          <button
            type="button"
            class="rounded-lg bg-error px-4 py-2 text-sm font-bold text-on-error hover:opacity-90"
            @click="yes"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
