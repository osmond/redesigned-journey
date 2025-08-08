import { NextResponse } from 'next/server';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '@/lib/db';
import { r2, R2_BUCKET } from '@/lib/r2';

const userId = 'seed-user';

export const runtime = 'nodejs';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const photo = await prisma.photo.findUnique({ where: { id: params.id } });
    if (!photo || photo.userId !== userId) return NextResponse.json({ error: 'not found' }, { status: 404 });

    // delete blobs in R2 (full + thumb)
    const thumbKey = photo.objectKey.replace(/\.[^.]+$/, (m) => `-thumb${m}`);
    try {
      await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: photo.objectKey }));
      await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: thumbKey }));
    } catch (e) {
      console.warn('R2 delete warning (continuing):', e);
    }

    // remove db record
    await prisma.photo.delete({ where: { id: params.id } });

    // if it was cover, pick another photo (if any) as cover
    const plant = await prisma.plant.findFirst({ where: { id: photo.plantId, userId }, select: { coverPhotoId: true } });
    if (plant?.coverPhotoId === photo.id) {
      const fallback = await prisma.photo.findFirst({ where: { plantId: photo.plantId, userId } });
      await prisma.plant.update({
        where: { id: photo.plantId },
        data: { coverPhotoId: fallback?.id ?? null },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('delete photo error', e);
    return NextResponse.json({ error: e?.message ?? 'failed' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { action } = await req.json();
    if (action !== 'cover') return NextResponse.json({ error: 'unsupported action' }, { status: 400 });

    const photo = await prisma.photo.findUnique({ where: { id: params.id } });
    if (!photo || photo.userId !== userId) return NextResponse.json({ error: 'not found' }, { status: 404 });

    await prisma.plant.updateMany({ where: { id: photo.plantId, userId }, data: { coverPhotoId: photo.id } });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('set cover error', e);
    return NextResponse.json({ error: e?.message ?? 'failed' }, { status: 500 });
  }
}
