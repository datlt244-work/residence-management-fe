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
  note?: string | null
  media?: ApartmentMediaItemDto[]
}

/** GET /apartments/{id}/owner-info — chỉ SĐT chủ & nguồn; ADMIN/MANAGER. */
export interface ApartmentOwnerInfoDto {
  ownerPhone?: string | null
  source?: string | null
}

/** GET /apartments/{id}/media — url/thumbnailUrl có thể là presigned (MinIO/S3). */
export interface ApartmentMediaItemDto {
  id?: string
  url: string
  /** IMAGE | VIDEO | FILE … (backend). */
  type?: string
  order?: number
  primary?: boolean
  title?: string | null
  thumbnailUrl?: string | null
}

/** PATCH /apartments/{id}/status */
export interface UpdateApartmentStatusCommand {
  status: string
}

/** PUT /apartments/{id} — không đổi project / zone / loại căn (dùng POST /apartments/move). */
export interface UpdateApartmentCommand {
  code: string
  status: string
  area?: number | null
  price?: number | null
  taxFee?: number | null
  furnitureStatus?: string | null
  legalStatus?: string | null
  balconyDirection?: string | null
  note?: string | null
  ownerPhone?: string | null
  ownerContact?: string | null
  source?: string | null
}

/** POST /apartments/move */
export interface MoveApartmentsRequest {
  apartmentIds: string[]
  targetZoneId: string
  targetApartmentTypeId: string
}

export interface MoveApartmentsResultDto {
  movedCount?: number
}

/** DELETE /apartments/bulk-delete — soft delete, tối đa 500 id mỗi lần. */
export interface BulkDeleteApartmentsCommand {
  apartmentIds: string[]
}

export interface BulkDeleteApartmentsResultDto {
  deletedCount?: number
}
