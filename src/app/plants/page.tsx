import { prisma } from '@/lib/db'
import PlantForm from '@/components/PlantForm'
import PlantCard from '@/components/PlantCard'
import { getUserFromCookies } from '@/lib/auth'
export const dynamic = 'force-dynamic'
export default async function PlantsPage() {
  const user = await getUserFromCookies()
  if (!user) return <p className="card">Please sign in</p>
  const plants = await prisma.plant.findMany({
    include: { photos: true, room: true },
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })
  return (
    <div className="space-y-6">
      <section className="card"><h2 className="text-lg font-semibold mb-4">Add a plant</h2><PlantForm /></section>
      <section className="card"><h2 className="text-lg font-semibold mb-3">My plants</h2>
        <ul className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {plants.map((p) => (<PlantCard key={p.id} plant={p} />))}
        </ul>
      </section>
    </div>
  )
}
