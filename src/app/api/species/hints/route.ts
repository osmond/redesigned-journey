import { NextResponse } from 'next/server'
import { suggestWaterMl, baselineIntervalDays, adjustIntervalDays, fertilizerIntervalDays } from '@/lib/estimation'
import { LightLevel, PotMaterial } from '@prisma/client'
import { getSessionUser } from '@/lib/auth'

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
