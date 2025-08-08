import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createHash } from 'crypto';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getUserId() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user.id ?? null;
}

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { type, id, password } = await req.json();

  if (type !== 'plant' && type !== 'room') {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  if (type === 'plant') {
    const plant = await prisma.plant.findFirst({ where: { id, userId } });
    if (!plant) return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  if (type === 'room') {
    const room = await prisma.room.findFirst({ where: { id, userId } });
    if (!room) return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const data: any = { userId };
  if (type === 'plant') data.plantId = id;
  if (type === 'room') data.roomId = id;
  if (password) {
    data.passwordHash = createHash('sha256').update(password).digest('hex');
  }

  const link = await prisma.shareLink.create({ data });

  return NextResponse.json({ id: link.id, url: `/share/${link.id}` });
}

