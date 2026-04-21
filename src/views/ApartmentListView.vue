<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useToast } from '@/composables/useToast'
import { listApartments } from '@/services/apartment.service'
import type { ApartmentListItemDto } from '@/types/apartment'

const toast = useToast()

const loading = ref(true)
const searchInput = ref('')
const searchQuery = ref('')
const page = ref(0)
const pageSize = ref(12)
const totalPages = ref(0)
const totalElements = ref(0)
const items = ref<ApartmentListItemDto[]>([])

const heroGradients = [
  'from-primary/35 via-surface-container-high/90 to-tertiary/15',
  'from-secondary/25 via-surface-container-low to-primary/20',
  'from-tertiary/20 via-surface-container-high to-secondary/20',
  'from-primary-container/30 via-surface-variant/80 to-primary/15',
] as const

function formatInt(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n)
}

function formatPrice(n: number | undefined) {
  if (n == null || Number.isNaN(n)) return '—'
  const abs = Math.abs(n)
  if (abs >= 1e9) {
    const t = n / 1e9
    return `${t.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tỷ`
  }
  if (abs >= 1e6) {
    const t = n / 1e6
    return `${t.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tr`
  }
  return `${formatInt(Math.round(n))} đ`
}

function formatArea(n: number | undefined) {
  if (n == null || Number.isNaN(n)) return '—'
  return `${n.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} m²`
}

function statusBadge(raw: string | undefined) {
  const s = String(raw ?? '').toUpperCase()
  if (['FOR_SALE', 'AVAILABLE', 'DANG_BAN', 'ACTIVE', 'OPEN'].some((x) => s === x || s.includes(x)))
    return { label: 'Đang bán', variant: 'sale' as const }
  if (['BOOKED', 'DEPOSIT', 'DAT_COC', 'RESERVED'].some((x) => s === x || s.includes(x)))
    return { label: 'Đã cọc', variant: 'booked' as const }
  if (['SOLD', 'DA_BAN'].some((x) => s === x || s.includes(x))) return { label: 'Đã bán', variant: 'sold' as const }
  return { label: raw?.trim() || 'Khác', variant: 'other' as const }
}

function cardDisplayName(a: ApartmentListItemDto) {
  const parts = [a.apartmentTypeName, a.code].filter(Boolean)
  return parts[0] || 'Căn hộ'
}

function cardSubtitle(a: ApartmentListItemDto) {
  const z = a.zoneName || a.zoneCode
  const p = a.projectName || a.projectCode
  if (z && p) return `${p} · ${z}`
  return p || z || ''
}

function badgeFor(a: ApartmentListItemDto) {
  return statusBadge(a.status ?? a.legalStatus)
}

function badgeClass(a: ApartmentListItemDto) {
  const v = badgeFor(a).variant
  return {
    'bg-tertiary-container text-on-tertiary-container': v === 'sale',
    'bg-secondary-container text-on-secondary-fixed-variant': v === 'booked',
    'bg-surface-variant text-on-surface-variant': v === 'sold',
    'bg-outline-variant/50 text-on-surface': v === 'other',
  }
}

async function load() {
  loading.value = true
  try {
    const data = await listApartments({
      page: page.value,
      size: pageSize.value,
      search: searchQuery.value.trim() || undefined,
    })
    items.value = data.content
    totalPages.value = data.totalPages
    totalElements.value = data.totalElements
    page.value = data.pageNumber
    pageSize.value = data.pageSize
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Không tải được danh sách căn.')
    items.value = []
  } finally {
    loading.value = false
  }
}

function applySearch() {
  searchQuery.value = searchInput.value
  page.value = 0
  load()
}

function goPrev() {
  if (page.value > 0) {
    page.value--
    load()
  }
}

function goNext() {
  if (page.value < totalPages.value - 1) {
    page.value++
    load()
  }
}

function onAdd() {
  toast.info('Thêm căn hộ — tính năng sắp ra mắt.')
}

function onMove() {
  toast.info('Di chuyển căn — tính năng sắp ra mắt.')
}

function onBulkDelete() {
  toast.info('Xóa hàng loạt — tính năng sắp ra mắt.')
}

function onEdit() {
  toast.info('Chỉnh sửa căn — tính năng sắp ra mắt.')
}

onMounted(() => {
  load()
})
</script>

