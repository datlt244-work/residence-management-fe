<template>
  <div class="min-h-dvh flex flex-col items-center justify-center bg-background px-6 py-12">
    <div class="w-full max-w-md rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-8 shadow-lg">
      <div class="mb-6 flex justify-center">
        <span class="material-symbols-outlined text-4xl text-primary">lock_reset</span>
      </div>
      <h1 class="text-center font-headline text-2xl font-extrabold text-on-surface">Quên mật khẩu</h1>
      <p class="mt-3 text-center text-sm text-on-surface-variant">
        Liên hệ quản trị hệ thống hoặc bộ phận IT để được cấp lại quyền truy cập.
      </p>
      <RouterLink
        class="mt-8 block w-full rounded-xl bg-gradient-to-br from-[#003652] to-[#1a4d6d] py-3 text-center text-sm font-bold text-white shadow-lg shadow-primary/20"
        :to="{ name: 'login' }"
      >
        Quay lại đăng nhập
      </RouterLink>
    </div>
  </div>
</template>
