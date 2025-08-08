import { prisma } from '@/lib/db'
import RoomForm from '@/components/RoomForm'
import RoomsList from '@/components/RoomsList'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export default async function RoomsPage() {
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

  const rooms = await prisma.room.findMany({
    where: { userId },
    include: { plants: { where: { userId } } },
    orderBy: { sortOrder: 'asc' },
  })
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
