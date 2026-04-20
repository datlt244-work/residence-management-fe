import { apiFetch, parseJsonResponse } from '@/utils/http'
import type {
  ChangePasswordRequest,
  EmployeeAdminDetailDto,
  EmployeeDto,
  PageResultAdminEmployeeDto,
  SetEmployeeActiveCommand,
  UpdateEmployeeAdminCommand,
  UpdateEmployeeProfileRequest,
} from '@/types/employee'

export async function getCurrentEmployee(): Promise<EmployeeDto> {
  const res = await apiFetch('/employees/me')
  const json = await parseJsonResponse<EmployeeDto>(res)
  return json.data
}

export async function updateMyProfile(body: UpdateEmployeeProfileRequest): Promise<EmployeeDto> {
  const res = await apiFetch('/employees/me/profile', {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  const json = await parseJsonResponse<EmployeeDto>(res)
  return json.data
}

export async function changeMyPassword(body: ChangePasswordRequest): Promise<void> {
  const res = await apiFetch('/employees/me/password', {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  await parseJsonResponse<unknown>(res)
}

export interface ListEmployeesAdminParams {
  page?: number
  size?: number
  search?: string
  role?: string
  active?: boolean
}

export async function listEmployeesAdmin(
  params: ListEmployeesAdminParams = {},
): Promise<PageResultAdminEmployeeDto> {
  const sp = new URLSearchParams()
  if (params.page != null) sp.set('page', String(params.page))
  if (params.size != null) sp.set('size', String(params.size))
  if (params.search) sp.set('search', params.search)
  if (params.role) sp.set('role', params.role)
  if (params.active !== undefined) sp.set('active', String(params.active))
  const res = await apiFetch(`/employees-management?${sp.toString()}`)
  const json = await parseJsonResponse<PageResultAdminEmployeeDto>(res)
  return json.data
}

export async function getEmployeeAdmin(id: string): Promise<EmployeeAdminDetailDto> {
  const res = await apiFetch(`/employees-management/${encodeURIComponent(id)}`)
  const json = await parseJsonResponse<EmployeeAdminDetailDto>(res)
  return json.data
}

export async function updateEmployeeAdmin(
  id: string,
  body: UpdateEmployeeAdminCommand,
): Promise<EmployeeDto> {
  const res = await apiFetch(`/employees-management/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  const json = await parseJsonResponse<EmployeeDto>(res)
  return json.data
}

export async function deleteEmployeeAdmin(id: string): Promise<void> {
  const res = await apiFetch(`/employees-management/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  await parseJsonResponse<unknown>(res)
}

/** PATCH /employees-management/{id}/active */
export async function setEmployeeActive(id: string, active: boolean): Promise<EmployeeDto> {
  const body: SetEmployeeActiveCommand = { active }
  const res = await apiFetch(`/employees-management/${encodeURIComponent(id)}/active`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  const json = await parseJsonResponse<EmployeeDto>(res)
  return json.data
}
