<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { changeMyPassword, getCurrentEmployee, updateMyProfile } from '@/services/employee.service'
import { useToast } from '@/composables/useToast'

const auth = useAuthStore()
const toast = useToast()

const fullName = ref('')
const loadingProfile = ref(false)

const currentPassword = ref('')
const newPassword = ref('')
const newPassword2 = ref('')
const loadingPw = ref(false)

onMounted(async () => {
  try {
    const me = await getCurrentEmployee()
    auth.setUser(me)
    fullName.value = me.fullName ?? ''
  } catch {
    fullName.value = auth.user?.fullName ?? ''
  }
})

async function saveProfile() {
  const name = fullName.value.trim()
  if (!name) {
    toast.error('Vui lòng nhập họ tên.')
    return
  }
  loadingProfile.value = true
  try {
    const me = await updateMyProfile({ fullName: name })
    auth.setUser(me)
    toast.success('Đã cập nhật hồ sơ thành công.')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Cập nhật thất bại.')
  } finally {
    loadingProfile.value = false
  }
}

async function savePassword() {
  const cur = currentPassword.value
  const nw = newPassword.value
  const nw2 = newPassword2.value
  if (!cur || !nw) {
    toast.error('Vui lòng nhập đủ mật khẩu hiện tại và mật khẩu mới.')
    return
  }
  if (nw.length < 8) {
    toast.error('Mật khẩu mới tối thiểu 8 ký tự.')
    return
  }
  if (nw !== nw2) {
    toast.error('Mật khẩu mới nhập lại không khớp.')
    return
  }
  loadingPw.value = true
  try {
    await changeMyPassword({ currentPassword: cur, newPassword: nw })
    currentPassword.value = ''
    newPassword.value = ''
    newPassword2.value = ''
    toast.success('Đã đổi mật khẩu thành công.')
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Đổi mật khẩu thất bại.')
  } finally {
    loadingPw.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-lg px-4 pb-28 pt-4">
    <RouterLink
      class="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
      :to="{ name: 'admin-dashboard' }"
    >
      <span class="material-symbols-outlined text-xl">arrow_back</span>
      Quay lại
    </RouterLink>

    <h1 class="font-headline text-2xl font-extrabold text-on-surface">Cài đặt tài khoản</h1>
    <p class="mt-1 text-sm text-on-surface-variant">Cập nhật họ tên và mật khẩu đăng nhập.</p>

    <section class="mt-8 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
      <h2 class="font-headline text-lg font-bold text-on-surface">Hồ sơ</h2>
      <p class="mt-1 text-xs text-on-surface-variant">API: PUT /employees/me/profile</p>
      <div class="mt-4">
        <label class="mb-1 block text-xs font-semibold uppercase text-on-surface-variant" for="prof-name"
          >Họ và tên</label
        >
        <input
          id="prof-name"
          v-model="fullName"
          type="text"
          maxlength="100"
          class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2.5 text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <button
        type="button"
        class="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-60"
        :disabled="loadingProfile"
        @click="saveProfile"
      >
        {{ loadingProfile ? 'Đang lưu…' : 'Lưu hồ sơ' }}
      </button>
    </section>

    <section class="mt-6 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
      <h2 class="font-headline text-lg font-bold text-on-surface">Đổi mật khẩu</h2>
      <p class="mt-1 text-xs text-on-surface-variant">API: PUT /employees/me/password</p>
      <div class="mt-4 space-y-3">
        <div>
          <label class="mb-1 block text-xs font-semibold uppercase text-on-surface-variant" for="pw-cur"
            >Mật khẩu hiện tại</label
          >
          <input
            id="pw-cur"
            v-model="currentPassword"
            type="password"
            autocomplete="current-password"
            class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2.5 text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs font-semibold uppercase text-on-surface-variant" for="pw-new"
            >Mật khẩu mới</label
          >
          <input
            id="pw-new"
            v-model="newPassword"
            type="password"
            autocomplete="new-password"
            class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2.5 text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs font-semibold uppercase text-on-surface-variant" for="pw-new2"
            >Nhập lại mật khẩu mới</label
          >
          <input
            id="pw-new2"
            v-model="newPassword2"
            type="password"
            autocomplete="new-password"
            class="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2.5 text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>
      <button
        type="button"
        class="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-60"
        :disabled="loadingPw"
        @click="savePassword"
      >
        {{ loadingPw ? 'Đang đổi…' : 'Đổi mật khẩu' }}
      </button>
    </section>
  </div>
</template>
