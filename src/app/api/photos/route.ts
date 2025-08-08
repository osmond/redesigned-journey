import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

// optional: list photos or create from a JSON payload if you're not doing direct upload in /api/uploads

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      plantId,
      objectKey,
      url,
      contentType,
      width,
      height,
      thumbnailUrl,
      thumbnailWidth,
      thumbnailHeight,
    } = body;

    if (!plantId || !objectKey || !url) {
      return NextResponse.json(
        { error: 'plantId, objectKey, and url are required' },
        { status: 400 }
      );
    }

    const photo = await prisma.photo.create({
      data: {
        plantId,
        objectKey,
        url,
        contentType: contentType || undefined,
        width: width ?? undefined,
        height: height ?? undefined,
        thumbnailUrl: thumbnailUrl ?? undefined,
        thumbnailWidth: thumbnailWidth ?? undefined,
        thumbnailHeight: thumbnailHeight ?? undefined,
      },
    });

    return NextResponse.json({ ok: true, photo }, { status: 200 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message || 'Failed' }, { status: 500 });
  }
}
