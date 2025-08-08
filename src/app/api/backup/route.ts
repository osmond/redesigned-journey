import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getUserId() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.user.id ?? null
}

export const runtime = 'nodejs'

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const data = await req.json()

  await prisma.$transaction([
    prisma.careEvent.deleteMany({ where: { userId } }),
    prisma.photo.deleteMany({ where: { userId } }),
    prisma.plant.deleteMany({ where: { userId } }),
    prisma.room.deleteMany({ where: { userId } }),
  ])

  if (data.rooms?.length) await prisma.room.createMany({ data: data.rooms.map((r: any) => ({ ...r, userId })) })
  if (data.plants?.length) await prisma.plant.createMany({ data: data.plants.map((p: any) => ({ ...p, userId })) })
  if (data.photos?.length) await prisma.photo.createMany({ data: data.photos.map((p: any) => ({ ...p, userId })) })
  if (data.careEvents?.length)
    await prisma.careEvent.createMany({ data: data.careEvents.map((e: any) => ({ ...e, userId })) })

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.$transaction([
    prisma.careEvent.deleteMany({ where: { userId } }),
    prisma.photo.deleteMany({ where: { userId } }),
    prisma.plant.deleteMany({ where: { userId } }),
    prisma.room.deleteMany({ where: { userId } }),
  ])
  return NextResponse.json({ ok: true })
}
