import { NextResponse } from 'next/server'
import { suggestWaterMl, baselineIntervalDays, adjustIntervalDays, fertilizerIntervalDays } from '@/lib/estimation'
import { LightLevel, PotMaterial } from '@prisma/client'
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

export async function POST(req: Request) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const {
    scientificName,
    commonName,
    lightLevel,
    potDiameterCm,
    potHeightCm,
    potMaterial,
  } = body as {
    scientificName?: string
    commonName?: string
    lightLevel?: LightLevel | null
    potDiameterCm?: number
    potHeightCm?: number
    potMaterial?: PotMaterial | null
  }

  const waterMl = suggestWaterMl({
    diameterCm: potDiameterCm,
    heightCm: potHeightCm,
    light: lightLevel ?? undefined,
    material: potMaterial ?? undefined,
  })

  const base = baselineIntervalDays(scientificName || commonName)
  const wateringIntervalDays = adjustIntervalDays(base, lightLevel, potMaterial)
  const fertilizingIntervalDays = fertilizerIntervalDays(scientificName || commonName)

  return NextResponse.json({
    scientificName,
    commonName,
    suggestions: {
      waterMl,
      wateringIntervalDays,
      fertilizingIntervalDays,
      fertilizerStrengthHint: /orchid/i.test(scientificName || commonName || '')
        ? 'quarter-strength (“weakly, weekly”)'
        : /cact|succulent/i.test(scientificName || commonName || '')
        ? 'low dose in growing months'
        : 'half-strength in growing months',
    },
  })
}
