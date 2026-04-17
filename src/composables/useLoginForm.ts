import { ref } from 'vue'
import { useForm, useField } from 'vee-validate'
import * as yup from 'yup'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { loginApi } from '@/services/auth.service'

const emailOrUsername = yup
  .string()
  .required('Vui lòng nhập tên đăng nhập hoặc email.')
  .max(254, 'Tối đa 254 ký tự.')
  .test('login-id', 'Định dạng không hợp lệ.', (value) => {
    if (!value) return false
    const emailLike = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    const usernameLike = /^[a-zA-Z0-9_.@-]{3,}$/.test(value)
    return emailLike || usernameLike
  })

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
