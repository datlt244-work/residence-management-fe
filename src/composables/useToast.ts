import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id: number
  message: string
  type: ToastType
}

const toasts = ref<ToastItem[]>([])
let idCounter = 0

function remove(id: number) {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

export function useToast() {
  function push(message: string, type: ToastType = 'info', durationMs = 4200) {
    const id = ++idCounter
    toasts.value = [...toasts.value, { id, message, type }]
    if (durationMs > 0) {
      setTimeout(() => remove(id), durationMs)
    }
  }

  return {
    toasts,
    remove,
    success: (message: string) => push(message, 'success'),
    error: (message: string) => push(message, 'error'),
    info: (message: string) => push(message, 'info'),
  }
}
