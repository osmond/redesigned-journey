import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({ plantId: z.string().min(1), type: z.enum(['WATER','FERTILIZE']), amountMl: z.number().int().positive().optional(), note: z.string().optional() })

async function fetchWeather(lat: number, lon: number) {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lon))
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,precipitation')
  const res = await fetch(url.toString(), { cache: 'no-store' })
  if (!res.ok) return null
  const json = await res.json()
  const c = json.current || {}
  return { tempC: c.temperature_2m ?? null, humidity: c.relative_humidity_2m ?? null, precipMm: c.precipitation ?? null }
}

export async function POST(req: Request) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const json = await req.json(); const parsed = schema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const plant = await prisma.plant.findUnique({ where: { id: parsed.data.plantId } })
  if (!plant || plant.userId !== user.id) return NextResponse.json({ error: 'Plant not found' }, { status: 404 })

  const lat = plant.latitude ?? Number(process.env.DEFAULT_LAT)
  const lon = plant.longitude ?? Number(process.env.DEFAULT_LON)
  let weather: { tempC: number|null, humidity: number|null, precipMm: number|null } | null = null
  if (!Number.isNaN(lat) && !Number.isNaN(lon)) weather = await fetchWeather(lat, lon)

  const event = await prisma.careEvent.create({ data: {
    userId: user.id,
    plantId: plant.id,
    type: parsed.data.type as any,
    amountMl: parsed.data.amountMl ?? null,
    note: parsed.data.note ?? null,
    tempC: weather?.tempC ?? null,
    humidity: weather?.humidity ?? null,
    precipMm: weather?.precipMm ?? null,
    lat: !Number.isNaN(lat) ? lat : null,
    lon: !Number.isNaN(lon) ? lon : null,
  }})

  if (parsed.data.type === 'WATER') await prisma.plant.update({ where: { id: plant.id }, data: { lastWateredAt: new Date() } })
  if (parsed.data.type === 'FERTILIZE') await prisma.plant.update({ where: { id: plant.id }, data: { lastFertilizedAt: new Date() } })

  return NextResponse.json(event, { status: 201 })
}
