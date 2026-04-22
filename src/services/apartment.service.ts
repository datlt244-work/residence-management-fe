import { apiFetch, parseJsonResponse } from '@/utils/http'
import type {
  ApartmentAdminDto,
  ApartmentListItemDto,
  ApartmentMediaItemDto,
  ApartmentOwnerInfoDto,
  BulkDeleteApartmentsCommand,
  BulkDeleteApartmentsResultDto,
  MoveApartmentsRequest,
  MoveApartmentsResultDto,
  PageResultApartmentListItemDto,
  UpdateApartmentCommand,
  UpdateApartmentStatusCommand,
  UploadApartmentMediaParams,
} from '@/types/apartment'

export interface ListApartmentsParams {
  page?: number
  size?: number
  projectId?: string
  zoneId?: string
  apartmentTypeId?: string
  search?: string
}

export async function listApartments(
  params: ListApartmentsParams = {},
): Promise<PageResultApartmentListItemDto> {
  const sp = new URLSearchParams()
  if (params.page != null) sp.set('page', String(params.page))
  if (params.size != null) sp.set('size', String(params.size))
  if (params.projectId) sp.set('projectId', params.projectId)
  if (params.zoneId) sp.set('zoneId', params.zoneId)
  if (params.apartmentTypeId) sp.set('apartmentTypeId', params.apartmentTypeId)
  if (params.search) sp.set('search', params.search)
  const res = await apiFetch(`/apartments?${sp.toString()}`)
  const json = await parseJsonResponse<PageResultApartmentListItemDto>(res)
  return json.data
}

export async function getApartmentDetail(id: string): Promise<ApartmentAdminDto> {
  const res = await apiFetch(`/apartments/${encodeURIComponent(id)}`)
  const json = await parseJsonResponse<ApartmentAdminDto>(res)
  return json.data
}

export async function listApartmentMedia(id: string): Promise<ApartmentMediaItemDto[]> {
  const res = await apiFetch(`/apartments/${encodeURIComponent(id)}/media`)
  const json = await parseJsonResponse<ApartmentMediaItemDto[]>(res)
  const list = Array.isArray(json.data) ? json.data : []
  return [...list].sort((a, b) => {
    if (a.primary && !b.primary) return -1
    if (!a.primary && b.primary) return 1
    return (a.order ?? 0) - (b.order ?? 0)
  })
}

export async function uploadApartmentMedia(
  id: string,
  params: UploadApartmentMediaParams,
): Promise<ApartmentMediaItemDto> {
  const fd = new FormData()
  fd.append('file', params.file)
  if (params.mediaType) {
    fd.append('mediaType', params.mediaType)
  }
  if (params.primary === true) {
    fd.append('primary', 'true')
  }
  if (params.displayOrder != null) {
    fd.append('displayOrder', String(params.displayOrder))
  }
  const res = await apiFetch(`/apartments/${encodeURIComponent(id)}/media`, {
    method: 'POST',
    body: fd,
  })
  const json = await parseJsonResponse<ApartmentMediaItemDto>(res)
  return json.data
}

/** DELETE /api/media/{mediaId} — OpenAPI `deleteApartmentMedia`; ADMIN/MANAGER (theo backend). */
export async function deleteApartmentMedia(mediaId: string): Promise<void> {
  const res = await apiFetch(`/media/${encodeURIComponent(mediaId)}`, { method: 'DELETE' })
  await parseJsonResponse<void>(res)
}

/** PATCH /api/media/{mediaId}/primary — OpenAPI `setApartmentMediaPrimary`; ADMIN/MANAGER (theo backend). */
export async function setApartmentMediaPrimary(mediaId: string): Promise<ApartmentMediaItemDto> {
  const res = await apiFetch(`/media/${encodeURIComponent(mediaId)}/primary`, { method: 'PATCH' })
  const json = await parseJsonResponse<ApartmentMediaItemDto>(res)
  return json.data
}

export async function updateApartment(id: string, body: UpdateApartmentCommand): Promise<ApartmentAdminDto> {
  const res = await apiFetch(`/apartments/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  const json = await parseJsonResponse<ApartmentAdminDto>(res)
  return json.data
}

export async function getApartmentOwnerInfo(id: string): Promise<ApartmentOwnerInfoDto> {
  const res = await apiFetch(`/apartments/${encodeURIComponent(id)}/owner-info`)
  const json = await parseJsonResponse<ApartmentOwnerInfoDto>(res)
  return json.data
}

export async function patchApartmentStatus(
  id: string,
  body: UpdateApartmentStatusCommand,
): Promise<ApartmentListItemDto> {
  const res = await apiFetch(`/apartments/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  const json = await parseJsonResponse<ApartmentListItemDto>(res)
  return json.data
}

export async function moveApartments(body: MoveApartmentsRequest): Promise<MoveApartmentsResultDto> {
  const res = await apiFetch('/apartments/move', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  const json = await parseJsonResponse<MoveApartmentsResultDto>(res)
  return json.data
}

export async function bulkDeleteApartments(
  body: BulkDeleteApartmentsCommand,
): Promise<BulkDeleteApartmentsResultDto> {
  const res = await apiFetch('/apartments/bulk-delete', {
    method: 'DELETE',
    body: JSON.stringify(body),
  })
  const json = await parseJsonResponse<BulkDeleteApartmentsResultDto>(res)
  return json.data
}
