import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { plantId, objectKey, url, contentType, width, height } = await req.json();

    if (!plantId || !objectKey || !url) {
      return NextResponse.json({ error: 'plantId, objectKey, url are required' }, { status: 400 });
    }

    const photo = await prisma.photo.create({
      data: { plantId, objectKey, url, contentType, width, height },
    });

    // If plant has no cover yet, set this one
    const plant = await prisma.plant.findUnique({ where: { id: plantId }, select: { coverPhotoId: true } });
    if (!plant?.coverPhotoId) {
      await prisma.plant.update({ where: { id: plantId }, data: { coverPhotoId: photo.id } });
    }

    return NextResponse.json({ photo });
  } catch (e: any) {
    console.error('create photo error', e);
    return NextResponse.json({ error: e?.message ?? 'failed' }, { status: 500 });
  }
}
