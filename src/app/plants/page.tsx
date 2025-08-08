import { prisma } from '@/lib/db';
import PlantForm from '@/components/PlantForm';
import PlantCard from '@/components/PlantCard';
import { LightLevel } from '@prisma/client';
import { addDays, isBefore } from 'date-fns';

export const dynamic = 'force-dynamic';
export default async function PlantsPage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    room?: string;
    light?: string;
    overdue?: string;
  };
}) {
  const rooms = await prisma.room.findMany({ orderBy: { name: 'asc' } });
  const { q, room, light, overdue } = searchParams;
  const where: any = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { commonName: { contains: q, mode: 'insensitive' } },
      { species: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (room) where.roomId = room;
  if (light) where.lightLevel = light;
  const plantsAll = await prisma.plant.findMany({
    where,
    include: { photos: true, room: true },
    orderBy: { createdAt: 'desc' },
  });
  let plants = plantsAll;
  if (overdue === '1') {
    const now = new Date();
    plants = plantsAll.filter((p) => {
      const waterDue = p.lastWateredAt
        ? addDays(p.lastWateredAt, p.wateringIntervalDays)
        : null;
      const fertDue = p.lastFertilizedAt
        ? addDays(p.lastFertilizedAt, p.fertilizingIntervalDays)
        : null;
      return (
        (waterDue && isBefore(waterDue, now)) ||
        (fertDue && isBefore(fertDue, now))
      );
    });
  }
  return (
    <div className="space-y-6">
      <section className="card">
        <h2 className="text-lg font-semibold mb-4">Add a plant</h2>
        <PlantForm />
      </section>
      <section className="card">
        <h2 className="text-lg font-semibold mb-3">My plants</h2>
        <form method="get" className="mb-4 grid gap-2 sm:grid-cols-2 md:grid-cols-4 text-sm">
          <input
            name="q"
            defaultValue={q ?? ''}
            placeholder="Search"
            aria-label="Search plants"
            className="border border-slate-700 rounded px-2 py-1 bg-slate-800"
          />
          <select
            name="room"
            defaultValue={room ?? ''}
            aria-label="Filter by room"
            className="border border-slate-700 rounded px-2 py-1 bg-slate-800"
          >
            <option value="">All rooms</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <select
            name="light"
            defaultValue={light ?? ''}
            aria-label="Filter by light level"
            className="border border-slate-700 rounded px-2 py-1 bg-slate-800"
          >
            <option value="">All light</option>
            {Object.values(LightLevel).map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              name="overdue"
              value="1"
              defaultChecked={overdue === '1'}
              aria-label="Overdue care"
            />
            Overdue care
          </label>
          <div className="sm:col-span-2 md:col-span-1 flex items-center justify-end">
            <button
              className="rounded bg-slate-700 text-white px-3 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              type="submit"
            >
              Apply
            </button>
          </div>
        </form>
        <ul className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {plants.map((p) => (
            <PlantCard key={p.id} plant={p} />
          ))}
        </ul>
      </section>
    </div>
  );
}
