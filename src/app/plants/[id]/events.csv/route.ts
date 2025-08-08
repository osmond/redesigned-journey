import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { CareType } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') as CareType | null;
  const events = await prisma.careEvent.findMany({
    where: { plantId: params.id, ...(type ? { type } : {}) },
    orderBy: { createdAt: 'desc' },
  });
  const rows = [
    ['id', 'type', 'amountMl', 'note', 'createdAt'],
    ...events.map((e) => [
      e.id,
      e.type,
      e.amountMl ?? '',
      e.note ?? '',
      e.createdAt.toISOString(),
    ]),
  ];
  const csv = rows
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="plant-${params.id}-events.csv"`,
    },
  });
}
