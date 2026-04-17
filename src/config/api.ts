export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''

export const apiEndpoints = {
  auth: {
    login: `${API_BASE_URL}/auth/admin/login`,
    forgotPassword: `${API_BASE_URL}/auth/forgot-password`,
  },
} as const
