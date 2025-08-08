import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [rooms, plants, photos, careEvents, species] = await Promise.all([
    prisma.room.findMany({ where: { userId: user.id } as any }),
    prisma.plant.findMany({ where: { userId: user.id } }),
    prisma.photo.findMany({ where: { userId: user.id } }),
    prisma.careEvent.findMany({ where: { plant: { userId: user.id } } }),
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
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const data = await req.json()

  await prisma.$transaction([
    prisma.careEvent.deleteMany({ where: { plant: { userId: user.id } } }),
    prisma.photo.deleteMany({ where: { userId: user.id } }),
    prisma.plant.deleteMany({ where: { userId: user.id } }),
    prisma.room.deleteMany({ where: { userId: user.id } as any }),
  ])

  if (data.rooms?.length) await prisma.room.createMany({ data: data.rooms.map((r: any) => ({ ...r, userId: user.id })) })
  if (data.plants?.length) await prisma.plant.createMany({ data: data.plants.map((p: any) => ({ ...p, userId: user.id })) })
  if (data.photos?.length) await prisma.photo.createMany({ data: data.photos.map((p: any) => ({ ...p, userId: user.id })) })
  if (data.careEvents?.length)
    await prisma.careEvent.createMany({ data: data.careEvents.map((e: any) => ({ ...e })) })

  return NextResponse.json({ ok: true })
}
