import { ref } from 'vue'
import { useForm, useField } from 'vee-validate'
import * as yup from 'yup'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { loginApi } from '@/services/auth.service'

/** Ký tự cho phép trong tên đăng nhập (không dùng regex trên chuỗi dài — tránh ReDoS). */
function isAllowedLoginUsernameChar(ch: string): boolean {
  const code = ch.charCodeAt(0)
  if (code >= 48 && code <= 57) return true
  if (code >= 65 && code <= 90) return true
  if (code >= 97 && code <= 122) return true
  return ch === '_' || ch === '.' || ch === '@' || ch === '-'
}

function isLoginUsername(value: string): boolean {
  if (value.length < 3) return false
  for (let i = 0; i < value.length; i++) {
    if (!isAllowedLoginUsernameChar(value[i]!)) return false
  }
  return true
}

function isLoginEmailShape(value: string): boolean {
  let atIndex = -1
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i)
    if (code === 64) {
      if (atIndex !== -1) return false
      atIndex = i
    }
    if (code <= 32 || code === 127) return false
  }
  if (atIndex <= 0 || atIndex === value.length - 1) return false

  const domain = value.slice(atIndex + 1)
  if (!domain.includes('.')) return false
  if (domain.startsWith('.') || domain.endsWith('.')) return false
  if (domain.includes('..')) return false

  return true
}

function isValidLoginId(value: string): boolean {
  if (!value) return false
  return isLoginEmailShape(value) || isLoginUsername(value)
}

const emailOrUsername = yup
  .string()
  .required('Vui lòng nhập tên đăng nhập hoặc email.')
  .max(254, 'Tối đa 254 ký tự.')
  .test('login-id', 'Định dạng không hợp lệ.', isValidLoginId)

export function useLoginForm() {
  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()
  const apiError = ref('')
  const rememberMe = ref(true)

  const schema = yup.object({
    email: emailOrUsername,
    password: yup
      .string()
      .required('Vui lòng nhập mật khẩu.')
      .max(128, 'Tối đa 128 ký tự.'),
  })

  const { handleSubmit, isSubmitting } = useForm({ validationSchema: schema })

  const { value: email, errorMessage: emailError } = useField<string>('email', undefined, {
    initialValue: '',
  })
  const { value: password, errorMessage: passwordError } = useField<string>('password', undefined, {
    initialValue: '',
  })

  const onSubmit = handleSubmit(async (values) => {
    apiError.value = ''
    try {
      const res = await loginApi({ email: values.email, password: values.password })
      authStore.setLoginData(res.data, rememberMe.value)
      const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
      if (redirect.startsWith('/') && !redirect.startsWith('//')) {
        await router.push(redirect)
      } else {
        await router.push({ name: 'admin-dashboard' })
      }
    } catch (err) {
      apiError.value = err instanceof Error ? err.message : 'Đã xảy ra lỗi không mong muốn.'
    }
  })

  return { email, password, emailError, passwordError, apiError, isSubmitting, rememberMe, onSubmit }
}
