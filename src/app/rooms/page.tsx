import { prisma } from '@/lib/db'
import RoomForm from '@/components/RoomForm'
import RoomsList from '@/components/RoomsList'
export const dynamic = 'force-dynamic'
export default async function RoomsPage() {
  const rooms = await prisma.room.findMany({ include: { plants: true }, orderBy: { sortOrder: 'asc' } })
  return (
    <div className="space-y-6">
      <section className="card"><h2 className="text-lg font-semibold mb-4">Add a room</h2><RoomForm /></section>
      <section className="card">
        <h2 className="text-lg font-semibold mb-3">Rooms</h2>
        <RoomsList rooms={rooms} />
      </section>
    </div>
  )
}
