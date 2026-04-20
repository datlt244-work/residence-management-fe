export interface DepartmentListItemDto {
  id: string
  code: string
  name: string
  createdAt?: string
  updatedAt?: string
}

export interface PageResultDepartmentListItemDto {
  content: DepartmentListItemDto[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
}

export interface CreateDepartmentCommand {
  code: string
  name: string
}

export interface UpdateDepartmentAdminCommand {
  code: string
  name: string
}
