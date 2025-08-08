'use client'

import { useState } from 'react'
import {
  addDays,
  addMonths,
  subDays,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  format,
  isSameMonth,
} from 'date-fns'

interface CalendarProps {
  /** Record keyed by yyyy-MM-dd */
  events?: Record<string, unknown[]>
  onSelectDate?: (date: Date) => void
}

export default function Calendar({ events = {}, onSelectDate }: CalendarProps) {
  const [current, setCurrent] = useState(new Date())
  const [view, setView] = useState<'month' | 'week'>('month')

  const start =
    view === 'month'
      ? startOfWeek(startOfMonth(current))
      : startOfWeek(current)
  const end =
    view === 'month'
      ? endOfWeek(endOfMonth(current))
      : endOfWeek(current)

  const days: Date[] = []
  let day = start
  while (day <= end) {
    days.push(day)
    day = addDays(day, 1)
  }

  function prev() {
    setCurrent(view === 'month' ? subMonths(current, 1) : subDays(current, 7))
  }
  function next() {
    setCurrent(view === 'month' ? addMonths(current, 1) : addDays(current, 7))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button className="btn btn-xs" onClick={prev}>
          Prev
        </button>
        <div className="font-semibold">
          {format(current, view === 'month' ? 'MMMM yyyy' : 'PPP')}
        </div>
        <button className="btn btn-xs" onClick={next}>
          Next
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-xs font-semibold mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 text-sm">
        {days.map((d) => {
          const key = format(d, 'yyyy-MM-dd')
          const hasEvents = Boolean((events[key] || []).length)
          return (
            <button
              key={d.toISOString()}
              className={`h-16 border p-1 text-left ${
                view === 'month' && !isSameMonth(d, current)
                  ? 'text-slate-400'
                  : ''
              }`}
              onClick={() => onSelectDate?.(d)}
            >
              <div className="text-xs">{format(d, 'd')}</div>
              {hasEvents && (
                <div className="w-1 h-1 rounded-full bg-emerald-500 mt-1 mx-auto"></div>
              )}
            </button>
          )
        })}
      </div>
      <div className="mt-2 text-right">
        <button
          className="btn btn-xs"
          onClick={() => setView(view === 'month' ? 'week' : 'month')}
        >
          {view === 'month' ? 'Week view' : 'Month view'}
        </button>
      </div>
    </div>
  )
}

