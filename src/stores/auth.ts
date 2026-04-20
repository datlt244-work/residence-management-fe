import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
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

  return { user, accessToken, isAuthenticated, setLoginData, setUser, logout }
})
