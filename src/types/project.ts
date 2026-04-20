export interface ApartmentTypeSidebarDto {
  id: string
  code?: string | null
  name: string
  displayOrder: number
}

export interface ZoneSidebarDto {
  id: string
  code?: string | null
  name: string
  displayOrder: number
  apartmentTypes: ApartmentTypeSidebarDto[]
}

export interface ProjectManagementSidebarDto {
  id: string
  code: string
  name: string
  status: string
  displayOrder: number
  zones: ZoneSidebarDto[]
}

/** POST /projects-management — tên hiển thị + mã duy nhất; status mặc định ACTIVE phía server. */
export interface CreateProjectCommand {
  code: string
  name: string
}

/** PUT /projects-management/{id} */
export interface UpdateProjectCommand {
  code: string
  name: string
}

/** PATCH /projects-management/{id}/active */
export interface SetProjectActiveCommand {
  active: boolean
}
