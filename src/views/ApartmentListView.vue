<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import ApartmentMediaGallery from '@/components/ApartmentMediaGallery.vue'
import {
  bulkDeleteApartments,
  getApartmentDetail,
  getApartmentOwnerInfo,
  listApartments,
  listApartmentMedia,
  moveApartments,
  updateApartment,
} from '@/services/apartment.service'
import { listProjectsManagement } from '@/services/project.service'
import type {
  ApartmentAdminDto,
  ApartmentListItemDto,
  ApartmentMediaItemDto,
  ApartmentOwnerInfoDto,
  UpdateApartmentCommand,
} from '@/types/apartment'
import type { ProjectManagementSidebarDto } from '@/types/project'

const toast = useToast()
const { confirm } = useConfirm()
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

/** Di chuyển hàng loạt — POST /apartments/move */
const selectedApartmentIds = ref<string[]>([])
const showMoveModal = ref(false)
const moveTargetProjectId = ref('')
const moveTargetZoneId = ref('')
const moveTargetAptTypeId = ref('')
const moveSubmitting = ref(false)
const bulkDeleteSubmitting = ref(false)

const showDetailModal = ref(false)
const detailLoading = ref(false)
const apartmentDetail = ref<ApartmentAdminDto | null>(null)
const ownerInfoExtra = ref<ApartmentOwnerInfoDto | null>(null)
const ownerInfoLoading = ref(false)

const statusDraft = ref('')
const codeDraft = ref('')
const areaDraft = ref('')
const priceDraft = ref('')
const taxFeeDraft = ref('')
const furnitureDraft = ref('')
const legalDraft = ref('')
const balconyDraft = ref('')
const noteDraft = ref('')
const ownerPhoneDraft = ref('')
const ownerContactDraft = ref('')
const sourceDraft = ref('')
const apartmentSaving = ref(false)

/** Ảnh / video — GET /apartments/{id}/media, mở từ thẻ danh sách. */
const mediaItems = ref<ApartmentMediaItemDto[]>([])
const mediaLoading = ref(false)
const showMediaGallery = ref(false)
const galleryInitialIndex = ref(0)
const mediaGalleryTitleRow = ref<ApartmentListItemDto | null>(null)

const mediaGalleryHeadline = computed(() => {
  const row = mediaGalleryTitleRow.value
  if (!row) return 'Ảnh & video căn hộ'
  const code = row.code?.trim()
  const name = row.apartmentTypeName?.trim()
  if (code && name) return `${code} — ${name}`
  return code || name || 'Ảnh & video căn hộ'
})

/** Giá trị status gợi ý — chỉnh nếu backend dùng mã khác. */
const STATUS_QUICK_OPTIONS = [
  { value: 'FOR_SALE', label: 'Đang bán' },
  { value: 'AVAILABLE', label: 'Còn bán (AVAILABLE)' },
  { value: 'BOOKED', label: 'Đã cọc (BOOKED)' },
  { value: 'DEPOSIT', label: 'Đã cọc (DEPOSIT)' },
  { value: 'SOLD', label: 'Đã bán (SOLD)' },
] as const

const statusSelectOptions = computed(() => {
  const cur = apartmentDetail.value?.status
  const base = STATUS_QUICK_OPTIONS.map((o) => ({ ...o }))
  if (cur && !base.some((o) => o.value === cur)) {
    return [{ value: cur, label: `Giữ mã hiện tại: ${cur}` }, ...base]
  }
  return base
})

const zoneOptions = computed(() => {
  const p = projectsTree.value.find((x) => x.id === filterProjectId.value)
  return p?.zones ?? []
})

const aptTypeOptions = computed(() => {
  const z = zoneOptions.value.find((x) => x.id === filterZoneId.value)
  return z?.apartmentTypes ?? []
})

const moveTargetZoneOptions = computed(() => {
  const p = projectsTree.value.find((x) => x.id === moveTargetProjectId.value)
  return p?.zones ?? []
})

const moveTargetAptTypeOptions = computed(() => {
  const z = moveTargetZoneOptions.value.find((x) => x.id === moveTargetZoneId.value)
  return z?.apartmentTypes ?? []
})

