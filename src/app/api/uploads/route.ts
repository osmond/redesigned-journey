import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import { prisma } from '@/lib/db';

const userId = 'seed-user';

export const runtime = 'nodejs';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    // Expecting multipart/form-data: file + plantId
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const plantId = form.get('plantId') as string | null;

    if (!file || !plantId) {
      return NextResponse.json({ error: 'file and plantId are required' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const key = `plants/${plantId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const arrayBuf = await file.arrayBuffer();

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: key,
        Body: Buffer.from(arrayBuf),
        ContentType: file.type || 'application/octet-stream',
        // set cache headers if you want:
        // CacheControl: 'public, max-age=31536000, immutable',
      })
    );

    // public URL (via your public hostname)
    const publicBase =
      process.env.NEXT_PUBLIC_R2_CUSTOM_HOSTNAME ||
      process.env.NEXT_PUBLIC_R2_PUBLIC_HOSTNAME;
    const url = `https://${publicBase}/${key}`;

    // save photo row
    const photo = await prisma.photo.create({
      data: {
        plantId,
        userId,
        objectKey: key,
        url,
        thumbUrl: url,
        contentType: file.type || undefined,
      },
    });

    return NextResponse.json({ ok: true, photo }, { status: 200 });
  } catch (err: any) {
    console.error('upload error', err);
    return NextResponse.json({ error: err?.message || 'Upload failed' }, { status: 500 });
  }
}
