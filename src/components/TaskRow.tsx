'use client'
import { Plant } from '@prisma/client'
import { format, addDays } from 'date-fns'
import { useRouter } from 'next/navigation'
import { submitCareEvent } from '@/lib/offlineQueue'

export default function TaskRow({ task }: { task: { kind: 'WATER' | 'FERTILIZE'; due: Date; plant: Plant } }) {
  const router = useRouter()

  async function done() {
    await submitCareEvent({ plantId: task.plant.id, type: task.kind })
    router.refresh()
  }

  async function snooze() {
    const daysStr = window.prompt('Snooze how many days?', '1')
    if (!daysStr) return
    const days = Number(daysStr)
    if (!Number.isFinite(days) || days <= 0) return
    const field = task.kind === 'WATER' ? 'lastWateredAt' : 'lastFertilizedAt'
    const base = (task.plant as any)[field] ?? task.plant.createdAt
    const newDate = addDays(new Date(base), days)
    await fetch(`/api/plants/${task.plant.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: newDate.toISOString() }),
    })
    router.refresh()
  }

  return (
    <li className="py-3 border-b border-slate-200 dark:border-slate-800 last:border-b-0">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="font-medium">{task.plant.name}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {task.kind === 'WATER' ? 'Water' : 'Fertilize'} due {format(task.due, 'PPP')}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="btn bg-emerald-600 text-white" onClick={done}>
            Done
          </button>
          <button className="btn bg-slate-700 text-white" onClick={snooze}>
            Snooze
          </button>
        </div>
      </div>
    </li>
  )
}
