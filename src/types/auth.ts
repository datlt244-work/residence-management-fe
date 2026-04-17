export interface AuthUser {
  id: string
  email: string
  phoneNumber: string | null
  fullName: string
  isActive: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginData {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: AuthUser
  loginTime: string
  valid: boolean
}
