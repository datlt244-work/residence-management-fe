<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { listApartments } from '@/services/apartment.service'
import { getCurrentEmployee } from '@/services/employee.service'
import {
  createProject,
  deleteProject,
  listProjectsManagement,
  setProjectActive,
  updateProject,
} from '@/services/project.service'
import { createZone, deleteZone, updateZone } from '@/services/zone.service'
import type { ProjectManagementSidebarDto, ZoneSidebarDto } from '@/types/project'
import { aggregateBuckets, toPercentages } from '@/utils/apartmentStats'

const auth = useAuthStore()
const toast = useToast()
const { confirm } = useConfirm()

const loading = ref(true)
const projects = ref<ProjectManagementSidebarDto[]>([])
const totalApartments = ref(0)
const activeProjectCount = ref(0)
/** Phần trăm ước lượng theo mẫu tối đa 100 căn (API không có thống kê theo loại). */
const barCondo = ref(45)
const barShop = ref(30)
const barVilla = ref(25)
const expandedProjectId = ref<string | null>(null)

const showCreateProjectModal = ref(false)
const createFormName = ref('')
const createFormCode = ref('')
const createSubmitting = ref(false)

const showEditProjectModal = ref(false)
const editingProjectId = ref<string | null>(null)
const editFormName = ref('')
const editFormCode = ref('')
const editSubmitting = ref(false)

const togglingProjectId = ref<string | null>(null)

const showCreateZoneModal = ref(false)
const zoneCreateProjectId = ref<string | null>(null)
const createZoneFormName = ref('')
const createZoneFormCode = ref('')
const createZoneSubmitting = ref(false)

const showEditZoneModal = ref(false)
const editingZoneId = ref<string | null>(null)
const zoneEditProjectId = ref<string | null>(null)
const editZoneFormName = ref('')
/** Chỉ hiển thị khi sửa — không gửi lên API. */
const editZoneDisplayCode = ref('')
const editZoneSubmitting = ref(false)

function projectIsActive(p: ProjectManagementSidebarDto) {
  return String(p.status).toUpperCase() === 'ACTIVE'
}