const allOnPageSelected = computed(() => {
  if (!items.value.length) return false
  return items.value.every((x) => selectedApartmentIds.value.includes(x.id))
})

watch(filterProjectId, () => {
  filterZoneId.value = ''
  filterAptTypeId.value = ''
})

watch(filterZoneId, () => {
  filterAptTypeId.value = ''
})

watch(moveTargetProjectId, () => {
  moveTargetZoneId.value = ''
  moveTargetAptTypeId.value = ''
})

watch(moveTargetZoneId, () => {
  moveTargetAptTypeId.value = ''
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

async function openApartmentMediaFromList(apt: ApartmentListItemDto, startIndex = 0) {
  mediaGalleryTitleRow.value = apt
  galleryInitialIndex.value = startIndex
  showMediaGallery.value = true
  mediaLoading.value = true
  mediaItems.value = []
  try {
    mediaItems.value = await listApartmentMedia(apt.id)
  } catch (e) {
    showMediaGallery.value = false
    mediaGalleryTitleRow.value = null
    toast.error(e instanceof Error ? e.message : 'Không tải được ảnh & video căn hộ.')
  } finally {
    mediaLoading.value = false
  }
}

function closeMediaGallery() {
  showMediaGallery.value = false
  mediaLoading.value = false
  mediaItems.value = []
  mediaGalleryTitleRow.value = null
}

async function onApartmentMediaUploaded(created: ApartmentMediaItemDto) {
  const id = mediaGalleryTitleRow.value?.id
  if (!id) return
  try {
    mediaItems.value = await listApartmentMedia(id)
    const i = created.id ? mediaItems.value.findIndex((x) => x.id === created.id) : -1
    galleryInitialIndex.value = i >= 0 ? i : Math.max(0, mediaItems.value.length - 1)
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Không làm mới được danh sách media.')
  }
}

function clearEditDrafts() {
  codeDraft.value = ''
  statusDraft.value = ''
  areaDraft.value = ''
  priceDraft.value = ''
  taxFeeDraft.value = ''
  furnitureDraft.value = ''
  legalDraft.value = ''
  balconyDraft.value = ''
  noteDraft.value = ''
  ownerPhoneDraft.value = ''
  ownerContactDraft.value = ''
  sourceDraft.value = ''
}

function syncEditDraftFromDetail() {
  const a = apartmentDetail.value
  if (!a) return
  codeDraft.value = a.code ?? ''
  statusDraft.value = a.status?.trim() ?? ''
  areaDraft.value = a.area != null && !Number.isNaN(a.area) ? String(a.area) : ''
  priceDraft.value = a.price != null && !Number.isNaN(a.price) ? String(a.price) : ''
  taxFeeDraft.value = a.taxFee != null && !Number.isNaN(a.taxFee) ? String(a.taxFee) : ''
  furnitureDraft.value = a.furnitureStatus ?? ''
  legalDraft.value = a.legalStatus ?? ''
  balconyDraft.value = a.balconyDirection ?? ''
  noteDraft.value = a.note ?? ''
  ownerPhoneDraft.value = a.ownerPhone ?? ''
  ownerContactDraft.value = a.ownerContact ?? ''
  sourceDraft.value = a.source ?? ''
}

function parseDecimalInput(s: string): number | null | undefined {
  const t = s.trim().replace(/\s/g, '').replace(',', '.')
  if (t === '') return undefined
  const n = Number(t)
  return Number.isFinite(n) ? n : undefined
}

function strToNull(s: string): string | null {
  const t = s.trim()
  return t === '' ? null : t
}

function buildUpdateApartmentCommand(): UpdateApartmentCommand {
  const area = parseDecimalInput(areaDraft.value)
  const price = parseDecimalInput(priceDraft.value)
  const taxFee = parseDecimalInput(taxFeeDraft.value)
  return {
    code: codeDraft.value.trim(),
    status: statusDraft.value.trim(),
    area: area === undefined ? null : area,
    price: price === undefined ? null : price,
    taxFee: taxFee === undefined ? null : taxFee,
    furnitureStatus: strToNull(furnitureDraft.value),
    legalStatus: strToNull(legalDraft.value),
    balconyDirection: strToNull(balconyDraft.value),
    note: strToNull(noteDraft.value),
    ownerPhone: strToNull(ownerPhoneDraft.value),
    ownerContact: strToNull(ownerContactDraft.value),
    source: strToNull(sourceDraft.value),
  }
}

async function loadOwnerSensitive() {
  const id = apartmentDetail.value?.id
  if (!id) return
  ownerInfoLoading.value = true
  try {
    ownerInfoExtra.value = await getApartmentOwnerInfo(id)
    if (ownerInfoExtra.value) {
      ownerPhoneDraft.value = ownerInfoExtra.value.ownerPhone ?? ''
      sourceDraft.value = ownerInfoExtra.value.source ?? ''
    }
    toast.success('Đã tải SĐT chủ & nguồn.')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Không tải được thông tin chủ & nguồn.')
  } finally {
    ownerInfoLoading.value = false
  }
}

function statusBadge(raw: string | undefined) {
  const s = String(raw ?? '').toUpperCase()
  if (['FOR_SALE', 'AVAILABLE', 'DANG_BAN', 'ACTIVE', 'OPEN'].some((x) => s === x))
    return { label: 'Đang bán', variant: 'sale' as const }
  if (['BOOKED', 'DEPOSIT', 'DAT_COC', 'RESERVED'].some((x) => s === x))
    return { label: 'Đã cọc', variant: 'booked' as const }
  if (['SOLD', 'DA_BAN'].some((x) => s === x)) return { label: 'Đã bán', variant: 'sold' as const }
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

function toggleSelectApartment(id: string) {
  const arr = [...selectedApartmentIds.value]
  const i = arr.indexOf(id)
  if (i >= 0) arr.splice(i, 1)
  else arr.push(id)
  selectedApartmentIds.value = arr
}

function isApartmentSelected(id: string) {
  return selectedApartmentIds.value.includes(id)
}

function toggleSelectAllOnPage() {
  const ids = items.value.map((x) => x.id)
  if (!ids.length) return
  if (allOnPageSelected.value) {
    const drop = new Set(ids)
    selectedApartmentIds.value = selectedApartmentIds.value.filter((id) => !drop.has(id))
  } else {
    selectedApartmentIds.value = [...new Set([...selectedApartmentIds.value, ...ids])]
  }
}

function onMove() {
  if (!selectedApartmentIds.value.length) {
    toast.info('Chọn ít nhất một căn (ô trên thẻ) rồi bấm Di chuyển.')
    return
  }
  moveTargetProjectId.value = ''
  moveTargetZoneId.value = ''
  moveTargetAptTypeId.value = ''
  showMoveModal.value = true
}

function closeMoveModal() {
  showMoveModal.value = false
}

async function submitMoveApartments() {
  const ids = [...selectedApartmentIds.value]
  if (!ids.length) {
    toast.error('Không có căn nào được chọn.')
    return
  }
  if (!moveTargetZoneId.value || !moveTargetAptTypeId.value) {
    toast.error('Chọn dự án → phân khu → loại căn đích.')
    return
  }
  moveSubmitting.value = true
  try {
    const result = await moveApartments({
      apartmentIds: ids,
      targetZoneId: moveTargetZoneId.value,
      targetApartmentTypeId: moveTargetAptTypeId.value,
    })
    const n = result.movedCount
    toast.success(n != null ? `Đã di chuyển ${n} căn.` : 'Đã di chuyển căn hộ.')
    closeMoveModal()
    selectedApartmentIds.value = []
    await load()
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Không di chuyển được căn hộ.')
  } finally {
    moveSubmitting.value = false
  }
}

const BULK_DELETE_MAX = 500

async function onBulkDelete() {
  const ids = [...selectedApartmentIds.value]
  if (!ids.length) {
    toast.info('Chọn ít nhất một căn (ô trên thẻ) rồi bấm Xóa.')
    return
  }
  if (ids.length > BULK_DELETE_MAX) {
    toast.error(`Chỉ xóa tối đa ${BULK_DELETE_MAX} căn mỗi lần. Đang chọn ${ids.length} căn.`)
    return
  }
  const ok = await confirm({
    title: 'Xóa căn hộ (soft delete)',
    message: `Gắn cờ xóa ${ids.length} căn đã chọn? Căn sẽ không còn hiển thị trong danh sách thông thường.`,
  })
  if (!ok) return
  bulkDeleteSubmitting.value = true
  try {
    const result = await bulkDeleteApartments({ apartmentIds: ids })
    const n = result.deletedCount
    toast.success(n != null ? `Đã xóa ${n} căn.` : 'Đã xóa căn hộ.')
    selectedApartmentIds.value = []
    await load()
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Không xóa được căn hộ.')
  } finally {
    bulkDeleteSubmitting.value = false
  }
}

function mergeApartmentInList(updated: ApartmentListItemDto) {
  const i = items.value.findIndex((x) => x.id === updated.id)
  if (i !== -1) {
    items.value[i] = { ...items.value[i], ...updated }
  }
}

async function submitApartmentUpdate() {
  const id = apartmentDetail.value?.id
  if (!id) return
  const body = buildUpdateApartmentCommand()
  if (!body.code) {
    toast.error('Mã căn không được để trống.')
    return
  }
  if (!body.status) {
    toast.error('Trạng thái không được để trống.')
    return
  }
  apartmentSaving.value = true
  try {
    const updated = await updateApartment(id, body)
    apartmentDetail.value = updated
    ownerInfoExtra.value = null
    mergeApartmentInList(updated)
    syncEditDraftFromDetail()
    toast.success('Đã cập nhật căn hộ.')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Không cập nhật được căn hộ.')
  } finally {
    apartmentSaving.value = false
  }
}

function closeApartmentDetail() {
  showDetailModal.value = false
  apartmentDetail.value = null
  ownerInfoExtra.value = null
  clearEditDrafts()
}

async function openApartmentDetail(row: ApartmentListItemDto) {
  showDetailModal.value = true
  apartmentDetail.value = null
  ownerInfoExtra.value = null
  clearEditDrafts()
  detailLoading.value = true
  try {
    apartmentDetail.value = await getApartmentDetail(row.id)
    syncEditDraftFromDetail()
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
              v-if="items.length && !loading"
              type="button"
              class="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl border border-outline-variant/40 px-4 py-3.5 text-sm font-bold text-on-surface-variant transition-all hover:bg-surface-container-low"
              @click="toggleSelectAllOnPage"
            >
              <span class="material-symbols-outlined text-[20px]">select_all</span>
              {{ allOnPageSelected ? 'Bỏ chọn trang' : 'Chọn tất cả trang' }}
            </button>
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
              class="relative flex shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl bg-surface-container-highest px-5 py-3.5 font-bold text-primary transition-all hover:bg-surface-variant"
              @click="onMove"
            >
              <span class="material-symbols-outlined text-[20px]">move_item</span>
              Di chuyển
              <span
                v-if="selectedApartmentIds.length"
                class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-black text-on-primary"
                >{{ selectedApartmentIds.length }}</span
              >
            </button>
            <button
              type="button"
              class="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl bg-error-container px-5 py-3.5 font-bold text-on-error-container transition-all hover:opacity-90 disabled:opacity-50"
              :disabled="bulkDeleteSubmitting"
              @click="onBulkDelete"
            >
              <span class="material-symbols-outlined text-[20px]">delete</span>
              {{ bulkDeleteSubmitting ? 'Đang xóa…' : 'Xóa' }}
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
            <button
              type="button"
              class="absolute inset-0 z-[1] cursor-pointer border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              aria-label="Xem ảnh và video căn hộ"
              @click="openApartmentMediaFromList(apt)"
            />
            <div
              class="pointer-events-none absolute inset-0 bg-gradient-to-br transition-transform duration-700 group-hover:scale-105"
              :class="heroGradients[idx % heroGradients.length]"
            />
            <div
              class="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.12] transition-opacity group-hover:opacity-[0.18]"
            >
              <span class="material-symbols-outlined text-[120px] text-primary">apartment</span>
            </div>
            <div
              class="pointer-events-none absolute top-4 left-4 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider"
              :class="badgeClass(apt)"
            >
              {{ badgeFor(apt).label }}
            </div>
            <div class="absolute top-4 right-4 z-10" @click.stop>
              <label
                class="flex cursor-pointer items-center justify-center rounded-full bg-black/40 p-1.5 shadow-sm backdrop-blur-sm"
              >
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-white/60 text-primary focus:ring-2 focus:ring-primary/40"
                  :checked="isApartmentSelected(apt.id)"
                  @change="toggleSelectApartment(apt.id)"
                />
              </label>
            </div>
            <div
              class="pointer-events-none absolute bottom-3 right-3 z-[2] flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/95 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
            >
              <span class="material-symbols-outlined text-[14px]">photo_library</span>
              Ảnh &amp; video
            </div>
            <div
              class="pointer-events-none absolute bottom-0 left-0 z-[2] w-full bg-gradient-to-t from-black/60 to-transparent p-4"
            >
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
        class="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-xl"
        @click.stop
      >
        <h2 id="apt-detail-title" class="font-headline text-lg font-bold text-on-surface">Chi tiết & chỉnh sửa căn hộ</h2>
        <p class="mt-1 text-xs text-on-surface-variant">
          Đổi dự án / phân khu / loại căn bằng thao tác Di chuyển trên danh sách. Một số trường có thể bị ẩn tùy vai trò.
        </p>

        <div v-if="detailLoading" class="mt-6 py-10 text-center text-sm text-on-surface-variant">Đang tải…</div>
        <div v-else-if="apartmentDetail" class="mt-4 space-y-4 text-sm">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div class="sm:col-span-2 rounded-lg border border-outline-variant/15 bg-surface-container-low/50 px-3 py-2 text-xs text-on-surface-variant">
              <span class="font-semibold text-on-surface">Vị trí (chỉ đọc):</span>
              {{ displayField(apartmentDetail.projectName ?? apartmentDetail.projectCode) }} ·
              {{ displayField(apartmentDetail.zoneName ?? apartmentDetail.zoneCode) }} ·
              {{ displayField(apartmentDetail.apartmentTypeName ?? apartmentDetail.apartmentTypeCode) }}
            </div>

            <div>
              <label class="text-xs font-semibold uppercase text-on-surface-variant">Mã căn</label>
              <input
                v-model="codeDraft"
                type="text"
                class="mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
                autocomplete="off"
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-on-surface-variant">Trạng thái</label>
              <select
                v-model="statusDraft"
                class="mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option v-for="opt in statusSelectOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-on-surface-variant">Diện tích (m²)</label>
              <input
                v-model="areaDraft"
                type="text"
                inputmode="decimal"
                class="mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="VD: 75.5"
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-on-surface-variant">Giá (VNĐ)</label>
              <input
                v-model="priceDraft"
                type="text"
                inputmode="decimal"
                class="mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-on-surface-variant">Phí / thuế</label>
              <input
                v-model="taxFeeDraft"
                type="text"
                inputmode="decimal"
                class="mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-on-surface-variant">Nội thất</label>
              <input
                v-model="furnitureDraft"
                type="text"
                class="mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-on-surface-variant">Pháp lý</label>
              <input
                v-model="legalDraft"
                type="text"
                class="mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="text-xs font-semibold uppercase text-on-surface-variant">Hướng ban công</label>
              <input
                v-model="balconyDraft"
                type="text"
                class="mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="text-xs font-semibold uppercase text-on-surface-variant">Ghi chú</label>
              <textarea
                v-model="noteDraft"
                rows="2"
                class="mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-on-surface-variant">SĐT chủ</label>
              <input
                v-model="ownerPhoneDraft"
                type="text"
                class="mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label class="text-xs font-semibold uppercase text-on-surface-variant">Liên hệ chủ</label>
              <input
                v-model="ownerContactDraft"
                type="text"
                class="mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="text-xs font-semibold uppercase text-on-surface-variant">Nguồn</label>
              <input
                v-model="sourceDraft"
                type="text"
                class="mt-1 w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div v-if="canLoadOwnerSensitive && apartmentDetail" class="sm:col-span-2">
              <div class="rounded-xl border border-outline-variant/20 bg-surface-container-low/80 p-3">
                <p class="mb-2 text-xs text-on-surface-variant">
                  Admin/Manager có thể tải SĐT & nguồn đầy đủ (GET owner-info) để điền form.
                </p>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-on-primary disabled:opacity-60"
                  :disabled="ownerInfoLoading"
                  @click="loadOwnerSensitive"
                >
                  <span class="material-symbols-outlined text-[18px]">lock_open</span>
                  {{ ownerInfoLoading ? 'Đang tải…' : ownerInfoExtra ? 'Tải lại owner-info' : 'Tải SĐT chủ & nguồn' }}
                </button>
              </div>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase text-on-surface-variant">Tạo lúc</p>
              <p class="mt-1 text-on-surface-variant">{{ formatDt(apartmentDetail.createdAt) }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase text-on-surface-variant">Cập nhật</p>
              <p class="mt-1 text-on-surface-variant">{{ formatDt(apartmentDetail.updatedAt) }}</p>
            </div>
          </div>
        </div>

        <div
          class="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-outline-variant/20 pt-4"
        >
          <template v-if="apartmentDetail && !detailLoading">
            <button
              type="button"
              class="rounded-lg border border-outline-variant/40 px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low disabled:opacity-50"
              :disabled="apartmentSaving"
              @click="syncEditDraftFromDetail"
            >
              Hoàn tác
            </button>
            <button
              type="button"
              class="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-50"
              :disabled="apartmentSaving"
              @click="submitApartmentUpdate"
            >
              {{ apartmentSaving ? 'Đang lưu…' : 'Lưu thay đổi' }}
            </button>
          </template>
          <button
            type="button"
            class="rounded-lg border border-outline-variant/40 px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
            @click="closeApartmentDetail"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>

    <!-- POST /apartments/move -->
    <div
      v-if="showMoveModal"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="apt-move-title"
      @click.self="closeMoveModal"
    >
      <div
        class="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-xl"
        @click.stop
      >
        <h2 id="apt-move-title" class="font-headline text-lg font-bold text-on-surface">Di chuyển căn hộ</h2>
        <p class="mt-1 text-xs text-on-surface-variant">
          Chọn phân khu và loại căn đích (loại phải thuộc phân khu). Đang chọn
          <strong>{{ selectedApartmentIds.length }}</strong> căn.
        </p>

        <div class="mt-4 space-y-3">
          <div>
            <label class="mb-1 block text-xs font-semibold uppercase text-on-surface-variant">Dự án đích</label>
            <select
              v-model="moveTargetProjectId"
              class="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="" disabled>Chọn dự án</option>
              <option v-for="p in projectsTree" :key="p.id" :value="p.id">{{ p.name }} ({{ p.code }})</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold uppercase text-on-surface-variant">Phân khu đích</label>
            <select
              v-model="moveTargetZoneId"
              class="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
              :disabled="!moveTargetProjectId"
            >
              <option value="" disabled>Chọn phân khu</option>
              <option v-for="z in moveTargetZoneOptions" :key="z.id" :value="z.id">{{ z.name }} ({{ z.code || '—' }})</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold uppercase text-on-surface-variant">Loại căn đích</label>
            <select
              v-model="moveTargetAptTypeId"
              class="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
              :disabled="!moveTargetZoneId"
            >
              <option value="" disabled>Chọn loại căn</option>
              <option v-for="t in moveTargetAptTypeOptions" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
          </div>
        </div>

        <div class="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            class="rounded-lg border border-outline-variant/40 px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low"
            :disabled="moveSubmitting"
            @click="closeMoveModal"
          >
            Hủy
          </button>
          <button
            type="button"
            class="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-50"
            :disabled="moveSubmitting || !moveTargetZoneId || !moveTargetAptTypeId"
            @click="submitMoveApartments"
          >
            {{ moveSubmitting ? 'Đang xử lý…' : 'Xác nhận di chuyển' }}
          </button>
        </div>
      </div>
    </div>

    <ApartmentMediaGallery
      :show="showMediaGallery"
      :items="mediaItems"
      :loading="mediaLoading"
      :headline="mediaGalleryHeadline"
      :initial-index="galleryInitialIndex"
      :apartment-id="mediaGalleryTitleRow?.id"
      :can-upload="canLoadOwnerSensitive"
      @close="closeMediaGallery"
      @uploaded="onApartmentMediaUploaded"
    />
  </div>
</template>
