import { apiFetch, parseJsonResponse } from '@/utils/http'
import type {
  CreateDepartmentCommand,
  DepartmentListItemDto,
  PageResultDepartmentListItemDto,
  UpdateDepartmentAdminCommand,
} from '@/types/department'

export interface ListDepartmentsParams {
  page?: number
  size?: number
  /** Partial match on code (case-insensitive) */
  code?: string
  /** Partial match on name (case-insensitive) */
  name?: string
  /** ISO-8601 date (inclusive) */
  createdFrom?: string
  createdTo?: string
}

export async function listDepartments(
  params: ListDepartmentsParams = {},
): Promise<PageResultDepartmentListItemDto> {
  const sp = new URLSearchParams()
  if (params.page != null) sp.set('page', String(params.page))
  if (params.size != null) sp.set('size', String(params.size))
  if (params.code) sp.set('code', params.code)
  if (params.name) sp.set('name', params.name)
  if (params.createdFrom) sp.set('createdFrom', params.createdFrom)
  if (params.createdTo) sp.set('createdTo', params.createdTo)
  const res = await apiFetch(`/departments-management?${sp.toString()}`)
  const json = await parseJsonResponse<PageResultDepartmentListItemDto>(res)
  return json.data
}

export async function getDepartment(id: string): Promise<DepartmentListItemDto> {
  const res = await apiFetch(`/departments-management/${encodeURIComponent(id)}`)
  const json = await parseJsonResponse<DepartmentListItemDto>(res)
  return json.data
}

export async function createDepartment(body: CreateDepartmentCommand): Promise<DepartmentListItemDto> {
  const res = await apiFetch('/departments-management', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  const json = await parseJsonResponse<DepartmentListItemDto>(res)
  return json.data
}

export async function updateDepartment(
  id: string,
  body: UpdateDepartmentAdminCommand,
): Promise<DepartmentListItemDto> {
  const res = await apiFetch(`/departments-management/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  const json = await parseJsonResponse<DepartmentListItemDto>(res)
  return json.data
}

export async function deleteDepartment(id: string): Promise<void> {
  const res = await apiFetch(`/departments-management/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  await parseJsonResponse<unknown>(res)
}
