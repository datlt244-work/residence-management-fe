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
