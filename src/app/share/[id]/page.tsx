import Image from 'next/image';
import { prisma } from '@/lib/db';
import { createHash } from 'crypto';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
  searchParams: { password?: string };
}

export default async function SharePage({ params, searchParams }: PageProps) {
  const link = await prisma.shareLink.findUnique({
    where: { id: params.id },
    include: {
      plant: { include: { photos: true, events: true } },
      room: { include: { plants: { include: { photos: true, events: true } } } },
    },
  });

  if (!link) return <div className="p-4">Link not found</div>;

  if (link.passwordHash) {
    const hash = createHash('sha256').update(searchParams.password ?? '').digest('hex');
    if (hash !== link.passwordHash) {
      return <div className="p-4">Password required</div>;
    }
  }

  if (link.plant) {
    const plant = link.plant;
    return (
      <div className="space-y-4 p-4">
        <h1 className="text-2xl font-semibold">{plant.name}</h1>
        {plant.photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {plant.photos.map((p) => (
              <Image
                key={p.id}
                src={p.url}
                alt={plant.name}
                width={p.width ?? 800}
                height={p.height ?? 600}
                className="rounded"
              />
            ))}
          </div>
        )}
        <h2 className="font-semibold">Care history</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          {plant.events.map((e) => (
            <li key={e.id}>
              {e.type} on {new Date(e.createdAt).toLocaleDateString()}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (link.room) {
    const room = link.room;
    return (
      <div className="space-y-6 p-4">
        <h1 className="text-2xl font-semibold">{room.name}</h1>
        {room.plants.map((p) => (
          <div key={p.id} className="space-y-2">
            <h2 className="text-xl font-medium">{p.name}</h2>
            {p.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {p.photos.map((ph) => (
                  <Image
                    key={ph.id}
                    src={ph.url}
                    alt={p.name}
                    width={ph.width ?? 800}
                    height={ph.height ?? 600}
                    className="rounded"
                  />
                ))}
              </div>
            )}
            <h3 className="font-medium">Care history</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {p.events.map((e) => (
                <li key={e.id}>
                  {e.type} on {new Date(e.createdAt).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  return <div className="p-4">Nothing to share</div>;
}

