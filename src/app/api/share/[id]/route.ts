import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createHash } from 'crypto';
import { getSessionUser } from '@/lib/auth';

interface Params {
  params: { id: string };
}

export async function GET(req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = params;
  const password = new URL(req.url).searchParams.get('password') ?? undefined;

  const link = await prisma.shareLink.findFirst({
    where: { id, userId: user.id } as any,
    include: {
      plant: { include: { photos: true, events: true } },
      room: { include: { plants: { include: { photos: true, events: true } } } },
    },
  });

  if (!link) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (link.passwordHash) {
    const hash = createHash('sha256').update(password ?? '').digest('hex');
    if (hash !== link.passwordHash) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.json({ plant: link.plant, room: link.room });
}

