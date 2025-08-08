import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUser } from '@/lib/auth';

export const runtime = 'nodejs';

// optional: list photos or create from a JSON payload if you're not doing direct upload in /api/uploads

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { plantId, objectKey, url, thumbUrl, contentType, width, height } = body;

    if (!plantId || !objectKey || !url || !thumbUrl) {
      return NextResponse.json(
        { error: 'plantId, objectKey, url, and thumbUrl are required' },
        { status: 400 }
      );
    }

    const plant = await prisma.plant.findUnique({ where: { id: plantId, userId: user.id } });
    if (!plant) return NextResponse.json({ error: 'Plant not found' }, { status: 404 });

    const photo = await prisma.photo.create({
      data: {
        userId: user.id,
        plantId,
        objectKey,
        url,
        thumbUrl,
        contentType: contentType || undefined,
        width: width ?? undefined,
        height: height ?? undefined,
      },
    });

    return NextResponse.json({ ok: true, photo }, { status: 200 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message || 'Failed' }, { status: 500 });
  }
}
