import { API_BASE_URL } from '@/config/api'
import type { ApiResponse } from '@/types/api'

const TOKEN_KEY = 'access_token'

export function getAccessToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY)
}

/**
 * Gọi API dưới `VITE_API_BASE_URL` (đã gồm /api), tự gắn Bearer.
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const base = API_BASE_URL.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  const url = `${base}${p}`
  const headers = new Headers(init.headers)
  if (
    !headers.has('Content-Type') &&
    init.body != null &&
    !(init.body instanceof FormData) &&
    !(init.body instanceof URLSearchParams)
  ) {
    headers.set('Content-Type', 'application/json')
  }
  const token = getAccessToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return fetch(url, { ...init, headers })
}

export async function parseJsonResponse<T>(res: Response): Promise<ApiResponse<T>> {
  const json = (await res.json()) as ApiResponse<T> & { error?: string }
  if (!res.ok || json.success === false) {
    const backendMsg = typeof json.message === 'string' ? json.message.trim() : ''
    if (backendMsg) {
      throw new Error(backendMsg)
    }
    if (res.status === 401) {
      throw new Error('Phiên đăng nhập hết hạn hoặc không hợp lệ.')
    }
    if (res.status === 403) {
      throw new Error('Không có quyền thực hiện thao tác này.')
    }
    throw new Error(`Lỗi máy chủ (${res.status}).`)
  }
  return json
}
