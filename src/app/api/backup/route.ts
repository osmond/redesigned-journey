import { prisma } from '@/lib/db'

const userId = 'seed-user'

export async function GET() {
  const [rooms, plants, photos, careEvents, species] = await Promise.all([
    prisma.room.findMany({ where: { userId } }),
    prisma.plant.findMany({ where: { userId } }),
    prisma.photo.findMany({ where: { userId } }),
    prisma.careEvent.findMany({ where: { userId } }),
    prisma.species.findMany(),
  ])

  const data = { rooms, plants, photos, careEvents, species }

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="backup.json"',
    },
  })
}

export async function POST(req: Request) {
  const data = await req.json()

  await prisma.$transaction([
    prisma.careEvent.deleteMany({ where: { userId } }),
    prisma.photo.deleteMany({ where: { userId } }),
    prisma.plant.deleteMany({ where: { userId } }),
    prisma.room.deleteMany({ where: { userId } }),
    prisma.species.deleteMany(),
  ])

  if (data.species?.length) await prisma.species.createMany({ data: data.species })
  if (data.rooms?.length) await prisma.room.createMany({ data: data.rooms.map((r: any) => ({ ...r, userId })) })
  if (data.plants?.length) await prisma.plant.createMany({ data: data.plants.map((p: any) => ({ ...p, userId })) })
  if (data.photos?.length) await prisma.photo.createMany({ data: data.photos.map((p: any) => ({ ...p, userId })) })
  if (data.careEvents?.length)
    await prisma.careEvent.createMany({ data: data.careEvents.map((e: any) => ({ ...e, userId })) })

  return Response.json({ ok: true })
}
