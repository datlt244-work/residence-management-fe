<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
} from '@/services/department.service'
import type { DepartmentListItemDto } from '@/types/department'

const toast = useToast()
const { confirm } = useConfirm()

const loading = ref(false)
const page = ref(0)
const pageSize = ref(20)
const totalPages = ref(0)
const totalElements = ref(0)
const rows = ref<DepartmentListItemDto[]>([])

const filterCode = ref('')
const filterName = ref('')
const filterCreatedFrom = ref('')
const filterCreatedTo = ref('')

const showModal = ref(false)
const editingId = ref<string | null>(null)
const formCode = ref('')
const formName = ref('')
const formSubmitting = ref(false)

const modalTitle = computed(() => (editingId.value ? 'Sửa phòng ban' : 'Thêm phòng ban'))

function formatDt(iso: string | undefined) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('vi-VN')
  } catch {
    return iso
  }
}

async function load() {
  loading.value = true
  try {
    const data = await listDepartments({
      page: page.value,
      size: pageSize.value,
      code: filterCode.value.trim() || undefined,
      name: filterName.value.trim() || undefined,
      createdFrom: filterCreatedFrom.value || undefined,
      createdTo: filterCreatedTo.value || undefined,
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

function openCreate() {
  editingId.value = null
  formCode.value = ''
  formName.value = ''
  showModal.value = true
}

function openEdit(row: DepartmentListItemDto) {
  editingId.value = row.id
  formCode.value = row.code
  formName.value = row.name
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
}

async function submitForm() {
  const code = formCode.value.trim()
  const name = formName.value.trim()
  if (!code || !name) {
    toast.error('Vui lòng nhập mã và tên phòng ban.')
    return
  }
  formSubmitting.value = true
  try {
    if (editingId.value) {
      await updateDepartment(editingId.value, { code, name })
      toast.success('Đã cập nhật phòng ban thành công.')
    } else {
      await createDepartment({ code, name })
      toast.success('Đã tạo phòng ban thành công.')
    }
    closeModal()
    await load()
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Lưu thất bại.')
  } finally {
    formSubmitting.value = false
  }
}

async function onDelete(row: DepartmentListItemDto) {
  const ok = await confirm({
    title: 'Xóa phòng ban',
    message: `Bạn có chắc muốn xóa phòng ban "${row.name}" (${row.code})?\nKhông thể hoàn tác nếu còn nhân viên tham chiếu.`,
  })
  if (!ok) return
  try {
    await deleteDepartment(row.id)
    toast.success('Đã xóa phòng ban thành công.')
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
  filterCode.value = ''
  filterName.value = ''
  filterCreatedFrom.value = ''
  filterCreatedTo.value = ''
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

onMounted(() => {
  load()
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
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 class="font-headline text-2xl font-extrabold tracking-tight text-on-surface">Phòng ban</h1>
            <p class="text-sm text-on-surface-variant">Quản lý danh mục phòng ban.</p>
          </div>
          <button
            type="button"
            class="rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-transform active:scale-[0.98]"
            @click="openCreate"
          >
            Thêm phòng ban
          </button>
        </div>
      </div>

      <div class="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm">
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Mã</label>
          <input
            v-model="filterCode"
            type="text"
            class="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Lọc theo mã"
            @keyup.enter="applyFilters"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Tên</label>
          <input
            v-model="filterName"
            type="text"
            class="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Lọc theo tên"
            @keyup.enter="applyFilters"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
            >Tạo từ</label
          >
          <input
            v-model="filterCreatedFrom"
            type="date"
            class="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
            >Tạo đến</label
          >
          <input
            v-model="filterCreatedTo"
            type="date"
            class="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
          />
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
              <th class="px-4 py-3 font-semibold text-on-surface-variant">Mã</th>
              <th class="px-4 py-3 font-semibold text-on-surface-variant">Tên</th>
              <th class="hidden px-4 py-3 font-semibold text-on-surface-variant md:table-cell">Tạo lúc</th>
              <th class="w-24 px-2 py-3 text-right" aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id" class="border-b border-outline-variant/10 last:border-0">
              <td class="px-4 py-3 font-mono text-xs text-on-surface">{{ row.code }}</td>
              <td class="px-4 py-3 font-medium text-on-surface">{{ row.name }}</td>
              <td class="hidden px-4 py-3 text-on-surface-variant md:table-cell">{{ formatDt(row.createdAt) }}</td>
              <td class="px-2 py-2 text-right">
                <div class="inline-flex items-center justify-end gap-1">
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
              <td colspan="4" class="px-4 py-8 text-center text-on-surface-variant">Không có dữ liệu.</td>
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

    <!-- Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-on-surface/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      @click.self="closeModal"
    >
      <div
        class="w-full max-w-md rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-xl"
        @click.stop
      >
        <h2 class="font-headline text-lg font-bold text-on-surface">{{ modalTitle }}</h2>
        <form class="mt-4 space-y-4" @submit.prevent="submitForm">
          <div>
            <label class="mb-1 block text-xs font-semibold uppercase text-on-surface-variant" for="dept-code">Mã</label>
            <input
              id="dept-code"
              v-model="formCode"
              type="text"
              required
              maxlength="50"
              class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2.5 text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold uppercase text-on-surface-variant" for="dept-name"
              >Tên</label
            >
            <input
              id="dept-name"
              v-model="formName"
              type="text"
              required
              maxlength="100"
              class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2.5 text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              class="rounded-lg px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low"
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
