import { LightLevel, PotMaterial } from '@prisma/client'

// rough cylinder volume in mL (1 cm³ ≈ 1 mL)
export function potVolumeMl(diameterCm: number, heightCm: number) {
  const r = diameterCm / 2
  const vol = Math.PI * r * r * heightCm
  // not all volume is soil (voids/drainage). take 70% as effective
  return vol * 0.7
}

export function materialFactor(m?: PotMaterial) {
  if (!m) return 1
  switch (m) {
    case 'CLAY': return 1.1
    case 'PLASTIC': return 1.0
    case 'CERAMIC': return 1.0
  }
}

export function lightFactor(l?: LightLevel) {
  if (!l) return 1
  switch (l) {
    case 'LOW': return 0.9
    case 'MEDIUM': return 1.0
    case 'BRIGHT_INDIRECT': return 1.15
    case 'FULL_SUN': return 1.3
  }
}

// Suggest a single pour size that typically achieves a small runoff (10–20%)
// Start with ~25% of effective volume, then modulate.
export function suggestWaterMl(opts: {
  diameterCm?: number
  heightCm?: number
  material?: PotMaterial | null
  light?: LightLevel | null
}) {
  const { diameterCm, heightCm } = opts
  if (!diameterCm || !heightCm) return null
  const base = potVolumeMl(diameterCm, heightCm) * 0.25
  const mf = materialFactor(opts.material ?? undefined)
  const lf = lightFactor(opts.light ?? undefined)
  const ml = Math.round(base * mf * lf)
  return Math.max(50, Math.min(2000, ml)) // keep within 50–2000 mL by default
}

// Baseline watering interval heuristics by type (string contains)
export function baselineIntervalDays(scientificOrCommon?: string | null) {
  const s = (scientificOrCommon || '').toLowerCase()
  if (/cact|succulent/.test(s)) return 21
  if (/orchid/.test(s)) return 8
  return 7 // general foliage
}

// Adjust interval for environment
export function adjustIntervalDays(base: number, light?: LightLevel | null, material?: PotMaterial | null) {
  let d = base
  if (light === 'LOW') d += 2
  if (light === 'BRIGHT_INDIRECT') d -= 1
  if (light === 'FULL_SUN') d -= 2
  if (material === 'CLAY') d -= 1
  return Math.max(2, d)
}

// Fertilizer baseline (days between)
export function fertilizerIntervalDays(scientificOrCommon?: string | null) {
  const s = (scientificOrCommon || '').toLowerCase()
  if (/cact|succulent/.test(s)) return 60 // ~bi-monthly in growing season
  if (/orchid/.test(s)) return 7 * 4 // "weakly weekly" ≈ quarter-strength weekly; we surface as ~monthly interval hint
  return 30 // general houseplant half-strength monthly
}
