'use client'
import { format } from 'date-fns'
import type { Plant } from '@prisma/client'
import { useRef, useState } from 'react'

async function act(plantId: string, kind: 'WATER' | 'FERTILIZE') {
  await fetch('/api/care-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plantId, type: kind }),
  })
  // quick + dirty refresh
  location.reload()
}

export default function SwipeTaskRow({
  task,
  readOnly = false,
}: {
  task: { kind: 'WATER' | 'FERTILIZE'; due: Date; plant: Plant }
  readOnly?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [x, setX] = useState(0)
  const start = useRef<number | null>(null)

  const handlers = readOnly
    ? {}
    : {
        onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
          start.current = e.clientX
          ;(e.target as Element).setPointerCapture(e.pointerId)
        },
        onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
          if (start.current != null) setX(Math.min(0, e.clientX - start.current))
        },
        onPointerUp: () => {
          const threshold = -80
          if (x < threshold) setX(-120)
          else setX(0)
          start.current = null
        },
        onPointerCancel: () => {
          setX(0)
          start.current = null
        },
      }

  return (
    <li className="py-3">
      <div className="relative overflow-hidden">
        {!readOnly && (
          <div className="absolute inset-y-0 right-0 flex items-stretch gap-2 p-2">
            <button
              className="btn bg-emerald-600 text-white"
              onClick={() => act(task.plant.id, 'WATER')}
            >
              Watered
            </button>
            <button
              className="btn bg-amber-600 text-white"
              onClick={() => act(task.plant.id, 'FERTILIZE')}
            >
              Fertilized
            </button>
          </div>
        )}

        <div
          ref={ref}
          className="row bg-transparent will-change-transform"
          style={{ transform: `translateX(${readOnly ? 0 : x}px)` }}
          {...handlers}
        >
          <div className="flex-1">
            <div className="font-medium">{task.plant.name}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {task.kind === 'WATER' ? 'Water' : 'Fertilize'} due{' '}
              {format(task.due, 'PPP')}
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}
