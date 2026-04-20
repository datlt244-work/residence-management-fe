import { apiFetch, parseJsonResponse } from '@/utils/http'
import type { EmployeeDto } from '@/types/employee'

export async function getCurrentEmployee(): Promise<EmployeeDto> {
  const res = await apiFetch('/employees/me')
  const json = await parseJsonResponse<EmployeeDto>(res)
  return json.data
}
