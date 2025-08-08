'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import Calendar from './Calendar'
import TaskRow from './TaskRow'
import type { Task } from '@/lib/tasks'

interface Props {
  groups: Record<string, Task[]>
}

export default function TaskCalendar({ groups }: Props) {
  const [selected, setSelected] = useState<Date | null>(null)
  const key = selected ? format(selected, 'yyyy-MM-dd') : null
  const tasks = key ? groups[key] ?? [] : []

  return (
    <div>
      <Calendar events={groups} onSelectDate={setSelected} />
      {selected && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">
            Tasks on {format(selected, 'PPP')}
          </h4>
          {tasks.length === 0 ? (
            <p>No tasks.</p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {tasks.map((t) => (
                <TaskRow key={`${t.kind}-${t.plant.id}`} task={t} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

