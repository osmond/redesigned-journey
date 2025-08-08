import { addDays, isBefore, startOfDay, isAfter } from 'date-fns'
import type { Plant } from '@prisma/client'

export function nextWaterDate(p: Plant): Date {
  const base = p.lastWateredAt ?? p.createdAt
  return addDays(base, p.wateringIntervalDays)
}
export function nextFertilizeDate(p: Plant): Date {
  const base = p.lastFertilizedAt ?? p.createdAt
  return addDays(base, p.fertilizingIntervalDays)
}
export function isDueOrOverdue(d: Date): boolean {
  const today = startOfDay(new Date())
  return isBefore(d, today) || startOfDay(d).getTime() === today.getTime()
}
export function isWithinNextDays(d: Date, days: number): boolean {
  const today = startOfDay(new Date())
  const end = addDays(today, days + 1) // inclusive of the last day
  return isAfter(d, today) && isBefore(d, end)
}
