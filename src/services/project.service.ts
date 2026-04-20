import { apiFetch, parseJsonResponse } from '@/utils/http'
import type { ProjectManagementSidebarDto } from '@/types/project'

export async function listProjectsManagement(params?: {
  name?: string
  status?: string
}): Promise<ProjectManagementSidebarDto[]> {
  const sp = new URLSearchParams()
  if (params?.name) sp.set('name', params.name)
  if (params?.status) sp.set('status', params.status)
  const q = sp.toString()
  const res = await apiFetch(`/projects-management${q ? `?${q}` : ''}`)
  const json = await parseJsonResponse<ProjectManagementSidebarDto[]>(res)
  return json.data
}

export async function deleteProject(id: string): Promise<void> {
  const res = await apiFetch(`/projects-management/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  await parseJsonResponse<unknown>(res)
}
