<script setup lang="ts">
import { useCounterStore } from '@/stores/counter'

const counter = useCounterStore()
</script>

<template>
  <div class="min-h-dvh flex flex-col items-center justify-center p-6 bg-surface text-on-surface">
    <div class="max-w-lg w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-8 shadow-lg shadow-on-surface/5">
      <h1 class="text-2xl font-bold tracking-tight text-on-surface mb-2">ThanhDatAP — Giao diện mẫu</h1>
      <p class="text-on-surface-variant text-sm mb-8">
        Nền tảng: Vue Router, Pinia, Tailwind CSS 4, TypeScript. Trang này chỉ dùng minh họa nếu bạn thêm lại
        vào router.
      </p>

      <div class="rounded-lg bg-surface-container-low p-6 mb-6">
        <p class="text-sm font-medium text-on-surface-variant mb-2">Ví dụ Pinia (bộ đếm)</p>
        <p class="text-3xl font-bold text-primary tabular-nums">{{ counter.count }}</p>
        <p class="text-xs text-outline mt-1">Gấp đôi: {{ counter.doubleCount }}</p>
        <button
          type="button"
          class="mt-4 w-full py-3 rounded-lg primary-gradient text-on-primary font-semibold text-sm hover:opacity-90 transition-opacity"
          @click="counter.increment"
        >
          Tăng thêm 1
        </button>
      </div>

      <a
        class="text-sm font-semibold text-primary hover:underline"
        href="https://vuejs.org/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Tài liệu Vue (tiếng Anh) →
      </a>
    </div>
  </div>
</template>
