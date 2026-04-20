<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const avatarLetter = computed(() => {
  const n = auth.user?.fullName?.trim() || auth.user?.email || '?'
  return n.charAt(0).toUpperCase()
})

const isDashboard = computed(() => route.name === 'admin-dashboard')

async function onLogout() {
  auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-dvh bg-background text-on-background">
    <header
      class="fixed top-0 z-40 w-full bg-[#f3faff]/80 shadow-[0_4px_20px_rgba(7,30,39,0.04)] backdrop-blur-xl dark:bg-[#071e27]/80"
    >
      <div class="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
        <div class="flex items-center gap-4">
          <button
            type="button"
            class="material-symbols-outlined rounded-full p-2 text-[#003652] transition-colors hover:bg-[#cfe6f2] active:scale-95 dark:text-[#cfe6f2]"
            aria-label="Menu"
          >
            menu
          </button>
          <h1 class="font-headline text-xl font-black tracking-tight text-[#003652] dark:text-[#f3faff]">
            ThanhDatAP
          </h1>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="material-symbols-outlined rounded-full p-2 text-[#003652] transition-colors hover:bg-[#cfe6f2] active:scale-95 dark:text-[#cfe6f2]"
            aria-label="Tìm kiếm"
          >
            search
          </button>
          <div
            class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary-container text-xs font-bold text-white ring-2 ring-outline-variant/15"
          >
            {{ avatarLetter }}
          </div>
          <button
            type="button"
            class="hidden rounded-lg border border-outline-variant/40 px-3 py-1.5 text-xs font-semibold text-primary sm:inline"
            @click="onLogout"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </header>

    <div class="pt-16">
      <RouterView />
    </div>

    <nav
      class="fixed bottom-0 left-0 z-50 flex w-full justify-around rounded-t-3xl border-t border-[#c1c7ce]/15 bg-[#f3faff]/90 px-4 pt-2 pb-6 shadow-[0_-8px_32px_rgba(7,30,39,0.06)] backdrop-blur-2xl dark:bg-[#071e27]/90"
    >
      <RouterLink
        class="flex flex-col items-center justify-center rounded-2xl p-2 transition-colors"
        :class="
          route.name === 'admin-dashboard'
            ? 'scale-90 bg-gradient-to-br from-[#003652] to-[#1a4d6d] px-5 py-2 text-white'
            : 'text-[#41474d] hover:text-[#003652] dark:text-[#c1c7ce]'
        "
        :to="{ name: 'admin-dashboard' }"
      >
        <span
          class="material-symbols-outlined"
          :style="route.name === 'admin-dashboard' ? 'font-variation-settings: \'FILL\' 1' : ''"
          >dashboard</span
        >
        <span class="text-xs font-semibold">Bảng điều khiển</span>
      </RouterLink>
      <RouterLink
        class="flex flex-col items-center justify-center rounded-2xl p-2 transition-colors"
        :class="
          route.name === 'admin-inventory'
            ? 'scale-90 bg-gradient-to-br from-[#003652] to-[#1a4d6d] px-5 py-2 text-white'
            : 'text-[#41474d] hover:text-[#003652] dark:text-[#c1c7ce]'
        "
        :to="{ name: 'admin-inventory' }"
      >
        <span class="material-symbols-outlined">home_work</span>
        <span class="text-xs font-semibold">Tồn kho</span>
      </RouterLink>
      <RouterLink
        class="flex flex-col items-center justify-center rounded-2xl p-2 transition-colors"
        :class="
          route.name === 'admin-settings'
            ? 'scale-90 bg-gradient-to-br from-[#003652] to-[#1a4d6d] px-5 py-2 text-white'
            : 'text-[#41474d] hover:text-[#003652] dark:text-[#c1c7ce]'
        "
        :to="{ name: 'admin-settings' }"
      >
        <span class="material-symbols-outlined">settings</span>
        <span class="text-xs font-semibold">Cài đặt</span>
      </RouterLink>
    </nav>

    <button
      v-if="isDashboard"
      type="button"
      class="fixed right-6 bottom-28 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-2xl ring-4 ring-white transition-transform active:scale-90"
      aria-label="Thêm nhanh"
    >
      <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1">add</span>
    </button>
  </div>
</template>
