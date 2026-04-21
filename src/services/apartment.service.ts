import { apiFetch, parseJsonResponse } from '@/utils/http'
import type {
  ApartmentAdminDto,
  ApartmentListItemDto,
  ApartmentOwnerInfoDto,
  MoveApartmentsRequest,
  MoveApartmentsResultDto,
  PageResultApartmentListItemDto,
  UpdateApartmentCommand,
  UpdateApartmentStatusCommand,
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
