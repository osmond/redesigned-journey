import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { r2, R2_BUCKET } from '@/lib/r2';
import { enqueueImage } from '@/lib/imageQueue';

async function getUserId() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => cookieStore.getAll() },
    }
  );
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user.id ?? null;
}

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Expecting multipart/form-data: file + plantId
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const plantId = form.get('plantId') as string | null;
    const userId = await getUserId();
    if (!file || !plantId || !userId) {
      return NextResponse.json({ error: 'file, plantId, and user' }, { status: 400 });
    }

    const plant = await prisma.plant.findFirst({ where: { id: plantId, userId } });
    if (!plant) {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }

    const ext = file.name.includes('.') ? `.${file.name.split('.').pop()}` : '';
    const baseKey = `users/${userId}/plants/${plantId}/${Date.now()}-${crypto.randomUUID()}`;
    const originalKey = `originals/${baseKey}${ext}`;

    const arrayBuf = await file.arrayBuffer();

    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: originalKey,
        Body: Buffer.from(arrayBuf),
        ContentType: file.type || 'application/octet-stream',
        // originals stored without public access; lifecycle rules handled in bucket config
      })
    );

    const photo = await prisma.photo.create({
      data: {
        plantId,
        userId,
        objectKey: `${baseKey}.webp`, // final processed key
        url: '',
        thumbUrl: '',
        contentType: 'image/webp',
      },
    });

    await enqueueImage({ originalKey, baseKey, photoId: photo.id });

    return NextResponse.json({ ok: true, photoId: photo.id }, { status: 200 });
  } catch (err: any) {
    console.error('upload error', err);
    return NextResponse.json({ error: err?.message || 'Upload failed' }, { status: 500 });
  }
}
