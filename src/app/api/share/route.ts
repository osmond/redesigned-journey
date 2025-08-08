import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createHash } from 'crypto';

export async function POST(req: Request) {
  const { type, id, password } = await req.json();

  if (type !== 'plant' && type !== 'room') {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  const data: any = {};
  if (type === 'plant') data.plantId = id;
  if (type === 'room') data.roomId = id;
  if (password) {
    data.passwordHash = createHash('sha256').update(password).digest('hex');
  }

  const link = await prisma.shareLink.create({ data });

  return NextResponse.json({ id: link.id, url: `/share/${link.id}` });
}

