import { prisma } from '@/lib/db'

export async function GET() {
  const [rooms, plants, photos, careEvents, species] = await Promise.all([
    prisma.room.findMany(),
    prisma.plant.findMany(),
    prisma.photo.findMany(),
    prisma.careEvent.findMany(),
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
    prisma.careEvent.deleteMany(),
    prisma.photo.deleteMany(),
    prisma.plant.deleteMany(),
    prisma.room.deleteMany(),
    prisma.species.deleteMany(),
  ])

  if (data.species?.length) await prisma.species.createMany({ data: data.species })
  if (data.rooms?.length) await prisma.room.createMany({ data: data.rooms })
  if (data.plants?.length) await prisma.plant.createMany({ data: data.plants })
  if (data.photos?.length) await prisma.photo.createMany({ data: data.photos })
  if (data.careEvents?.length)
    await prisma.careEvent.createMany({ data: data.careEvents })

  return Response.json({ ok: true })
}
