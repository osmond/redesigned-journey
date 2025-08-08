import { prisma } from '@/lib/db'
import Image from 'next/image'
import CareButtons from '@/components/CareButtons'
import CareTimeline from '@/components/CareTimeline'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function PlantDetail({ params }: { params: { id: string } }) {
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

  const plant = await prisma.plant.findFirst({
    where: { id: params.id, userId },
    include: { photos: true, events: { orderBy: { createdAt: 'desc' } } },
  })
  if (!plant) return <div className="card">Plant not found</div>

  const cover =
    (plant.coverPhotoId && plant.photos.find((p) => p.id === plant.coverPhotoId)) ??
    plant.photos[0] ??
    null

  return (
    <div className="space-y-6">
      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">{plant.name}</h2>
        {cover && (
          <Image
            alt={plant.name}
            src={cover.url}
            width={cover.width ?? 800}
            height={cover.height ?? 600}
            className="w-full h-auto rounded"
          />
        )}
        <CareButtons plantId={plant.id} />
      </section>

      <section className="card">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">History</h3>
          <a
            href={`/api/plants/${plant.id}/events.csv`}
            className="btn btn-sm"
          >
            Export CSV
          </a>
        </div>
        <CareTimeline
          events={plant.events.map((ev) => ({
            id: ev.id,
            type: ev.type,
            note: ev.note,
            createdAt: ev.createdAt.toISOString(),
          }))}
        />
      </section>
    </div>
  )
}
