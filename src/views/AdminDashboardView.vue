<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div class="mx-auto max-w-4xl px-6 py-10">
    <h1 class="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
      Bảng điều khiển
    </h1>
    <p class="mt-2 text-on-surface-variant">
      Đăng nhập quản trị thành công. Bạn có thể mở rộng các module quản lý cư trú và bất động sản tại đây.
    </p>
    <div
      v-if="auth.user"
      class="mt-8 rounded-xl border border-outline-variant/25 bg-surface-container-low p-6"
    >
      <p class="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Phiên hiện tại</p>
      <p class="mt-2 text-lg font-semibold text-on-surface">{{ auth.user.fullName || '—' }}</p>
      <p class="mt-1 text-sm text-on-surface-variant">
        <span class="font-medium text-on-surface">Địa chỉ thư điện tử:</span>
        {{ auth.user.email }}
      </p>
    </div>
  </div>
</template>
