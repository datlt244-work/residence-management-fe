<script setup lang="ts">
import ConfirmDialogHost from '@/components/ConfirmDialogHost.vue'
import ToastHost from '@/components/ToastHost.vue'
</script>

<template>
  <RouterView />
  <ToastHost />
  <ConfirmDialogHost />
</template>
