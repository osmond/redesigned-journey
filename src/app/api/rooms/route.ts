import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rooms = await prisma.room.findMany({
    where: { userId: user.id } as any,
    orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json(rooms)
}

const schema = z.object({ name: z.string().min(1) })
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const json = await req.json(); const parsed = schema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const count = await prisma.room.count({ where: { userId: user.id } as any })
  const room = await prisma.room.create({ data: { name: parsed.data.name, sortOrder: count, userId: user.id } as any })
  return NextResponse.json(room, { status: 201 })
}

const orderSchema = z.object({ order: z.array(z.object({ id: z.string(), sortOrder: z.number() })) })
export async function PUT(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const json = await req.json(); const parsed = orderSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  await prisma.$transaction(
    parsed.data.order.map((r) =>
      prisma.room.update({ where: { id: r.id, userId: user.id } as any, data: { sortOrder: r.sortOrder, userId: user.id } as any })
    )
  )
  return NextResponse.json({ status: 'ok' })
}
