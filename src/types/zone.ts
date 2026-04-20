/** POST /zones-management */
export interface CreateZoneCommand {
  projectId: string
  code: string
  name: string
  displayOrder?: number
}

/** PUT /zones-management/{id} — mã phân khu không đổi sau khi tạo. */
export interface UpdateZoneCommand {
  name: string
  displayOrder?: number
}
