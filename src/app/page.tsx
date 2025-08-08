import { prisma } from '@/lib/db'
import {
  nextWaterDate,
  nextFertilizeDate,
  isDueOrOverdue,
  isWithinNextDays,
} from '@/lib/schedule'
import SwipeTaskRow from '@/components/SwipeTaskRow'
import { format } from 'date-fns'
import type { Plant } from '@prisma/client'

export const dynamic = 'force-dynamic'

type Task = {
  kind: 'WATER' | 'FERTILIZE'
  due: Date
  plant: Plant
}

export default async function Page() {
  const plants = await prisma.plant.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const allTasks: Task[] = plants.flatMap((p) => [
    { kind: 'WATER' as const, due: nextWaterDate(p), plant: p },
    { kind: 'FERTILIZE' as const, due: nextFertilizeDate(p), plant: p },
  ])

  const due = allTasks.filter((t) => isDueOrOverdue(t.due))

  const upcoming = allTasks
    .filter((t) => isWithinNextDays(t.due, 7))
    .sort((a, b) => a.due.getTime() - b.due.getTime())

  // group upcoming by yyyy-MM-dd
  const groups = upcoming.reduce<Record<string, Task[]>>((acc, t) => {
    const key = format(t.due, 'yyyy-MM-dd')
    ;(acc[key] ??= []).push(t)
    return acc
  }, {})

  const groupKeys = Object.keys(groups).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  )

  return (
    <div className="space-y-6">
      <section className="card">
        <h2 className="text-lg font-semibold mb-3">Due today & overdue</h2>
        {due.length === 0 ? (
          <p>Nothing due today. Your plants are happy 🌞</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {due.map((t) => (
              <SwipeTaskRow key={`${t.kind}-${t.plant.id}`} task={t} />
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold mb-3">Upcoming (next 7 days)</h2>
        {upcoming.length === 0 ? (
          <p>No upcoming tasks in the next week.</p>
        ) : (
          <div className="space-y-4">
            {groupKeys.map((k) => (
              <div key={k} className="space-y-2">
                <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {format(new Date(k), 'EEE, MMM d')}
                </div>
                <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                  {groups[k].map((t) => (
                    <SwipeTaskRow
                      key={`${k}-${t.kind}-${t.plant.id}`}
                      task={t}
                      readOnly
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
