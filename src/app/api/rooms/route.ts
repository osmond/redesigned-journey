import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

export async function GET() {
  const rooms = await prisma.room.findMany({ orderBy: { sortOrder: 'asc' } })
  return NextResponse.json(rooms)
}

const schema = z.object({ name: z.string().min(1) })
export async function POST(req: Request) {
  const json = await req.json(); const parsed = schema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const count = await prisma.room.count()
  const room = await prisma.room.create({ data: { name: parsed.data.name, sortOrder: count } })
  return NextResponse.json(room, { status: 201 })
}

const orderSchema = z.object({ order: z.array(z.object({ id: z.string(), sortOrder: z.number() })) })
export async function PUT(req: Request) {
  const json = await req.json(); const parsed = orderSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  await prisma.$transaction(
    parsed.data.order.map((r) =>
      prisma.room.update({ where: { id: r.id }, data: { sortOrder: r.sortOrder } })
    )
  )
  return NextResponse.json({ status: 'ok' })
}
