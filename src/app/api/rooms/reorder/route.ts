import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const order: { id: string; sortOrder: number }[] = body.order || [];
    for (const { id, sortOrder } of order) {
      await prisma.room.update({ where: { id }, data: { sortOrder } });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}
