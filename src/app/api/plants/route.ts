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

const bodySchema = z.object({
  name: z.string().min(1),
  species: z.string().optional().nullable(),       // scientific name
  commonName: z.string().optional().nullable(),
  speciesWfoId: z.string().optional().nullable(),
  roomId: z.string().optional().nullable(),
  lightLevel: z.enum(['LOW','MEDIUM','BRIGHT_INDIRECT','FULL_SUN']).optional().nullable(),
  potDiameterCm: z.coerce.number().optional().nullable(),
  potHeightCm: z.coerce.number().optional().nullable(),
  potMaterial: z.enum(['CLAY','PLASTIC','CERAMIC']).optional().nullable(),
  recommendedWaterMl: z.coerce.number().optional().nullable(),
  wateringIntervalDays: z.coerce.number().int().positive().default(7),
  fertilizingIntervalDays: z.coerce.number().int().positive().default(30),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const plants = await prisma.plant.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(plants)
}

export async function POST(req: Request) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const json = await req.json()
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const d = parsed.data

  const p = await prisma.plant.create({
    data: {
      userId,
      name: d.name,
      species: d.species || null,
      commonName: d.commonName || null,
      speciesWfoId: d.speciesWfoId || null,
      roomId: d.roomId || null,
      lightLevel: (d.lightLevel as any) || null,
      potDiameterCm: d.potDiameterCm ?? null,
      potHeightCm: d.potHeightCm ?? null,
      potMaterial: (d.potMaterial as any) || null,
      recommendedWaterMl: d.recommendedWaterMl ?? null,
      wateringIntervalDays: d.wateringIntervalDays,
      fertilizingIntervalDays: d.fertilizingIntervalDays,
      latitude: d.latitude ?? null,
      longitude: d.longitude ?? null,
      notes: d.notes || null,
    },
  })
  return NextResponse.json(p, { status: 201 })
}
