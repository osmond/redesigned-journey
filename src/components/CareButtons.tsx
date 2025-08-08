'use client'

import { useRouter } from 'next/navigation'
import type { CareType } from '@prisma/client'

type BtnDef = { type: CareType; label: string; className: string }

const btns: BtnDef[] = [
  { type: 'WATER', label: 'Water', className: 'bg-emerald-600' },
  { type: 'FERTILIZE', label: 'Fertilize', className: 'bg-amber-600' },
  { type: 'PRUNE', label: 'Prune', className: 'bg-slate-700' },
  { type: 'REPOT', label: 'Repot', className: 'bg-slate-700' },
  { type: 'NOTE', label: 'Note', className: 'bg-slate-700' },
]

export default function CareButtons({ plantId }: { plantId: string }) {
  const router = useRouter()

  async function log(type: CareType) {
    let note: string | undefined
    if (type === 'NOTE') {
      const n = window.prompt('Add note')
      if (!n) return
      note = n
    }
    let userName = localStorage.getItem('userName') || undefined
    if (!userName) {
      const u = window.prompt('Your name?')
      if (!u) return
      userName = u
      localStorage.setItem('userName', userName)
    }
    await fetch('/api/care-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plantId, type, note, userName }),
    })
    router.refresh()
  }

  return (
    <div className="flex flex-wrap gap-2">
      {btns.map(({ type, label, className }) => (
        <button
          key={type}
          className={`btn ${className} text-white`}
          onClick={() => log(type)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
