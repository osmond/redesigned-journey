import { prisma } from '@/lib/db'

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
