import { prisma } from '@/lib/db'
import RoomForm from '@/components/RoomForm'
export const dynamic = 'force-dynamic'
export default async function RoomsPage() {
  const rooms = await prisma.room.findMany({ include: { plants: true }, orderBy: { createdAt: 'desc' } })
  return (
    <div className="space-y-6">
      <section className="card"><h2 className="text-lg font-semibold mb-4">Add a room</h2><RoomForm /></section>
      <section className="card">
        <h2 className="text-lg font-semibold mb-3">Rooms</h2>
        <ul className="grid sm:grid-cols-2 gap-4">
          {rooms.map(r => (
            <li key={r.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-3">
              <div className="font-medium">{r.name}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">{r.plants.length} plants</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
