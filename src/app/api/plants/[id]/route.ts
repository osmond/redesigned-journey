import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { getSessionUser } from '@/lib/auth'

const patchSchema = z.object({
  name: z.string().optional(),
  species: z.string().nullable().optional(),
  commonName: z.string().nullable().optional(),
  speciesWfoId: z.string().nullable().optional(),
  roomId: z.string().nullable().optional(),
  lightLevel: z.enum(['LOW','MEDIUM','BRIGHT_INDIRECT','FULL_SUN']).nullable().optional(),
  potDiameterCm: z.coerce.number().nullable().optional(),
  potHeightCm: z.coerce.number().nullable().optional(),
  potMaterial: z.enum(['CLAY','PLASTIC','CERAMIC']).nullable().optional(),
  recommendedWaterMl: z.coerce.number().nullable().optional(),
  wateringIntervalDays: z.coerce.number().int().positive().optional(),
  fertilizingIntervalDays: z.coerce.number().int().positive().optional(),
  lastWateredAt: z.coerce.date().optional(),
  lastFertilizedAt: z.coerce.date().optional(),
  latitude: z.coerce.number().nullable().optional(),
  longitude: z.coerce.number().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const json = await req.json()
  const parsed = patchSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const plant = await prisma.plant.findFirst({ where: { id: params.id, userId: user.id } })
  if (!plant) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const updated = await prisma.plant.update({
    where: { id: params.id },
    data: { ...parsed.data, userId: user.id },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const plant = await prisma.plant.findFirst({ where: { id: params.id, userId: user.id } })
  if (!plant) return NextResponse.json({ error: 'not found' }, { status: 404 })
  await prisma.photo.deleteMany({ where: { plantId: params.id, userId: user.id } })
  await prisma.careEvent.deleteMany({ where: { plantId: params.id, plant: { userId: user.id } } })
  await prisma.plant.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
