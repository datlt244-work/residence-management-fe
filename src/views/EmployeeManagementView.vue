<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { listDepartments } from '@/services/department.service'
import {
  deleteEmployeeAdmin,
  getEmployeeAdmin,
  listEmployeesAdmin,
  setEmployeeActive,
  updateEmployeeAdmin,
} from '@/services/employee.service'
import type { AdminEmployeeDto, EmployeeAdminDetailDto } from '@/types/employee'
import type { DepartmentListItemDto } from '@/types/department'

const toast = useToast()
const { confirm } = useConfirm()

const loading = ref(false)
const page = ref(0)
const pageSize = ref(20)
const totalPages = ref(0)
const totalElements = ref(0)
const rows = ref<AdminEmployeeDto[]>([])

const filterSearch = ref('')
const filterRole = ref('')
const filterActive = ref<'all' | 'true' | 'false'>('all')

const deptOptions = ref<DepartmentListItemDto[]>([])

const showModal = ref(false)
const editingId = ref<string | null>(null)
const formEmail = ref('')
const formFullName = ref('')
const formPhone = ref('')
const formRole = ref('STAFF')
const formDeptId = ref<string>('')
const formPassword = ref('')
const formPassword2 = ref('')
const formSubmitting = ref(false)
const togglingId = ref<string | null>(null)

const roleOptions = ['ADMIN', 'MANAGER', 'STAFF'] as const

const modalTitle = computed(() => 'Sửa nhân viên')

async function loadDepts() {
  try {
    const data = await listDepartments({ page: 0, size: 100 })
    deptOptions.value = data.content
  } catch {
    deptOptions.value = []
  }
}

async function load() {
  loading.value = true
  try {
    const data = await listEmployeesAdmin({
      page: page.value,
      size: pageSize.value,
      search: filterSearch.value.trim() || undefined,
      role: filterRole.value || undefined,
      active:
        filterActive.value === 'all' ? undefined : filterActive.value === 'true' ? true : false,
    })
    rows.value = data.content
    totalPages.value = data.totalPages
    totalElements.value = data.totalElements
    page.value = data.pageNumber
    pageSize.value = data.pageSize
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Không tải được danh sách.')
    rows.value = []
  } finally {
    loading.value = false
  }
}

function resetForm() {
  editingId.value = null
  formEmail.value = ''
  formFullName.value = ''
  formPhone.value = ''
  formRole.value = 'STAFF'
  formDeptId.value = ''
  formPassword.value = ''
  formPassword2.value = ''
}

async function openEdit(row: AdminEmployeeDto) {
  resetForm()
  editingId.value = row.id
  showModal.value = true
  try {
    const d: EmployeeAdminDetailDto = await getEmployeeAdmin(row.id)
    formEmail.value = d.email
    formFullName.value = d.fullName
    formPhone.value = d.phone ?? ''
    formRole.value = d.role || 'STAFF'
    formDeptId.value = d.departmentId != null ? String(d.departmentId) : ''
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Không tải chi tiết nhân viên.')
    showModal.value = false
  }
}

function closeModal() {
  showModal.value = false
  resetForm()
}

async function submitForm() {
  if (!editingId.value) return
  const email = formEmail.value.trim()
  const fullName = formFullName.value.trim()
  if (!email || !fullName) {
    toast.error('Vui lòng nhập email và họ tên.')
    return
  }
  const pw = formPassword.value
  const pw2 = formPassword2.value
  if (pw || pw2) {
    if (pw !== pw2) {
      toast.error('Mật khẩu xác nhận không khớp.')
      return
    }
    if (pw.length < 8) {
      toast.error('Mật khẩu tối thiểu 8 ký tự.')
      return
    }
  }

  formSubmitting.value = true
  try {
    const body = {
      email,
      fullName,
      role: formRole.value,
      phone: formPhone.value.trim() || undefined,
      departmentId: formDeptId.value ? Number(formDeptId.value) : null,
      ...(pw ? { password: pw, confirmPassword: pw2 } : {}),
    }
    await updateEmployeeAdmin(editingId.value, body)
    toast.success('Đã cập nhật nhân viên thành công.')
    closeModal()
    await load()
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Lưu thất bại.')
  } finally {
    formSubmitting.value = false
  }
}

