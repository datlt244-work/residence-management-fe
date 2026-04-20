import { apiFetch, parseJsonResponse } from '@/utils/http'
import type { ZoneSidebarDto } from '@/types/project'
import type { CreateZoneCommand, UpdateZoneCommand } from '@/types/zone'

function normalizeZone(z: ZoneSidebarDto): ZoneSidebarDto {
  return {
    ...z,
    apartmentTypes: z.apartmentTypes ?? [],
  }
}

export async function createZone(body: CreateZoneCommand): Promise<ZoneSidebarDto> {
  const res = await apiFetch('/zones-management', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  const json = await parseJsonResponse<ZoneSidebarDto>(res)
  return normalizeZone(json.data)
}

export async function updateZone(id: string, body: UpdateZoneCommand): Promise<ZoneSidebarDto> {
  const res = await apiFetch(`/zones-management/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  const json = await parseJsonResponse<ZoneSidebarDto>(res)
  return normalizeZone(json.data)
}

export async function deleteZone(id: string): Promise<void> {
  const res = await apiFetch(`/zones-management/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  await parseJsonResponse<unknown>(res)
}
