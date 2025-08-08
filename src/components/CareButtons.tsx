'use client'

import { useRouter } from 'next/navigation'

export default function CareButtons({ plantId }: { plantId: string }) {
  const router = useRouter()

  async function log(type: 'WATER' | 'FERTILIZE' | 'PRUNE' | 'REPOT' | 'NOTE') {
    let note: string | undefined
    if (type === 'NOTE') {
      const n = window.prompt('Add note')
      if (!n) return
      note = n
    }
    await fetch('/api/care-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plantId, type, note }),
    })
    router.refresh()
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button className="btn bg-emerald-600 text-white" onClick={() => log('WATER')}>Water</button>
      <button className="btn bg-amber-600 text-white" onClick={() => log('FERTILIZE')}>Fertilize</button>
      <button className="btn bg-slate-700 text-white" onClick={() => log('PRUNE')}>Prune</button>
      <button className="btn bg-slate-700 text-white" onClick={() => log('REPOT')}>Repot</button>
      <button className="btn bg-slate-700 text-white" onClick={() => log('NOTE')}>Note</button>
    </div>
  )
}
