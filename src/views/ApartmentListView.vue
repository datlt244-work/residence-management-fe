<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { getApartmentDetail, getApartmentOwnerInfo, listApartments } from '@/services/apartment.service'
import { listProjectsManagement } from '@/services/project.service'
import type { ApartmentAdminDto, ApartmentListItemDto, ApartmentOwnerInfoDto } from '@/types/apartment'
import type { ProjectManagementSidebarDto } from '@/types/project'

const toast = useToast()
const auth = useAuthStore()

const canLoadOwnerSensitive = computed(() => {
  const r = auth.user?.role?.toUpperCase()
  return r === 'ADMIN' || r === 'MANAGER'
})

const loading = ref(true)
const projectsTree = ref<ProjectManagementSidebarDto[]>([])
const searchInput = ref('')
const searchQuery = ref('')
const filterProjectId = ref('')
const filterZoneId = ref('')
const filterAptTypeId = ref('')
const page = ref(0)
const pageSize = ref(12)
const totalPages = ref(0)
const totalElements = ref(0)
const items = ref<ApartmentListItemDto[]>([])

const showDetailModal = ref(false)
const detailLoading = ref(false)
const apartmentDetail = ref<ApartmentAdminDto | null>(null)
const ownerInfoExtra = ref<ApartmentOwnerInfoDto | null>(null)
const ownerInfoLoading = ref(false)

const zoneOptions = computed(() => {
  const p = projectsTree.value.find((x) => x.id === filterProjectId.value)
  return p?.zones ?? []
})

const aptTypeOptions = computed(() => {
  const z = zoneOptions.value.find((x) => x.id === filterZoneId.value)
  return z?.apartmentTypes ?? []
})

watch(filterProjectId, () => {
  filterZoneId.value = ''
  filterAptTypeId.value = ''
})

watch(filterZoneId, () => {
  filterAptTypeId.value = ''
})

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

function formatDt(iso: string | undefined) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('vi-VN')
  } catch {
    return iso
  }
}

function displayField(v: string | null | undefined) {
  if (v == null || v === '') return '—'
  return v
}

function displayOwnerPhone() {
  if (ownerInfoExtra.value) return displayField(ownerInfoExtra.value.ownerPhone)
  return displayField(apartmentDetail.value?.ownerPhone)
}

function displaySource() {
  if (ownerInfoExtra.value) return displayField(ownerInfoExtra.value.source)
  return displayField(apartmentDetail.value?.source)
}

