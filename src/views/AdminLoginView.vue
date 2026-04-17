<script setup lang="ts">
import { ref } from 'vue'
import { useLoginForm } from '@/composables/useLoginForm'

const showPassword = ref(false)
const { email, password, emailError, passwordError, apiError, isSubmitting, rememberMe, onSubmit } =
  useLoginForm()
</script>

<template>
  <div class="bg-background text-on-background min-h-screen flex flex-col">
    <header
      class="w-full top-0 sticky bg-[#f3faff] dark:bg-[#071e27] text-[#003652] dark:text-[#cfe6f2] z-50"
    >
      <div class="flex justify-between items-center px-6 py-4 w-full">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-2xl">apartment</span>
          <span class="text-xl font-extrabold tracking-tighter text-[#003652] dark:text-[#f3faff]">
            ThanhDatAP
          </span>
        </div>
        <div class="hidden md:flex items-center gap-6">
          <span
            class="font-headline font-bold tracking-tight text-xs uppercase tracking-widest text-outline"
          >
            Hệ thống ThanhDatAP
          </span>
          <button
            type="button"
            class="text-[#003652] dark:text-[#cfe6f2] font-bold hover:bg-[#cfe6f2] dark:hover:bg-[#1a4d6d] transition-colors px-4 py-2 rounded-lg active:scale-95 duration-200"
          >
            Trợ giúp
          </button>
        </div>
      </div>
    </header>

    <main class="flex-grow flex items-center justify-center">
      <div class="w-full h-full min-h-[calc(100dvh-80px)] flex flex-col md:flex-row">
        <section class="hidden md:flex md:w-1/2 lg:w-3/5 bg-primary-container relative overflow-hidden">
          <img
            alt="Tòa nhà hiện đại"
            class="absolute inset-0 w-full h-full object-cover opacity-80"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBATEbq8W8QicrAtgNN2iguUNiXOTrL-qoET8gh52w8zEqzrvbwceHXL6lGpBKtAOlD46aNDtUFoOimRl7_Hq8KUo1x6dm88Sf8saryKwSJq79o-1yvaDUWL4QFeis6icTeWBtfpFS96-c682fcdQUN4kD1f4cIjb1sM0nhoHqeRjg7T8hJv1f4kJC1mSQK8ASojhwZad5SJyZDS2gA_3gc519EAr2EzSW2Bn9kSaCdHvYcipzcTDg8q5-Q9SzGUqByLvzyyq2Oqc7M"
          />
          <div
            class="absolute inset-0 bg-gradient-to-tr from-primary via-transparent to-transparent opacity-60"
          />
          <div class="relative z-10 flex flex-col justify-end p-16 text-white w-full">
            <div class="max-w-xl">
              <h2 class="text-5xl font-extrabold tracking-tighter mb-6 leading-none font-headline">
                Nâng tầm quản lý danh mục bất động sản.
              </h2>
              <p class="text-lg font-medium text-surface-variant max-w-md">
                ThanhDatAP mang đến cái nhìn chuyên sâu về danh mục bất động sản của bạn với dữ liệu chính
                xác và thông tin chi tiết, phục vụ vận hành quản trị hiệu quả.
              </p>
              <div class="mt-12 flex gap-4">
                <div class="h-1 w-12 bg-tertiary-fixed rounded-full" />
                <div class="h-1 w-1 bg-white opacity-30 rounded-full" />
                <div class="h-1 w-1 bg-white opacity-30 rounded-full" />
              </div>
            </div>
          </div>
        </section>

        <section
          class="w-full md:w-1/2 lg:w-2/5 flex flex-col items-center justify-center p-8 md:p-16 lg:p-24 bg-surface"
        >
          <div class="w-full max-w-sm space-y-8">
            <div class="text-center md:text-left">
              <div class="md:hidden flex justify-center mb-6">
                <span class="material-symbols-outlined text-4xl text-primary">apartment</span>
              </div>
              <h1 class="text-3xl font-extrabold tracking-tight text-on-surface mb-2 font-headline">
                Cổng Quản trị
              </h1>
              <p class="text-on-surface-variant font-medium">
                Vui lòng nhập thông tin đăng nhập để truy cập hệ thống quản lý bất động sản.
              </p>
            </div>

            <div
              v-if="apiError"
              class="flex items-center gap-3 p-4 bg-error-container rounded-xl text-on-error-container text-sm font-medium"
            >
              <span class="material-symbols-outlined shrink-0 text-[20px]">error</span>
              <p>{{ apiError }}</p>
            </div>

            <form class="space-y-6" @submit.prevent="onSubmit">
              <div class="space-y-4">
                <div class="group">
                  <label
                    class="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2"
                    for="admin-email"
                  >
                    Tên đăng nhập / Email
                  </label>
                  <div class="relative flex items-center">
                    <span class="material-symbols-outlined absolute left-4 text-outline text-xl">person</span>
                    <input
                      id="admin-email"
                      v-model="email"
                      name="email"
                      type="text"
                      autocomplete="username"
                      maxlength="254"
                      placeholder="admin@thanhdatap.local"
                      class="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/40 focus:bg-surface-container transition-all outline-none"
                      :class="emailError ? 'ring-2 ring-error' : ''"
                    />
                  </div>
                  <p v-if="emailError" class="text-xs text-error mt-1.5">{{ emailError }}</p>
                </div>

                <div class="group">
                  <div class="flex justify-between items-center mb-2">
                    <label
                      class="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                      for="admin-password"
                    >
                      Mật khẩu
                    </label>
                    <RouterLink
                      class="text-xs font-bold text-primary hover:underline"
                      :to="{ name: 'forgot-password' }"
                    >
                      Quên mật khẩu?
                    </RouterLink>
                  </div>
                  <div class="relative flex items-center">
                    <span class="material-symbols-outlined absolute left-4 text-outline text-xl">lock</span>
                    <input
                      id="admin-password"
                      v-model="password"
                      name="password"
                      :type="showPassword ? 'text' : 'password'"
                      autocomplete="current-password"
                      maxlength="128"
                      placeholder="••••••••"
                      class="w-full pl-12 pr-12 py-4 bg-surface-container-low border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/40 focus:bg-surface-container transition-all outline-none"
                      :class="passwordError ? 'ring-2 ring-error' : ''"
                    />
                    <button
                      class="absolute right-4 text-outline hover:text-primary"
                      type="button"
                      @click="showPassword = !showPassword"
                    >
                      <span class="material-symbols-outlined text-xl">{{
                        showPassword ? 'visibility_off' : 'visibility'
                      }}</span>
                    </button>
                  </div>
                  <p v-if="passwordError" class="text-xs text-error mt-1.5">{{ passwordError }}</p>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <input
                  id="remember"
                  v-model="rememberMe"
                  class="w-4 h-4 rounded-sm border-outline-variant text-primary focus:ring-primary accent-primary"
                  type="checkbox"
                />
                <label class="text-sm font-medium text-on-surface-variant" for="remember">
                  Duy trì đăng nhập trong 24 giờ
                </label>
              </div>

              <button
                class="w-full bg-gradient-to-br from-[#003652] to-[#1a4d6d] text-white py-4 rounded-xl font-bold tracking-tight shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
                type="submit"
                :disabled="isSubmitting"
              >
                <span v-if="isSubmitting" class="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                <span>{{ isSubmitting ? 'Đang đăng nhập…' : 'Đăng nhập' }}</span>
              </button>
            </form>

            <div class="pt-6 border-t border-outline-variant/15 text-center">
              <p class="text-xs text-on-surface-variant font-medium mb-4">CỔNG KẾT NỐI BẢO MẬT</p>
              <div class="flex justify-center gap-6 grayscale opacity-60">
                <span class="material-symbols-outlined text-2xl">verified_user</span>
                <span class="material-symbols-outlined text-2xl">security</span>
                <span class="material-symbols-outlined text-2xl">encrypted</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <footer class="w-full py-8 mt-auto bg-[#f3faff] dark:bg-[#071e27] border-t border-[#c1c7ce26]">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center px-8">
        <div class="mb-4 md:mb-0">
          <span class="text-sm font-bold text-[#003652] dark:text-[#f3faff]">ThanhDatAP</span>
          <span class="mx-2 text-outline-variant">|</span>
          <span class="text-xs font-medium text-[#41474d] dark:text-[#c1c7ce]">
            © 2026 Hệ thống quản lý cư trú và bất động sản
          </span>
        </div>
        <div class="flex gap-6">
          <a
            class="text-xs font-medium text-[#72787e] hover:text-[#003652] dark:hover:text-[#cfe6f2] transition-opacity opacity-80 hover:opacity-100"
            href="#"
          >
            Bảo mật
          </a>
          <a
            class="text-xs font-medium text-[#72787e] hover:text-[#003652] dark:hover:text-[#cfe6f2] transition-opacity opacity-80 hover:opacity-100"
            href="#"
          >
            Điều khoản
          </a>
          <a
            class="text-xs font-medium text-[#72787e] hover:text-[#003652] dark:hover:text-[#cfe6f2] transition-opacity opacity-80 hover:opacity-100"
            href="#"
          >
            Hỗ trợ
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>
