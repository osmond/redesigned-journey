import { prisma } from '@/lib/db'
import Image from 'next/image'
import CareButtons from '@/components/CareButtons'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function PlantDetail({ params }: { params: { id: string } }) {
  const plant = await prisma.plant.findUnique({
    where: { id: params.id },
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
        <h3 className="text-lg font-semibold mb-3">History</h3>
        {plant.events.length === 0 ? (
          <p>No care events yet.</p>
        ) : (
          <ul className="space-y-2">
            {plant.events.map((ev) => (
              <li key={ev.id} className="border-b border-slate-800 pb-2 last:border-b-0 last:pb-0">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{ev.type}</span>
                  <span>{format(ev.createdAt, 'PPP')}</span>
                </div>
                {ev.note && <div className="text-xs text-slate-400">{ev.note}</div>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