<template>
  <div class="bg-background text-on-surface min-h-screen pb-28">
    <main class="mx-auto max-w-7xl space-y-6 px-4 pb-8 pt-4">
      <!-- Header + tổng -->
      <section class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 class="font-headline text-3xl font-extrabold tracking-tight text-primary">Danh sách căn hộ</h2>
          <p class="mt-1 font-medium text-on-surface-variant">Quản lý kho hàng bất động sản</p>
        </div>
        <div class="flex items-center gap-4 rounded-3xl bg-surface-container-low px-6 py-4">
          <div class="rounded-2xl bg-primary p-3">
            <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1"
              >apartment</span
            >
          </div>
          <div>
            <p class="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Tổng số căn</p>
            <p class="font-headline text-2xl font-black text-primary">
              {{ loading ? '…' : formatInt(totalElements) }}
            </p>
          </div>
        </div>
      </section>

      <!-- Thanh tìm kiếm + hành động -->
      <section
        class="sticky top-16 z-30 rounded-2xl border border-outline-variant/10 bg-background/70 py-2 backdrop-blur-md"
      >
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div
            class="flex flex-grow items-center rounded-2xl border-2 border-transparent bg-surface-container-low px-4 transition-all focus-within:border-primary/25"
          >
            <span class="material-symbols-outlined text-outline">search</span>
            <input
              v-model="searchInput"
              type="search"
              class="w-full border-none bg-transparent py-4 pl-3 text-on-surface placeholder:text-outline outline-none ring-0"
              placeholder="Tìm theo mã căn, dự án, phân khu…"
              @keyup.enter="applySearch"
            />
            <button
              type="button"
              class="material-symbols-outlined text-outline transition-colors hover:text-primary"
              aria-label="Bộ lọc nâng cao (sắp ra mắt)"
              @click="toast.info('Bộ lọc nâng cao — sắp ra mắt.')"
            >
              tune
            </button>
          </div>
          <div class="no-scrollbar flex items-center gap-3 overflow-x-auto pb-1">
            <button
              type="button"
              class="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl bg-primary px-5 py-3.5 font-bold text-on-primary shadow-lg shadow-primary/20 transition-transform active:scale-95"
              @click="onAdd"
            >
              <span class="material-symbols-outlined text-[20px]">add</span>
              Thêm
            </button>
            <button
              type="button"
              class="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl bg-surface-container-highest px-5 py-3.5 font-bold text-primary transition-all hover:bg-surface-variant"
              @click="onMove"
            >
              <span class="material-symbols-outlined text-[20px]">move_item</span>
              Di chuyển
            </button>
            <button
              type="button"
              class="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl bg-error-container px-5 py-3.5 font-bold text-on-error-container transition-all hover:opacity-90"
              @click="onBulkDelete"
            >
              <span class="material-symbols-outlined text-[20px]">delete</span>
              Xóa
            </button>
          </div>
        </div>
      </section>

      <!-- Lưới căn -->
      <div v-if="loading" class="py-16 text-center text-on-surface-variant">Đang tải…</div>
      <div
        v-else
        class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <div
          v-for="(apt, idx) in items"
          :key="apt.id"
          class="group flex flex-col overflow-hidden rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest transition-all duration-500 hover:shadow-2xl"
        >
          <div class="relative h-48 overflow-hidden">
            <div
              class="absolute inset-0 bg-gradient-to-br transition-transform duration-700 group-hover:scale-105"
              :class="heroGradients[idx % heroGradients.length]"
            />
            <div
              class="absolute inset-0 flex items-center justify-center opacity-[0.12] transition-opacity group-hover:opacity-[0.18]"
            >
              <span class="material-symbols-outlined text-[120px] text-primary">apartment</span>
            </div>
            <div
              class="absolute top-4 left-4 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider"
              :class="badgeClass(apt)"
            >
              {{ badgeFor(apt).label }}
            </div>
            <div class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/60 to-transparent p-4">
              <p class="font-headline text-lg font-bold text-white">{{ cardDisplayName(apt) }}</p>
              <p v-if="cardSubtitle(apt)" class="mt-0.5 truncate text-xs text-white/85">{{ cardSubtitle(apt) }}</p>
            </div>
          </div>
          <div class="flex flex-grow flex-col p-6">
            <div class="mb-4 flex items-start justify-between">
              <div class="flex min-w-0 flex-col">
                <span class="mb-1 text-xs font-bold uppercase text-on-surface-variant">Mã căn</span>
                <span class="truncate font-headline font-bold text-primary">{{ apt.code || '—' }}</span>
              </div>
              <div class="flex flex-shrink-0 flex-col items-end pl-2">
                <span class="mb-1 text-xs font-bold uppercase text-on-surface-variant">Diện tích</span>
                <span class="font-headline font-bold text-primary">{{ formatArea(apt.area) }}</span>
              </div>
            </div>
            <div class="mt-auto flex items-center justify-between border-t border-surface-variant/50 pt-4">
              <p class="font-headline text-2xl font-black text-primary">{{ formatPrice(apt.price) }}</p>
              <button
                type="button"
                class="rounded-xl bg-surface-container-low p-2.5 text-primary transition-all hover:bg-primary hover:text-white"
                aria-label="Sửa"
                @click="onEdit()"
              >
                <span class="material-symbols-outlined">edit</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <p
        v-if="!loading && !items.length"
        class="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest py-12 text-center text-sm text-on-surface-variant"
      >
        Không có căn hộ phù hợp. Thử đổi từ khóa tìm kiếm.
      </p>

      <div
        v-if="!loading && (totalPages > 1 || totalElements > 0)"
        class="flex flex-wrap items-center justify-between gap-2 text-sm text-on-surface-variant"
      >
        <span>Tổng {{ formatInt(totalElements) }} — Trang {{ page + 1 }} / {{ totalPages || 1 }}</span>
        <div class="flex gap-2">
          <button
            type="button"
            class="rounded-lg border border-outline-variant/40 px-3 py-1.5 font-medium disabled:opacity-40"
            :disabled="page <= 0 || loading"
            @click="goPrev"
          >
            Trước
          </button>
          <button
            type="button"
            class="rounded-lg border border-outline-variant/40 px-3 py-1.5 font-medium disabled:opacity-40"
            :disabled="page >= totalPages - 1 || loading || totalPages <= 1"
            @click="goNext"
          >
            Sau
          </button>
        </div>
      </div>
    </main>
  </div>
</template>
