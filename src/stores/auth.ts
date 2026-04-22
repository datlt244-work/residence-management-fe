import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getCurrentEmployee } from '@/services/employee.service'
import type { LoginResponseDto } from '@/types/auth'
import type { EmployeeDto } from '@/types/employee'

const TOKEN_KEY = 'access_token'

function readTokenFromStorage(): string | null {
  return sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY)
}

function persistToken(token: string, remember: boolean) {
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token)
    sessionStorage.removeItem(TOKEN_KEY)
  } else {
    sessionStorage.setItem(TOKEN_KEY, token)
    localStorage.removeItem(TOKEN_KEY)
  }
}

function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<EmployeeDto | null>(null)
  const accessToken = ref<string | null>(readTokenFromStorage())

  const isAuthenticated = computed(() => !!accessToken.value)

  /** Tránh gọi /employees/me song song khi nhiều navigation cùng lúc. */
  let hydrateInflight: Promise<boolean> | null = null

  /**
   * Sau F5: token còn trong storage nhưng Pinia mất `user`.
   * Gọi GET /employees/me để khôi phục role / tên hiển thị; lỗi 401 → xóa session.
   */
  async function hydrateFromToken(): Promise<boolean> {
    if (!accessToken.value) return false
    if (user.value) return true
    if (hydrateInflight) return hydrateInflight

    hydrateInflight = (async () => {
      try {
        user.value = await getCurrentEmployee()
        return true
      } catch {
        logout()
        return false
      } finally {
        hydrateInflight = null
      }
    })()

    return hydrateInflight
  }

  function setLoginData(data: LoginResponseDto, remember: boolean) {
    user.value = data.employee
    accessToken.value = data.accessToken
    persistToken(data.accessToken, remember)
  }

  function setUser(employee: EmployeeDto | null) {
    user.value = employee
  }

  function logout() {
    user.value = null
    accessToken.value = null
    clearStoredToken()
  }

  return { user, accessToken, isAuthenticated, setLoginData, setUser, logout, hydrateFromToken }
})
