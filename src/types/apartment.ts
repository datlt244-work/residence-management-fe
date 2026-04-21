export interface ApartmentListItemDto {
  id: string
  projectId?: string
  projectCode?: string
  projectName?: string
  zoneId?: string
  zoneCode?: string
  zoneName?: string
  apartmentTypeId?: string
  apartmentTypeCode?: string
  apartmentTypeName?: string
  code?: string
  area?: number
  price?: number
  taxFee?: number
  furnitureStatus?: string
  legalStatus?: string
  balconyDirection?: string
  status?: string
  createdAt?: string
  updatedAt?: string
}

export interface PageResultApartmentListItemDto {
  content: ApartmentListItemDto[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
}

/** GET /apartments/{id} — chi tiết form. STAFF: ownerPhone, ownerContact, source có thể null (ẩn). */
export interface ApartmentAdminDto extends ApartmentListItemDto {
  ownerPhone?: string | null
  ownerContact?: string | null
  source?: string | null
}

/** GET /apartments/{id}/owner-info — chỉ SĐT chủ & nguồn; ADMIN/MANAGER. */
export interface ApartmentOwnerInfoDto {
  ownerPhone?: string | null
  source?: string | null
}
