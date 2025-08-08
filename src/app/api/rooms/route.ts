import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
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

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rooms = await prisma.room.findMany({
    where: { userId },
    orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json(rooms)
}

const schema = z.object({ name: z.string().min(1) })
export async function POST(req: Request) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const json = await req.json(); const parsed = schema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const count = await prisma.room.count({ where: { userId } })
  const room = await prisma.room.create({ data: { name: parsed.data.name, sortOrder: count, userId } })
  return NextResponse.json(room, { status: 201 })
}

const orderSchema = z.object({ order: z.array(z.object({ id: z.string(), sortOrder: z.number() })) })
export async function PUT(req: Request) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const json = await req.json(); const parsed = orderSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  await prisma.$transaction(
    parsed.data.order.map((r) =>
      prisma.room.update({ where: { id: r.id, userId }, data: { sortOrder: r.sortOrder, userId } })
    )
  )
  return NextResponse.json({ status: 'ok' })
}
