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

interface Params {
  params: { id: string };
}

export async function GET(req: Request, { params }: Params) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = params;
  const password = new URL(req.url).searchParams.get('password') ?? undefined;

  const link = await prisma.shareLink.findFirst({
    where: {
      id,
      OR: [
        { plant: { userId } },
        { room: { userId } },
      ],
    },
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

