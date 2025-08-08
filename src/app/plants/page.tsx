import { prisma } from '@/lib/db'
import PlantForm from '@/components/PlantForm'
import PlantCard from '@/components/PlantCard'
import { nextWaterDate, nextFertilizeDate, isDueOrOverdue } from '@/lib/schedule'
import type { LightLevel } from '@prisma/client'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function PlantsPage({ searchParams }: { searchParams: { q?: string; room?: string; light?: string; overdue?: string } }) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
      },
    }
  )
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  const userId = session.user.id

  const { q, room, light, overdue } = searchParams

  const where: any = { userId }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { commonName: { contains: q, mode: 'insensitive' } },
      { species: { contains: q, mode: 'insensitive' } },
    ]
  }

  if (room) where.roomId = room
  if (light) where.lightLevel = light as LightLevel

  const [plantsRaw, rooms] = await Promise.all([
    prisma.plant.findMany({ include: { photos: true, room: true }, where, orderBy: { createdAt: 'desc' } }),
    prisma.room.findMany({ where: { userId }, orderBy: { name: 'asc' } }),
  ])

  let plants = plantsRaw

  if (overdue === 'true') {
    plants = plants.filter((p) => {
      const nextWater = nextWaterDate(p)
      const nextFert = nextFertilizeDate(p)
      return isDueOrOverdue(nextWater) || isDueOrOverdue(nextFert)
    })
  }

  return (
    <div className="space-y-6">
      <section className="card"><h2 className="text-lg font-semibold mb-4">Add a plant</h2><PlantForm /></section>
      <section className="card">
        <h2 className="text-lg font-semibold mb-3">My plants</h2>
        <form className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="label">Search</label>
            <input
              type="search"
              name="q"
              className="input"
              placeholder="Search..."
              defaultValue={q || ''}
            />
          </div>
          <div>
            <label className="label">Room</label>
            <select name="room" className="input" defaultValue={room || ''}>
              <option value="">All</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Light</label>
            <select name="light" className="input" defaultValue={light || ''}>
              <option value="">All</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="BRIGHT_INDIRECT">Bright indirect</option>
              <option value="FULL_SUN">Full sun</option>
            </select>
          </div>
          <div className="flex items-center gap-1 pt-6">
            <input type="checkbox" name="overdue" value="true" defaultChecked={overdue === 'true'} />
            <label className="text-sm">Overdue care</label>
          </div>
          <div className="pt-6">
            <button type="submit" className="btn">Apply</button>
          </div>
        </form>
        <ul className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {plants.map((p) => (<PlantCard key={p.id} plant={p} />))}
        </ul>
      </section>
    </div>
  )
}
