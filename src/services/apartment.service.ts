import { apiFetch, parseJsonResponse } from '@/utils/http'
import type { ApartmentAdminDto, PageResultApartmentListItemDto } from '@/types/apartment'

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
