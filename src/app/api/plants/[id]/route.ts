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
    {
      cookies: { getAll: () => cookieStore.getAll() },
    }
  )
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.user.id ?? null
}

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
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const json = await req.json()
  const parsed = patchSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const plant = await prisma.plant.findFirst({ where: { id: params.id, userId } })
  if (!plant) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const updated = await prisma.plant.update({
    where: { id: params.id, userId },
    data: { ...parsed.data, userId },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const plant = await prisma.plant.findFirst({ where: { id: params.id, userId } })
  if (!plant) return NextResponse.json({ error: 'not found' }, { status: 404 })
  await prisma.photo.deleteMany({ where: { plantId: params.id, userId } })
  await prisma.careEvent.deleteMany({ where: { plantId: params.id, userId } })
  await prisma.plant.deleteMany({ where: { id: params.id, userId } })
  return NextResponse.json({ ok: true })
}