function greeting(): string {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Chào buổi sáng'
  if (h >= 12 && h < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

const displayName = computed(() => auth.user?.fullName?.trim() || auth.user?.email || 'Quản trị viên')

function formatInt(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n)
}

async function loadDashboard() {
  loading.value = true
  try {
    const [me, tree, aptPage] = await Promise.all([
      getCurrentEmployee(),
      listProjectsManagement(),
      listApartments({ page: 0, size: 100 }),
    ])
    auth.setUser(me)
    projects.value = tree
    activeProjectCount.value = tree.filter((p) => p.status === 'ACTIVE').length
    totalApartments.value = aptPage.totalElements
    const names = aptPage.content.map((a) => a.apartmentTypeName)
    const counts = aggregateBuckets(names)
    const mergedCondo = counts.condo + counts.other
    const t = mergedCondo + counts.shophouse + counts.villa
    if (t > 0) {
      const p = toPercentages({
        condo: mergedCondo,
        shophouse: counts.shophouse,
        villa: counts.villa,
        other: 0,
      })
      barCondo.value = p.condo
      barShop.value = p.shophouse
      barVilla.value = p.villa
    }
    expandedProjectId.value = tree[0]?.id ?? null
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Không tải được dữ liệu.')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDashboard()
})

function toggleProject(id: string) {
  expandedProjectId.value = expandedProjectId.value === id ? null : id
}

function openCreateProject() {
  createFormName.value = ''
  createFormCode.value = ''
  showCreateProjectModal.value = true
}

function closeCreateProject() {
  showCreateProjectModal.value = false
}

function openEditProject(p: ProjectManagementSidebarDto) {
  editingProjectId.value = p.id
  editFormName.value = p.name
  editFormCode.value = p.code
  showEditProjectModal.value = true
}

function closeEditProject() {
  showEditProjectModal.value = false
  editingProjectId.value = null
}

async function submitEditProject() {
  if (!editingProjectId.value) return
  const name = editFormName.value.trim()
  const code = editFormCode.value.trim()
  if (!name || !code) {
    toast.error('Vui lòng nhập tên dự án và mã dự án.')
    return
  }
  editSubmitting.value = true
  try {
    const updated = await updateProject(editingProjectId.value, { name, code })
    toast.success('Đã cập nhật dự án.')
    closeEditProject()
    const i = projects.value.findIndex((x) => x.id === updated.id)
    if (i !== -1) {
      projects.value[i] = { ...projects.value[i], ...updated }
    }
    activeProjectCount.value = projects.value.filter((x) => projectIsActive(x)).length
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Cập nhật dự án thất bại.')
  } finally {
    editSubmitting.value = false
  }
}

async function toggleProjectActive(p: ProjectManagementSidebarDto) {
  if (togglingProjectId.value) return
  const next = !projectIsActive(p)
  togglingProjectId.value = p.id
  try {
    const updated = await setProjectActive(p.id, next)
    const i = projects.value.findIndex((x) => x.id === p.id)
    if (i !== -1) {
      projects.value[i] = { ...projects.value[i], ...updated }
    }
    activeProjectCount.value = projects.value.filter((x) => projectIsActive(x)).length
    toast.success(next ? 'Đã kích hoạt dự án.' : 'Đã tạm ngưng dự án.')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Không cập nhật được trạng thái.')
  } finally {
    togglingProjectId.value = null
  }
}

async function submitCreateProject() {
  const name = createFormName.value.trim()
  const code = createFormCode.value.trim()
  if (!name || !code) {
    toast.error('Vui lòng nhập tên dự án và mã dự án.')
    return
  }
  createSubmitting.value = true
  try {
    const created = await createProject({ name, code })
    toast.success('Đã tạo dự án thành công.')
    closeCreateProject()
    await loadDashboard()
    expandedProjectId.value = created.id
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Tạo dự án thất bại.')
  } finally {
    createSubmitting.value = false
  }
}

async function onDeleteProject(p: ProjectManagementSidebarDto) {
  const ok = await confirm({
    title: 'Xóa dự án',
    message: `Xóa dự án "${p.name}" (${p.code})?\nChỉ thực hiện được khi không còn căn hộ thuộc dự án.`,
  })
  if (!ok) return
  try {
    await deleteProject(p.id)
    toast.success('Đã xóa dự án thành công.')
    if (expandedProjectId.value === p.id) expandedProjectId.value = null
    await loadDashboard()
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Xóa dự án thất bại.')
  }
}

function openCreateZone(project: ProjectManagementSidebarDto) {
  zoneCreateProjectId.value = project.id
  createZoneFormName.value = ''
  createZoneFormCode.value = ''
  showCreateZoneModal.value = true
}

function closeCreateZone() {
  showCreateZoneModal.value = false
  zoneCreateProjectId.value = null
}

async function submitCreateZone() {
  const projectId = zoneCreateProjectId.value
  if (!projectId) return
  const name = createZoneFormName.value.trim()
  const code = createZoneFormCode.value.trim()
  if (!name || !code) {
    toast.error('Vui lòng nhập tên và mã phân khu.')
    return
  }
  createZoneSubmitting.value = true
  try {
    const z = await createZone({ projectId, name, code })
    const pi = projects.value.findIndex((p) => p.id === projectId)
    if (pi !== -1) {
      const p = projects.value[pi]
      projects.value[pi] = {
        ...p,
        zones: [...p.zones, { ...z, apartmentTypes: z.apartmentTypes ?? [] }],
      }
    }
    toast.success('Đã thêm phân khu.')
    closeCreateZone()
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Tạo phân khu thất bại.')
  } finally {
    createZoneSubmitting.value = false
  }
}

function openEditZone(project: ProjectManagementSidebarDto, zone: ZoneSidebarDto) {
  editingZoneId.value = zone.id
  zoneEditProjectId.value = project.id
  editZoneFormName.value = zone.name
  editZoneDisplayCode.value = (zone.code ?? '').trim() || '—'
  showEditZoneModal.value = true
}

function closeEditZone() {
  showEditZoneModal.value = false
  editingZoneId.value = null
  zoneEditProjectId.value = null
}

async function submitEditZone() {
  const zoneId = editingZoneId.value
  const projectId = zoneEditProjectId.value
  if (!zoneId || !projectId) return
  const name = editZoneFormName.value.trim()
  if (!name) {
    toast.error('Vui lòng nhập tên phân khu.')
    return
  }
  editZoneSubmitting.value = true
  try {
    const updated = await updateZone(zoneId, { name })
    const pi = projects.value.findIndex((p) => p.id === projectId)
    if (pi !== -1) {
      const p = projects.value[pi]
      const zi = p.zones.findIndex((z) => z.id === zoneId)
      if (zi !== -1) {
        const old = p.zones[zi]
        const newZones = [...p.zones]
        newZones[zi] = {
          ...old,
          ...updated,
          apartmentTypes: updated.apartmentTypes ?? old.apartmentTypes,
        }
        projects.value[pi] = { ...p, zones: newZones }
      }
    }
    toast.success('Đã cập nhật phân khu.')
    closeEditZone()
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Cập nhật phân khu thất bại.')
  } finally {
    editZoneSubmitting.value = false
  }
}

async function onDeleteZone(project: ProjectManagementSidebarDto, zone: ZoneSidebarDto) {
  const ok = await confirm({
    title: 'Xóa phân khu',
    message: `Xóa phân khu "${zone.name}"${zone.code ? ` (${zone.code})` : ''}?\nChỉ thực hiện được khi không còn dữ liệu phụ thuộc.`,
  })
  if (!ok) return
  try {
    await deleteZone(zone.id)
    const pi = projects.value.findIndex((p) => p.id === project.id)
    if (pi !== -1) {
      const p = projects.value[pi]
      projects.value[pi] = { ...p, zones: p.zones.filter((z) => z.id !== zone.id) }
    }
    toast.success('Đã xóa phân khu.')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Xóa phân khu thất bại.')
  }
}
</script>

<template>
  <div class="bg-background text-on-surface min-h-screen pb-28">
    <main class="max-w-7xl mx-auto space-y-6 px-4 pt-4">
      <div v-if="loading" class="rounded-3xl bg-surface-container-low p-8 text-center text-on-surface-variant">
        Đang tải dữ liệu…
      </div>

      <template v-else>
        <!-- Welcome + stat -->
        <section class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div class="relative overflow-hidden rounded-3xl bg-surface-container-low p-6 md:col-span-2">
            <div class="relative z-10">
              <h2 class="mb-2 text-2xl font-extrabold tracking-tight text-primary font-headline">
                {{ greeting() }}, {{ displayName }}
              </h2>
              <p class="text-sm font-medium text-on-surface-variant">
                Hệ thống đang quản lý
                <strong class="text-on-surface">{{ formatInt(totalApartments) }}</strong>
                căn hộ trên
                <strong class="text-on-surface">{{ activeProjectCount }}</strong>
                dự án đang hoạt động.
              </p>
            </div>
            <div class="pointer-events-none absolute bottom-0 right-0 opacity-10">
              <span class="material-symbols-outlined text-[120px]" style="font-variation-settings: 'FILL' 1"
                >domain</span
              >
            </div>
          </div>
          <div class="flex flex-col justify-between rounded-3xl bg-primary p-6 text-white shadow-lg">
            <div class="flex items-start justify-between">
              <span class="material-symbols-outlined rounded-xl bg-white/20 p-2">analytics</span>
              <span class="text-xs font-bold uppercase tracking-widest opacity-80">Tổng quan</span>
            </div>
            <div>
              <div class="text-3xl font-black">{{ formatInt(totalApartments) }}</div>
              <div class="text-xs opacity-70">Căn hộ trong danh mục (theo API)</div>
            </div>
          </div>
        </section>

        <!-- HR + inventory groups -->
        <div class="space-y-4">
          <div class="rounded-2xl bg-surface-container-lowest p-4 shadow-sm">
            <div class="mb-4 flex items-center gap-2 px-2">
              <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1"
                >groups</span
              >
              <h3 class="font-headline text-sm font-bold uppercase tracking-wider text-on-surface">
                Quản lý nhân sự
              </h3>
            </div>
            <div class="space-y-1">
              <RouterLink
                class="flex w-full items-center justify-between rounded-xl p-3 transition-all hover:bg-surface-container-low"
                :to="{ name: 'admin-hr-departments' }"
              >
                <div class="flex items-center gap-3">
                  <span class="material-symbols-outlined text-outline">corporate_fare</span>
                  <span class="font-medium text-on-surface-variant">Phòng ban</span>
                </div>
                <span class="material-symbols-outlined text-outline-variant">chevron_right</span>
              </RouterLink>
              <RouterLink
                class="flex w-full items-center justify-between rounded-xl p-3 transition-all hover:bg-surface-container-low"
                :to="{ name: 'admin-hr-employees' }"
              >
                <div class="flex items-center gap-3">
                  <span class="material-symbols-outlined text-outline">badge</span>
                  <span class="font-medium text-on-surface-variant">Nhân viên</span>
                </div>
                <span class="material-symbols-outlined text-outline-variant">chevron_right</span>
              </RouterLink>
            </div>
          </div>

          <!-- Projects tree -->
          <div class="rounded-3xl bg-surface-container-lowest p-4 shadow-sm">
            <div class="mb-4 flex items-center justify-between px-2">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1"
                  >inventory_2</span
                >
                <h3 class="font-headline text-sm font-bold uppercase tracking-wider text-on-surface">
                  Quản lý bảng hàng
                </h3>
              </div>
              <button
                type="button"
                class="material-symbols-outlined rounded-lg bg-surface-container-high p-1 text-primary"
                title="Thêm dự án"
                aria-label="Thêm dự án"
                @click="openCreateProject"
              >
                add
              </button>
            </div>

            <div v-if="projects.length === 0" class="px-2 py-6 text-center text-sm text-on-surface-variant">
              Chưa có dự án. Bấm nút + để tạo mới.
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="project in projects"
                :key="project.id"
                class="overflow-hidden rounded-2xl bg-surface-container-highest"
              >
                <div
                  class="flex items-center justify-between p-4"
                  :class="expandedProjectId === project.id ? 'bg-primary text-white' : 'bg-surface-container-low'"
                >
                  <div class="flex min-w-0 items-center gap-3">
                    <span
                      class="material-symbols-outlined shrink-0 cursor-move"
                      :class="expandedProjectId === project.id ? 'text-white/50' : 'text-outline-variant'"
                      >drag_indicator</span
                    >
                    <span class="truncate font-bold">{{ project.name }}</span>
                    <span
                      class="hidden text-xs opacity-70 sm:inline"
                      :class="expandedProjectId === project.id ? 'text-white/80' : 'text-on-surface-variant'"
                      >({{ project.code }})</span
                    >
                  </div>
                  <div class="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      role="switch"
                      :aria-checked="projectIsActive(project)"
                      :aria-busy="togglingProjectId === project.id"
                      :disabled="togglingProjectId === project.id"
                      class="relative mr-1 inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
                      :class="[
                        projectIsActive(project)
                          ? expandedProjectId === project.id
                            ? 'bg-white/30'
                            : 'bg-primary'
                          : expandedProjectId === project.id
                            ? 'bg-white/20'
                            : 'bg-outline-variant/50',
                      ]"
                      :title="projectIsActive(project) ? 'Đang hoạt động — bấm để ngưng' : 'Đang ngưng — bấm để kích hoạt'"
                      @click.stop="toggleProjectActive(project)"
                    >
                      <span
                        class="pointer-events-none absolute top-1 left-1 size-5 rounded-full bg-white shadow transition-transform duration-200"
                        :class="projectIsActive(project) ? 'translate-x-5' : 'translate-x-0'"
                      />
                    </button>
                    <button
                      type="button"
                      class="material-symbols-outlined rounded p-1"
                      :class="expandedProjectId === project.id ? 'text-white/80 hover:text-white' : 'text-outline hover:text-primary'"
                      title="Sửa dự án"
                      aria-label="Sửa dự án"
                      @click.stop="openEditProject(project)"
                    >
                      edit
                    </button>
                    <button
                      type="button"
                      class="material-symbols-outlined rounded p-1"
                      :class="expandedProjectId === project.id ? 'text-white/80' : 'text-outline hover:text-error'"
                      aria-label="Xóa dự án"
                      @click.stop="onDeleteProject(project)"
                    >
                      delete
                    </button>
                    <button
                      type="button"
                      class="material-symbols-outlined"
                      :class="expandedProjectId === project.id ? '' : 'text-outline'"
                      @click="toggleProject(project.id)"
                    >
                      {{ expandedProjectId === project.id ? 'expand_less' : 'expand_more' }}
                    </button>
                  </div>
                </div>

                <div v-if="expandedProjectId === project.id" class="space-y-2 p-3">
                  <div class="flex justify-end">
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
                      @click="openCreateZone(project)"
                    >
                      <span class="material-symbols-outlined text-[16px]">add</span>
                      Thêm phân khu
                    </button>
                  </div>
                  <div
                    v-for="zone in project.zones"
                    :key="zone.id"
                    class="rounded-xl bg-white/40 p-3 dark:bg-white/5"
                  >
                    <div class="mb-2 flex items-center justify-between">
                      <div class="flex min-w-0 items-center gap-2">
                        <span class="material-symbols-outlined cursor-move text-xs text-outline-variant"
                          >drag_indicator</span
                        >
                        <span class="text-xs font-bold uppercase tracking-tight text-on-surface-variant"
                          >Phân khu: {{ zone.name }}</span
                        >
                      </div>
                      <div class="flex items-center gap-1">
                        <button
                          type="button"
                          class="material-symbols-outlined p-1 text-xs text-primary"
                          title="Sửa phân khu"
                          aria-label="Sửa phân khu"
                          @click.stop="openEditZone(project, zone)"
                        >
                          edit
                        </button>
                        <button
                          type="button"
                          class="material-symbols-outlined p-1 text-xs text-error"
                          aria-label="Xóa phân khu"
                          @click.stop="onDeleteZone(project, zone)"
                        >
                          delete
                        </button>
                      </div>
                    </div>
                    <div class="mt-2 grid grid-cols-2 gap-2">
                      <div
                        v-for="apt in zone.apartmentTypes"
                        :key="apt.id"
                        class="flex items-center justify-between rounded-lg border border-outline-variant/10 bg-white p-2 dark:bg-surface-container-lowest"
                      >
                        <span class="text-xs font-semibold">{{ apt.name }}</span>
                        <span class="material-symbols-outlined text-[14px] text-outline">drag_indicator</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- System -->
          <div class="rounded-2xl bg-surface-container-lowest p-4 shadow-sm">
            <div class="mb-4 flex items-center gap-2 px-2">
              <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1"
                >settings</span
              >
              <h3 class="font-headline text-sm font-bold uppercase tracking-wider text-on-surface">
                Quản lý hệ thống
              </h3>
            </div>
            <div class="no-scrollbar flex gap-2 overflow-x-auto px-2">
              <span
                class="whitespace-nowrap rounded-full border border-outline-variant/15 bg-surface-container-low px-4 py-2 text-xs font-bold text-on-surface-variant"
                >Phân quyền</span
              >
              <span
                class="whitespace-nowrap rounded-full border border-outline-variant/15 bg-surface-container-low px-4 py-2 text-xs font-bold text-on-surface-variant"
                >Lịch sử Audit</span
              >
              <span
                class="whitespace-nowrap rounded-full border border-outline-variant/15 bg-surface-container-low px-4 py-2 text-xs font-bold text-on-surface-variant"
                >API</span
              >
            </div>
          </div>
        </div>

        <!-- Inventory summary -->
        <div class="rounded-3xl border border-outline-variant/5 bg-surface-container-lowest p-6">
          <div class="mb-6 flex items-end justify-between">
            <div>
              <h3 class="mb-1 text-sm font-bold uppercase tracking-widest text-outline">Tổng sản phẩm</h3>
              <div class="text-4xl font-black text-primary">{{ formatInt(totalApartments) }}</div>
            </div>
            <div
              class="rounded-full bg-tertiary-container px-3 py-1 text-[10px] font-bold uppercase tracking-tighter text-white"
            >
              Mẫu: tối đa 100 căn
            </div>
          </div>
          <p class="mb-4 text-xs text-on-surface-variant">
            Tỷ lệ loại căn ước lượng theo tên loại trong trang đầu (API không có báo cáo tổng hợp).
          </p>
          <div class="space-y-4">
            <div class="flex h-2 w-full overflow-hidden rounded-full bg-surface-container-low">
              <div class="h-full bg-primary" :style="{ width: `${barCondo}%` }" />
              <div class="h-full bg-tertiary" :style="{ width: `${barShop}%` }" />
              <div class="h-full bg-secondary" :style="{ width: `${barVilla}%` }" />
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div class="flex items-center gap-2">
                <div class="h-2 w-2 rounded-full bg-primary" />
                <span class="text-[10px] font-bold text-on-surface-variant">Chung cư + khác</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="h-2 w-2 rounded-full bg-tertiary" />
                <span class="text-[10px] font-bold text-on-surface-variant">Shophouse</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="h-2 w-2 rounded-full bg-secondary" />
                <span class="text-[10px] font-bold text-on-surface-variant">Villas</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </main>

    <div
      v-if="showCreateProjectModal"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-project-title"
      @click.self="closeCreateProject"
    >
      <div
        class="w-full max-w-md rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-xl"
        @click.stop
      >
        <h2 id="create-project-title" class="font-headline text-lg font-bold text-on-surface">Thêm dự án</h2>
        <form class="mt-4 space-y-3" @submit.prevent="submitCreateProject">
          <div>
            <label class="mb-1 block text-xs font-semibold uppercase text-on-surface-variant">Tên hiển thị</label>
            <input
              v-model="createFormName"
              type="text"
              required
              maxlength="200"
              class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-on-surface"
              placeholder="Ví dụ: Khu đô thị X"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold uppercase text-on-surface-variant">Mã dự án</label>
            <input
              v-model="createFormCode"
              type="text"
              required
              maxlength="50"
              class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-on-surface"
              placeholder="Ví dụ: PRJ_XYZ (duy nhất)"
            />
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              class="rounded-lg px-4 py-2 text-sm font-semibold text-on-surface-variant"
              @click="closeCreateProject"
            >
              Hủy
            </button>
            <button
              type="submit"
              class="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-60"
              :disabled="createSubmitting"
            >
              {{ createSubmitting ? 'Đang tạo…' : 'Tạo' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div
      v-if="showEditProjectModal"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-project-title"
      @click.self="closeEditProject"
    >
      <div
        class="w-full max-w-md rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-xl"
        @click.stop
      >
        <h2 id="edit-project-title" class="font-headline text-lg font-bold text-on-surface">Sửa dự án</h2>
        <form class="mt-4 space-y-3" @submit.prevent="submitEditProject">
          <div>
            <label class="mb-1 block text-xs font-semibold uppercase text-on-surface-variant">Tên hiển thị</label>
            <input
              v-model="editFormName"
              type="text"
              required
              maxlength="200"
              class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-on-surface"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold uppercase text-on-surface-variant">Mã dự án</label>
            <input
              v-model="editFormCode"
              type="text"
              required
              maxlength="50"
              class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-on-surface"
            />
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              class="rounded-lg px-4 py-2 text-sm font-semibold text-on-surface-variant"
              @click="closeEditProject"
            >
              Hủy
            </button>
            <button
              type="submit"
              class="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-60"
              :disabled="editSubmitting"
            >
              {{ editSubmitting ? 'Đang lưu…' : 'Lưu' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div
      v-if="showCreateZoneModal"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-zone-title"
      @click.self="closeCreateZone"
    >
      <div
        class="w-full max-w-md rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-xl"
        @click.stop
      >
        <h2 id="create-zone-title" class="font-headline text-lg font-bold text-on-surface">Thêm phân khu</h2>
        <form class="mt-4 space-y-3" @submit.prevent="submitCreateZone">
          <div>
            <label class="mb-1 block text-xs font-semibold uppercase text-on-surface-variant">Tên phân khu</label>
            <input
              v-model="createZoneFormName"
              type="text"
              required
              maxlength="200"
              class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-on-surface"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold uppercase text-on-surface-variant">Mã phân khu</label>
            <input
              v-model="createZoneFormCode"
              type="text"
              required
              maxlength="50"
              class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-on-surface"
            />
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              class="rounded-lg px-4 py-2 text-sm font-semibold text-on-surface-variant"
              @click="closeCreateZone"
            >
              Hủy
            </button>
            <button
              type="submit"
              class="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-60"
              :disabled="createZoneSubmitting"
            >
              {{ createZoneSubmitting ? 'Đang tạo…' : 'Tạo' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div
      v-if="showEditZoneModal"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-zone-title"
      @click.self="closeEditZone"
    >
      <div
        class="w-full max-w-md rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-xl"
        @click.stop
      >
        <h2 id="edit-zone-title" class="font-headline text-lg font-bold text-on-surface">Sửa phân khu</h2>
        <form class="mt-4 space-y-3" @submit.prevent="submitEditZone">
          <div>
            <label class="mb-1 block text-xs font-semibold uppercase text-on-surface-variant">Tên phân khu</label>
            <input
              v-model="editZoneFormName"
              type="text"
              required
              maxlength="200"
              class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-on-surface"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold uppercase text-on-surface-variant">Mã phân khu</label>
            <p
              class="rounded-xl border border-outline-variant/20 bg-surface-container-low/80 px-3 py-2 text-sm text-on-surface-variant"
              title="Mã không thể đổi sau khi tạo"
            >
              {{ editZoneDisplayCode }}
            </p>
            <p class="mt-1 text-[11px] text-on-surface-variant">Mã cố định sau khi tạo.</p>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              class="rounded-lg px-4 py-2 text-sm font-semibold text-on-surface-variant"
              @click="closeEditZone"
            >
              Hủy
            </button>
            <button
              type="submit"
              class="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-60"
              :disabled="editZoneSubmitting"
            >
              {{ editZoneSubmitting ? 'Đang lưu…' : 'Lưu' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
