<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

async function onLogout() {
  auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-dvh flex flex-col bg-background text-on-background">
    <header
      class="sticky top-0 z-40 border-b border-outline-variant/20 bg-[#f3faff]/95 backdrop-blur-sm"
    >
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-2xl text-primary">apartment</span>
          <span class="font-headline text-lg font-extrabold tracking-tight text-primary">ThanhDatAP</span>
          <span class="hidden text-xs font-semibold uppercase tracking-widest text-outline sm:inline">
            Quản trị
          </span>
        </div>
        <div class="flex items-center gap-4">
          <p v-if="auth.user" class="hidden truncate text-sm text-on-surface-variant sm:block max-w-[12rem]">
            {{ auth.user.fullName || auth.user.email }}
          </p>
          <button
            type="button"
            class="rounded-lg border border-outline-variant/40 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-surface-container-low"
            @click="onLogout"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
    <main class="flex-1">
      <RouterView />
    </main>
  </div>
</template>
