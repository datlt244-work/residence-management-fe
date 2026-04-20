/** Khớp OpenAPI EmployeeDto */
export interface EmployeeDto {
  id: string
  email: string
  fullName: string
  phone?: string | null
  departmentId?: number | null
  role: string
  isActive: boolean
}

/** GET /employees-management (danh sách admin) */
export interface AdminEmployeeDto {
  id: string
  fullName: string
  email: string
  phoneNumber: string | null
  role: string
  roleDisplayName?: string
  active: boolean
}

export interface PageResultAdminEmployeeDto {
  content: AdminEmployeeDto[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
}

/** GET /employees-management/{id} */
export interface EmployeeAdminDetailDto {
  id: string
  email: string
  fullName: string
  phone: string | null
  departmentId: number | null
  departmentName: string | null
  role: string
  isActive: boolean
}

export interface UpdateEmployeeProfileRequest {
  fullName: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface UpdateEmployeeAdminCommand {
  email: string
  fullName: string
  role?: string
  departmentId?: number | null
  phone?: string
  password?: string
  confirmPassword?: string
}

/** PATCH /employees-management/{id}/active */
export interface SetEmployeeActiveCommand {
  active: boolean
}
