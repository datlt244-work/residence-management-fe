import type { EmployeeDto } from '@/types/employee'

export interface LoginRequest {
  email: string
  password: string
}

/** Khớp OpenAPI LoginResponseDto (trường data khi đăng nhập thành công). */
export interface LoginResponseDto {
  accessToken: string
  tokenType: string
  expiresIn: number
  employee: EmployeeDto
  loginTime: string
  valid: boolean
}