async function toggleActive(row: AdminEmployeeDto) {
  if (togglingId.value) return
  const next = !row.active
  togglingId.value = row.id
  try {
    await setEmployeeActive(row.id, next)
    row.active = next
    toast.success(next ? 'Đã kích hoạt nhân viên.' : 'Đã tạm ngưng nhân viên.')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Không cập nhật được trạng thái.')
  } finally {
    togglingId.value = null
  }
}

async function onDelete(row: AdminEmployeeDto) {
  const ok = await confirm({
    title: 'Xóa nhân viên',
    message: `Xóa nhân viên "${row.fullName}" (${row.email})? Thao tác không hoàn tác.`,
  })
  if (!ok) return
  try {
    await deleteEmployeeAdmin(row.id)
    toast.success('Đã xóa nhân viên thành công.')
    await load()
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Xóa thất bại.')
  }
}

function applyFilters() {
  page.value = 0
  load()
}

function clearFilters() {
  filterSearch.value = ''
  filterRole.value = ''
  filterActive.value = 'all'
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

onMounted(async () => {
  await loadDepts()
  await load()
})
</script>

<template>
  <div class="bg-background text-on-surface min-h-screen pb-28">
    <main class="mx-auto max-w-7xl space-y-6 px-4 pt-4">
      <div class="space-y-4">
        <RouterLink
          class="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-container"
          :to="{ name: 'admin-dashboard' }"
        >
          <span class="material-symbols-outlined text-xl">arrow_back</span>
          Quay lại
        </RouterLink>
        <div>
          <h1 class="font-headline text-2xl font-extrabold tracking-tight text-on-surface">Nhân viên</h1>
          <p class="text-sm text-on-surface-variant">Quản lý nhân viên (admin).</p>
        </div>
      </div>

      <div class="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm">
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
              >Tìm kiếm</label
            >
            <input
              v-model="filterSearch"
              type="text"
              class="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Tên, email, SĐT…"
              @keyup.enter="applyFilters"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
              >Vai trò</label
            >
            <select
              v-model="filterRole"
              class="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Tất cả</option>
              <option v-for="r in roleOptions" :key="r" :value="r">{{ r }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
              >Trạng thái</label
            >
            <select
              v-model="filterActive"
              class="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">Tất cả</option>
              <option value="true">Đang hoạt động</option>
              <option value="false">Ngưng</option>
            </select>
          </div>
        </div>
        <div class="mt-3 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/40 px-4 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-low"
            @click="clearFilters"
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
      </div>

      <div class="overflow-hidden rounded-2xl border border-outline-variant/15 bg-surface-container-lowest shadow-sm">
        <div v-if="loading" class="p-8 text-center text-on-surface-variant">Đang tải…</div>
        <table v-else class="w-full text-left text-sm">
          <thead class="border-b border-outline-variant/20 bg-surface-container-low">
            <tr>
              <th class="px-4 py-3 font-semibold text-on-surface-variant">Họ tên</th>
              <th class="hidden px-4 py-3 font-semibold text-on-surface-variant sm:table-cell">Email</th>
              <th class="px-4 py-3 font-semibold text-on-surface-variant">Vai trò</th>
              <th class="px-4 py-3 font-semibold text-on-surface-variant">Hoạt động</th>
              <th class="w-28 px-2 py-3 text-right" aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id" class="border-b border-outline-variant/10 last:border-0">
              <td class="px-4 py-3 font-medium text-on-surface">{{ row.fullName }}</td>
              <td class="hidden px-4 py-3 text-on-surface-variant sm:table-cell">{{ row.email }}</td>
              <td class="px-4 py-3 text-xs">{{ row.roleDisplayName || row.role }}</td>
              <td class="px-4 py-2">
                <button
                  type="button"
                  role="switch"
                  :aria-checked="row.active"
                  :aria-busy="togglingId === row.id"
                  :disabled="togglingId === row.id"
                  class="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50"
                  :class="row.active ? 'bg-primary' : 'bg-outline-variant/50'"
                  :title="row.active ? 'Đang hoạt động — bấm để ngưng' : 'Đang ngưng — bấm để kích hoạt'"
                  @click="toggleActive(row)"
                >
                  <span
                    class="pointer-events-none absolute top-1 left-1 size-5 rounded-full bg-white shadow transition-transform duration-200"
                    :class="row.active ? 'translate-x-5' : 'translate-x-0'"
                  />
                </button>
              </td>
              <td class="px-2 py-2 text-right">
                <div class="inline-flex justify-end gap-1">
                  <button
                    type="button"
                    class="rounded-lg p-2 text-primary transition-colors hover:bg-surface-container-low"
                    aria-label="Sửa"
                    @click="openEdit(row)"
                  >
                    <span class="material-symbols-outlined text-xl">edit</span>
                  </button>
                  <button
                    type="button"
                    class="rounded-lg p-2 text-error transition-colors hover:bg-error-container/30"
                    aria-label="Xóa"
                    @click="onDelete(row)"
                  >
                    <span class="material-symbols-outlined text-xl">delete</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!rows.length">
              <td colspan="5" class="px-4 py-8 text-center text-on-surface-variant">Không có dữ liệu.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="totalPages > 1 || totalElements > 0"
        class="flex flex-wrap items-center justify-between gap-2 text-sm text-on-surface-variant"
      >
        <span>Tổng {{ totalElements }} — Trang {{ page + 1 }} / {{ totalPages || 1 }}</span>
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

    <div
      v-if="showModal"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      @click.self="closeModal"
    >
      <div
        class="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-xl"
        @click.stop
      >
        <h2 class="font-headline text-lg font-bold text-on-surface">{{ modalTitle }}</h2>
        <form class="mt-4 space-y-3" @submit.prevent="submitForm">
          <div>
            <label class="mb-1 block text-xs font-semibold uppercase text-on-surface-variant">Email</label>
            <input
              v-model="formEmail"
              type="email"
              required
              class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-on-surface"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold uppercase text-on-surface-variant">Họ tên</label>
            <input
              v-model="formFullName"
              type="text"
              required
              maxlength="100"
              class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-on-surface"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold uppercase text-on-surface-variant">Điện thoại</label>
            <input
              v-model="formPhone"
              type="text"
              maxlength="20"
              class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-on-surface"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold uppercase text-on-surface-variant">Vai trò</label>
            <select
              v-model="formRole"
              class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-on-surface"
            >
              <option v-for="r in roleOptions" :key="r" :value="r">{{ r }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold uppercase text-on-surface-variant">Phòng ban</label>
            <select
              v-model="formDeptId"
              class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-on-surface"
            >
              <option value="">— Không —</option>
              <option v-for="d in deptOptions" :key="d.id" :value="d.id">{{ d.code }} — {{ d.name }}</option>
            </select>
          </div>
          <div class="border-t border-outline-variant/20 pt-3">
            <p class="mb-2 text-xs text-on-surface-variant">Đổi mật khẩu (tùy chọn, để trống nếu giữ nguyên)</p>
            <input
              v-model="formPassword"
              type="password"
              placeholder="Mật khẩu mới"
              class="mb-2 w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm"
            />
            <input
              v-model="formPassword2"
              type="password"
              placeholder="Xác nhận mật khẩu"
              class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm"
            />
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              class="rounded-lg px-4 py-2 text-sm font-semibold text-on-surface-variant"
              @click="closeModal"
            >
              Hủy
            </button>
            <button
              type="submit"
              class="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-60"
              :disabled="formSubmitting"
            >
              {{ formSubmitting ? 'Đang lưu…' : 'Lưu' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
