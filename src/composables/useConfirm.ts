import { ref } from 'vue'

const open = ref(false)
const title = ref('Xác nhận')
const message = ref('')
let resolveFn: ((value: boolean) => void) | null = null

export function useConfirm() {
  function confirm(opts: { title?: string; message: string }): Promise<boolean> {
    title.value = opts.title ?? 'Xác nhận'
    message.value = opts.message
    open.value = true
    return new Promise<boolean>((resolve) => {
      resolveFn = resolve
    })
  }

  function yes() {
    open.value = false
    resolveFn?.(true)
    resolveFn = null
  }

  function no() {
    open.value = false
    resolveFn?.(false)
    resolveFn = null
  }

  return { open, title, message, confirm, yes, no }
}
