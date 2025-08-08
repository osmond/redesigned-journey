import { prisma } from '@/lib/db'
import { getUser } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const user = await getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const where = { userId: user.id }
  const [rooms, plants, photos, careEvents, species] = await Promise.all([
    prisma.room.findMany({ where }),
    prisma.plant.findMany({ where }),
    prisma.photo.findMany({ where }),
    prisma.careEvent.findMany({ where }),
    prisma.species.findMany({ where }),
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
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const data = await req.json()

  const where = { userId: user.id }
  await prisma.$transaction([
    prisma.careEvent.deleteMany({ where }),
    prisma.photo.deleteMany({ where }),
    prisma.plant.deleteMany({ where }),
    prisma.room.deleteMany({ where }),
    prisma.species.deleteMany({ where }),
  ])

  if (data.species?.length)
    await prisma.species.createMany({ data: data.species.map((x: any) => ({ ...x, userId: user.id })) })
  if (data.rooms?.length)
    await prisma.room.createMany({ data: data.rooms.map((x: any) => ({ ...x, userId: user.id })) })
  if (data.plants?.length)
    await prisma.plant.createMany({ data: data.plants.map((x: any) => ({ ...x, userId: user.id })) })
  if (data.photos?.length)
    await prisma.photo.createMany({ data: data.photos.map((x: any) => ({ ...x, userId: user.id })) })
  if (data.careEvents?.length)
    await prisma.careEvent.createMany({ data: data.careEvents.map((x: any) => ({ ...x, userId: user.id })) })

  return NextResponse.json({ ok: true })
}
