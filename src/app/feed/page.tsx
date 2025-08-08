import { prisma } from '@/lib/db'
import { format } from 'date-fns'
import type { CareType } from '@prisma/client'

export const dynamic = 'force-dynamic'

const careTypes: CareType[] = ['WATER', 'FERTILIZE', 'PRUNE', 'REPOT', 'NOTE']

function actionWord(type: CareType) {
  switch (type) {
    case 'WATER':
      return 'watered'
    case 'FERTILIZE':
      return 'fertilized'
    case 'PRUNE':
      return 'pruned'
    case 'REPOT':
      return 'repotted'
    case 'NOTE':
      return 'noted'
  }
}

export default async function FeedPage({ searchParams }: { searchParams: { user?: string; plant?: string; type?: string } }) {
  const { user, plant, type } = searchParams
  const where: any = {}
  if (user) where.userName = user
  if (plant) where.plantId = plant
  if (type) where.type = type as CareType

  const [events, plants] = await Promise.all([
    prisma.careEvent.findMany({
      where,
      include: { plant: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.plant.findMany({ orderBy: { name: 'asc' } }),
  ])

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-3">Activity Feed</h2>
      <form className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">User</label>
          <input type="text" name="user" className="input" defaultValue={user || ''} />
        </div>
        <div>
          <label className="label">Plant</label>
          <select name="plant" className="input" defaultValue={plant || ''}>
            <option value="">All</option>
            {plants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Type</label>
          <select name="type" className="input" defaultValue={type || ''}>
            <option value="">All</option>
            {careTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="pt-6">
          <button type="submit" className="btn">
            Apply
          </button>
        </div>
      </form>
      {events.length === 0 ? (
        <p>No events logged.</p>
      ) : (
        <ul className="space-y-2">
          {events.map((ev) => (
            <li key={ev.id} className="border-b border-slate-800 pb-2 last:border-b-0 last:pb-0">
              <div className="text-sm">
                <span className="font-medium">{ev.userName || 'Someone'}</span>{' '}
                {actionWord(ev.type)}{' '}
                <span className="font-medium">{ev.plant.name}</span>
                {ev.amountMl ? ` (${ev.amountMl} ml)` : ''} at {format(ev.createdAt, 'PPP p')}
              </div>
              {ev.note && <div className="text-xs text-slate-400">{ev.note}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
