import { apiEndpoints } from '@/config/api'
import type { ApiResponse } from '@/types/api'
import type { LoginData, LoginRequest } from '@/types/auth'

export async function loginApi(payload: LoginRequest): Promise<ApiResponse<LoginData>> {
  const res = await fetch(apiEndpoints.auth.login, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const json = (await res.json()) as ApiResponse<LoginData> & { error?: string }

  if (!res.ok || json.success === false) {
    const backendMsg = typeof json.message === 'string' ? json.message.trim() : ''
    if (backendMsg) {
      throw new Error(backendMsg)
    }
    if (res.status === 403) {
      throw new Error('Máy chủ từ chối truy cập (403). Kiểm tra cấu hình bảo mật API hoặc quyền gọi endpoint.')
    }
    if (res.status === 401) {
      throw new Error('Sai tên đăng nhập hoặc mật khẩu.')
    }
    throw new Error('Đăng nhập thất bại.')
  }

  return json
}
