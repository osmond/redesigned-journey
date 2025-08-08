import { format } from 'date-fns'
import type { Plant } from '@prisma/client'
import { nextWaterDate, nextFertilizeDate, isDueOrOverdue, isWithinNextDays } from './schedule'

export type Task = { kind: 'WATER' | 'FERTILIZE'; due: Date; plant: Plant }

export function computeTaskLists(plants: Plant[]) {
  const allTasks: Task[] = plants.flatMap((p) => [
    { kind: 'WATER' as const, due: nextWaterDate(p), plant: p },
    { kind: 'FERTILIZE' as const, due: nextFertilizeDate(p), plant: p },
  ])

  const today = allTasks.filter((t) => isDueOrOverdue(t.due))

  const next = allTasks
    .filter((t) => isWithinNextDays(t.due, 7))
    .sort((a, b) => a.due.getTime() - b.due.getTime())

  const grouped = next.reduce<Record<string, Task[]>>((acc, t) => {
    const key = format(t.due, 'yyyy-MM-dd')
    ;(acc[key] ??= []).push(t)
    return acc
  }, {})

  const groupKeys = Object.keys(grouped).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  )

  return { today, grouped, groupKeys }
}
