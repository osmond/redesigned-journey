import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export async function GET() {
  const rooms = await prisma.room.findMany({ orderBy: { sortOrder: 'asc' } });
  return NextResponse.json(rooms);
}

const schema = z.object({ name: z.string().min(1) })
export async function POST(req: Request) {
  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const count = await prisma.room.count();
  const room = await prisma.room.create({
    data: { name: parsed.data.name, sortOrder: count },
  });
  return NextResponse.json(room, { status: 201 });
}
