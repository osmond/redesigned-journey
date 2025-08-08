'use client'

import { useState } from 'react'
import type { CareType } from '@prisma/client'
import { format } from 'date-fns'

const careTypes: CareType[] = ['WATER', 'FERTILIZE', 'PRUNE', 'REPOT', 'NOTE']

type Event = {
  id: string
  type: CareType
  note: string | null
  createdAt: string
}

export default function CareTimeline({ events }: { events: Event[] }) {
  const [filter, setFilter] = useState<CareType | 'ALL'>('ALL')
  const filtered = filter === 'ALL' ? events : events.filter((e) => e.type === filter)

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          className={`btn btn-sm ${filter === 'ALL' ? 'btn-primary' : ''}`}
          onClick={() => setFilter('ALL')}
        >
          All
        </button>
        {careTypes.map((t) => (
          <button
            key={t}
            className={`btn btn-sm ${filter === t ? 'btn-primary' : ''}`}
            onClick={() => setFilter(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p>No care events yet.</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((ev) => (
            <li
              key={ev.id}
              className="border-b border-slate-800 pb-2 last:border-b-0 last:pb-0"
            >
              <div className="flex justify-between text-sm">
                <span className="font-medium">{ev.type}</span>
                <span>{format(new Date(ev.createdAt), 'PPP')}</span>
              </div>
              {ev.note && <div className="text-xs text-slate-400">{ev.note}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