async function loadOwnerSensitive() {
  const id = apartmentDetail.value?.id
  if (!id) return
  ownerInfoLoading.value = true
  try {
    ownerInfoExtra.value = await getApartmentOwnerInfo(id)
    toast.success('Đã tải SĐT chủ & nguồn.')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Không tải được thông tin chủ & nguồn.')
  } finally {
    ownerInfoLoading.value = false
  }
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

async function loadProjectsTree() {
  try {
    projectsTree.value = await listProjectsManagement()
  } catch {
    projectsTree.value = []
  }
}

async function load() {
  loading.value = true
  try {
    const data = await listApartments({
      page: page.value,
      size: pageSize.value,
      search: searchQuery.value.trim() || undefined,
      projectId: filterProjectId.value || undefined,
      zoneId: filterZoneId.value || undefined,
      apartmentTypeId: filterAptTypeId.value || undefined,
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

/** Đồng bộ ô tìm + bộ lọc GET /apartments (page, size, projectId, zoneId, apartmentTypeId, search). */
function applyFilters() {
  searchQuery.value = searchInput.value
  page.value = 0
  load()
}

function clearApartmentFilters() {
  searchInput.value = ''
  searchQuery.value = ''
  filterProjectId.value = ''
  filterZoneId.value = ''
  filterAptTypeId.value = ''
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

function closeApartmentDetail() {
  showDetailModal.value = false
  apartmentDetail.value = null
  ownerInfoExtra.value = null
}

async function openApartmentDetail(row: ApartmentListItemDto) {
  showDetailModal.value = true
  apartmentDetail.value = null
  ownerInfoExtra.value = null
  detailLoading.value = true
  try {
    apartmentDetail.value = await getApartmentDetail(row.id)
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Không tải được chi tiết căn hộ.')
    showDetailModal.value = false
  } finally {
    detailLoading.value = false
  }
}

onMounted(async () => {
  await loadProjectsTree()
  await load()
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

      <!-- Bộ lọc API: projectId, zoneId, apartmentTypeId -->
      <section class="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm">
        <p class="mb-3 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Lọc theo hạ tầng</p>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
              >Dự án</label
            >
            <select
              v-model="filterProjectId"
              class="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Tất cả dự án</option>
              <option v-for="p in projectsTree" :key="p.id" :value="p.id">{{ p.name }} ({{ p.code }})</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
              >Phân khu</label
            >
            <select
              v-model="filterZoneId"
              class="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
              :disabled="!filterProjectId"
            >
              <option value="">Tất cả phân khu</option>
              <option v-for="z in zoneOptions" :key="z.id" :value="z.id">{{ z.name }} ({{ z.code || '—' }})</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
              >Loại căn</label
            >
            <select
              v-model="filterAptTypeId"
              class="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
              :disabled="!filterZoneId"
            >
              <option value="">Tất cả loại</option>
              <option v-for="t in aptTypeOptions" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
          </div>
        </div>
        <div class="mt-3 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/40 px-4 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-low"
            @click="clearApartmentFilters"
          >
            <span class="material-symbols-outlined text-[18px]">filter_alt_off</span>
            Xóa bộ lọc
          </button>
          <button
            type="button"
            class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary"
            @click="applyFilters"
          >
            Áp dụng lọc
          </button>
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
              placeholder="Tìm theo mã căn (không phân biệt hoa thường)"
              @keyup.enter="applyFilters"
            />
            <button
              type="button"
              class="material-symbols-outlined text-outline transition-colors hover:text-primary"
              aria-label="Áp dụng tìm theo mã căn"
              @click="applyFilters"
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
                aria-label="Chi tiết căn hộ"
                @click="openApartmentDetail(apt)"
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

    <!-- GET /apartments/{id} -->
    <div
      v-if="showDetailModal"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="apt-detail-title"
      @click.self="closeApartmentDetail"
    >
      <div
        class="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-xl"
        @click.stop
      >
        <h2 id="apt-detail-title" class="font-headline text-lg font-bold text-on-surface">Chi tiết căn hộ</h2>
        <p class="mt-1 text-xs text-on-surface-variant">
          Một số trường có thể bị ẩn tùy vai trò (ví dụ STAFF không xem số chủ nhà / nguồn).
        </p>

        <div v-if="detailLoading" class="mt-6 py-10 text-center text-sm text-on-surface-variant">Đang tải…</div>
        <dl v-else-if="apartmentDetail" class="mt-4 space-y-3 text-sm">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt class="text-xs font-semibold uppercase text-on-surface-variant">Mã căn</dt>
              <dd class="font-medium text-on-surface">{{ displayField(apartmentDetail.code) }}</dd>
            </div>
            <div>
              <dt class="text-xs font-semibold uppercase text-on-surface-variant">Trạng thái</dt>
              <dd class="text-on-surface">{{ displayField(apartmentDetail.status) }}</dd>
            </div>
            <div>
              <dt class="text-xs font-semibold uppercase text-on-surface-variant">Dự án</dt>
              <dd class="text-on-surface">{{ displayField(apartmentDetail.projectName ?? apartmentDetail.projectCode) }}</dd>
            </div>
            <div>
              <dt class="text-xs font-semibold uppercase text-on-surface-variant">Phân khu</dt>
              <dd class="text-on-surface">{{ displayField(apartmentDetail.zoneName ?? apartmentDetail.zoneCode) }}</dd>
            </div>
            <div>
              <dt class="text-xs font-semibold uppercase text-on-surface-variant">Loại căn</dt>
              <dd class="text-on-surface">{{ displayField(apartmentDetail.apartmentTypeName ?? apartmentDetail.apartmentTypeCode) }}</dd>
            </div>
            <div>
              <dt class="text-xs font-semibold uppercase text-on-surface-variant">Diện tích</dt>
              <dd class="text-on-surface">{{ formatArea(apartmentDetail.area) }}</dd>
            </div>
            <div>
              <dt class="text-xs font-semibold uppercase text-on-surface-variant">Giá</dt>
              <dd class="font-semibold text-primary">{{ formatPrice(apartmentDetail.price) }}</dd>
            </div>
            <div>
              <dt class="text-xs font-semibold uppercase text-on-surface-variant">Phí / thuế</dt>
              <dd class="text-on-surface">{{ apartmentDetail.taxFee != null ? formatPrice(apartmentDetail.taxFee) : '—' }}</dd>
            </div>
            <div>
              <dt class="text-xs font-semibold uppercase text-on-surface-variant">Nội thất</dt>
              <dd class="text-on-surface">{{ displayField(apartmentDetail.furnitureStatus) }}</dd>
            </div>
            <div>
              <dt class="text-xs font-semibold uppercase text-on-surface-variant">Pháp lý</dt>
              <dd class="text-on-surface">{{ displayField(apartmentDetail.legalStatus) }}</dd>
            </div>
            <div>
              <dt class="text-xs font-semibold uppercase text-on-surface-variant">Hướng ban công</dt>
              <dd class="text-on-surface">{{ displayField(apartmentDetail.balconyDirection) }}</dd>
            </div>
            <div>
              <dt class="text-xs font-semibold uppercase text-on-surface-variant">SĐT chủ</dt>
              <dd class="text-on-surface">{{ displayOwnerPhone() }}</dd>
            </div>
            <div>
              <dt class="text-xs font-semibold uppercase text-on-surface-variant">Liên hệ chủ</dt>
              <dd class="text-on-surface">{{ displayField(apartmentDetail.ownerContact) }}</dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-xs font-semibold uppercase text-on-surface-variant">Nguồn</dt>
              <dd class="text-on-surface">{{ displaySource() }}</dd>
            </div>
            <div v-if="canLoadOwnerSensitive && apartmentDetail" class="sm:col-span-2">
              <div class="rounded-xl border border-outline-variant/20 bg-surface-container-low/80 p-3">
                <p class="mb-2 text-xs text-on-surface-variant">
                  SĐT chủ và nguồn đầy đủ chỉ dành cho Admin/Manager (API owner-info).
                </p>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-on-primary disabled:opacity-60"
                  :disabled="ownerInfoLoading"
                  @click="loadOwnerSensitive"
                >
                  <span class="material-symbols-outlined text-[18px]">lock_open</span>
                  {{ ownerInfoLoading ? 'Đang tải…' : ownerInfoExtra ? 'Tải lại thông tin nhạy cảm' : 'Tải SĐT chủ & nguồn' }}
                </button>
              </div>
            </div>
            <div>
              <dt class="text-xs font-semibold uppercase text-on-surface-variant">Tạo lúc</dt>
              <dd class="text-on-surface-variant">{{ formatDt(apartmentDetail.createdAt) }}</dd>
            </div>
            <div>
              <dt class="text-xs font-semibold uppercase text-on-surface-variant">Cập nhật</dt>
              <dd class="text-on-surface-variant">{{ formatDt(apartmentDetail.updatedAt) }}</dd>
            </div>
          </div>
        </dl>

        <div class="mt-6 flex justify-end">
          <button
            type="button"
            class="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary"
            @click="closeApartmentDetail"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
