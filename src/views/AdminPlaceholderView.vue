<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const title = computed(() => (route.meta.title as string) || 'Trang')
</script>

<template>
  <div class="mx-auto max-w-lg px-4 py-16 pb-28 text-center">
    <p class="font-headline text-2xl font-extrabold text-on-surface">{{ title }}</p>
    <p class="mt-3 text-sm text-on-surface-variant">Chức năng đang được hoàn thiện.</p>
  </div>
</template>
