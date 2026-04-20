import { apiFetch, parseJsonResponse } from '@/utils/http'
import type {
  CreateProjectCommand,
  ProjectManagementSidebarDto,
  SetProjectActiveCommand,
  UpdateProjectCommand,
} from '@/types/project'

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

export async function createProject(body: CreateProjectCommand): Promise<ProjectManagementSidebarDto> {
  const res = await apiFetch('/projects-management', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  const json = await parseJsonResponse<ProjectManagementSidebarDto>(res)
  return json.data
}

export async function updateProject(
  id: string,
  body: UpdateProjectCommand,
): Promise<ProjectManagementSidebarDto> {
  const res = await apiFetch(`/projects-management/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  const json = await parseJsonResponse<ProjectManagementSidebarDto>(res)
  return json.data
}

export async function setProjectActive(id: string, active: boolean): Promise<ProjectManagementSidebarDto> {
  const cmd: SetProjectActiveCommand = { active }
  const res = await apiFetch(`/projects-management/${encodeURIComponent(id)}/active`, {
    method: 'PATCH',
    body: JSON.stringify(cmd),
  })
  const json = await parseJsonResponse<ProjectManagementSidebarDto>(res)
  return json.data
}

export async function deleteProject(id: string): Promise<void> {
  const res = await apiFetch(`/projects-management/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  await parseJsonResponse<unknown>(res)
}
