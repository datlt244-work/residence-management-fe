/** Phân loại nhẹ theo tên loại căn (mẫu client, không đảm bảo đúng 100% domain). */
export type ApartmentBucket = 'condo' | 'shophouse' | 'villa' | 'other'

export function bucketApartmentTypeName(name: string | undefined): ApartmentBucket {
  if (!name) return 'other'
  const n = name.toLowerCase()
  if (/(shop|shophouse|commercial|kiot)/i.test(n)) return 'shophouse'
  if (/(villa|biệt|biệt thự)/i.test(n)) return 'villa'
  if (/(studio|br|pent|cc|căn|tower|tòa|chung|1pn|2pn|3pn|pn\+)/i.test(n)) return 'condo'
  return 'other'
}

export function aggregateBuckets(names: (string | undefined)[]): Record<ApartmentBucket, number> {
  const acc: Record<ApartmentBucket, number> = {
    condo: 0,
    shophouse: 0,
    villa: 0,
    other: 0,
  }
  for (const name of names) {
    acc[bucketApartmentTypeName(name)]++
  }
  return acc
}

export function toPercentages(counts: Record<ApartmentBucket, number>): Record<ApartmentBucket, number> {
  const total = counts.condo + counts.shophouse + counts.villa + counts.other
  if (total === 0) {
    return { condo: 0, shophouse: 0, villa: 0, other: 0 }
  }
  return {
    condo: Math.round((counts.condo / total) * 1000) / 10,
    shophouse: Math.round((counts.shophouse / total) * 1000) / 10,
    villa: Math.round((counts.villa / total) * 1000) / 10,
    other: Math.round((counts.other / total) * 1000) / 10,
  }
}
