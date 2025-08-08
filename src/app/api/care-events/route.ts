import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { getSessionUser } from '@/lib/auth'

const schema = z.object({
  plantId: z.string().min(1),
  type: z.enum(['WATER', 'FERTILIZE', 'PRUNE', 'REPOT', 'NOTE']),
  amountMl: z.number().int().positive().optional(),
  note: z.string().optional(),
  userName: z.string().min(1).optional(),
})

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
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const json = await req.json(); const parsed = schema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  if (parsed.data.type === 'NOTE' && !parsed.data.note)
    return NextResponse.json({ error: 'note required' }, { status: 400 })

  const plant = await prisma.plant.findFirst({ where: { id: parsed.data.plantId, userId: user.id } })
  if (!plant) return NextResponse.json({ error: 'Plant not found' }, { status: 404 })

  const lat = plant.latitude ?? Number(process.env.DEFAULT_LAT)
  const lon = plant.longitude ?? Number(process.env.DEFAULT_LON)
  let weather: { tempC: number|null, humidity: number|null, precipMm: number|null } | null = null
  if (!Number.isNaN(lat) && !Number.isNaN(lon)) weather = await fetchWeather(lat, lon)

  const event = await prisma.careEvent.create({ data: {
    plantId: plant.id,
    type: parsed.data.type as any,
    amountMl: parsed.data.amountMl ?? null,
    note: parsed.data.note ?? null,
    userName: parsed.data.userName ?? null,
    tempC: weather?.tempC ?? null,
    humidity: weather?.humidity ?? null,
    precipMm: weather?.precipMm ?? null,
    lat: !Number.isNaN(lat) ? lat : null,
    lon: !Number.isNaN(lon) ? lon : null,
  }})

  if (parsed.data.type === 'WATER') await prisma.plant.update({ where: { id: plant.id }, data: { lastWateredAt: new Date(), userId: user.id } })
  if (parsed.data.type === 'FERTILIZE') await prisma.plant.update({ where: { id: plant.id }, data: { lastFertilizedAt: new Date(), userId: user.id } })

  return NextResponse.json(event, { status: 201 })
}

export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const plantId = searchParams.get('plantId')
  const type = searchParams.get('type')
  const userName = searchParams.get('user')
  const where: any = { plant: { userId: user.id } }
  if (plantId) where.plantId = plantId
  if (type) where.type = type as any
  if (userName) where.userName = userName
  const events = await prisma.careEvent.findMany({
    where,
    include: { plant: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return NextResponse.json(events)
}
