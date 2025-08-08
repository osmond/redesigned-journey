import { format, subDays, differenceInDays } from 'date-fns'
import { prisma } from './db'
import { nextWaterDate, nextFertilizeDate } from './schedule'

export async function getUsageTimeline(
  userId: string,
  from: Date,
  to: Date = new Date()
) {
  const events = await prisma.careEvent.findMany({
    where: {
      userId,
      type: { in: ['WATER', 'FERTILIZE'] },
      createdAt: { gte: from, lte: to },
    },
    select: { type: true, amountMl: true, createdAt: true },
  })
  const water: Record<string, number> = {}
  const fertilizer: Record<string, number> = {}
  for (const e of events) {
    const day = format(e.createdAt, 'yyyy-MM-dd')
    const amt = e.amountMl ?? 0
    if (e.type === 'WATER') water[day] = (water[day] ?? 0) + amt
    else if (e.type === 'FERTILIZE')
      fertilizer[day] = (fertilizer[day] ?? 0) + amt
  }
  return { water, fertilizer }
}

export async function getOverdueStats(userId: string) {
  const plants = await prisma.plant.findMany({ where: { userId } })
  const total = plants.length
  let overdueWater = 0
  let overdueFertilizer = 0
  const atRisk = new Set<string>()
  const now = new Date()
  for (const p of plants) {
    const nextW = nextWaterDate(p)
    if (nextW < now) {
      overdueWater++
      if (differenceInDays(now, nextW) > p.wateringIntervalDays)
        atRisk.add(p.id)
    }
    const nextF = nextFertilizeDate(p)
    if (nextF < now) {
      overdueFertilizer++
      if (differenceInDays(now, nextF) > p.fertilizingIntervalDays)
        atRisk.add(p.id)
    }
  }
  return {
    overdueWaterRate: total ? overdueWater / total : 0,
    overdueFertilizerRate: total ? overdueFertilizer / total : 0,
    plantsAtRisk: Array.from(atRisk),
  }
}
