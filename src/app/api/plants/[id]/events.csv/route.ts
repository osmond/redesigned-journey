import { prisma } from '@/lib/db'

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/)
  const headers = lines[0].split(',')
  return lines.slice(1).map((line) => {
    const values = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
    const record: Record<string, string> = {}
    headers.forEach((h, i) => {
      record[h] = values[i]?.replace(/^"|"$/g, '').replace(/""/g, '"')
    })
    return record
  })
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const events = await prisma.careEvent.findMany({
    where: { plantId: params.id },
    orderBy: { createdAt: 'desc' },
  })

  const headers = new Headers({
    'Content-Type': 'text/csv',
    'Content-Disposition': `attachment; filename="plant-${params.id}-events.csv"`,
  })

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode('id,type,amountMl,note,tempC,humidity,precipMm,lat,lon,createdAt\n')
      )
      for (const ev of events) {
        const row = [
          ev.id,
          ev.type,
          ev.amountMl ?? '',
          ev.note ? `"${ev.note.replace(/"/g, '""')}"` : '',
          ev.tempC ?? '',
          ev.humidity ?? '',
          ev.precipMm ?? '',
          ev.lat ?? '',
          ev.lon ?? '',
          ev.createdAt.toISOString(),
        ].join(',')
        controller.enqueue(encoder.encode(row + '\n'))
      }
      controller.close()
    },
  })

  return new Response(stream, { headers })
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { csv, mapping = {} } = await req.json()
  const rows = parseCsv(csv)

  const events = rows.map((row) => {
    const ev: any = { plantId: params.id }
    for (const [col, value] of Object.entries(row)) {
      const field = (mapping as Record<string, string>)[col] ?? col
      if (!value) continue
      switch (field) {
        case 'amountMl':
          ev.amountMl = parseInt(value, 10)
          break
        case 'tempC':
        case 'humidity':
        case 'precipMm':
        case 'lat':
        case 'lon':
          ev[field] = parseFloat(value)
          break
        case 'createdAt':
          ev.createdAt = new Date(value)
          break
        default:
          ev[field] = value
      }
    }
    return ev
  })

  if (events.length) await prisma.careEvent.createMany({ data: events })
  return Response.json({ imported: events.length })
}
