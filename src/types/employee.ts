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
