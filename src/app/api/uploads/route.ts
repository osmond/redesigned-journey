import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import prisma from '@/lib/db';
import crypto from 'crypto';

export const runtime = 'nodejs';

const accountId = process.env.R2_ACCOUNT_ID!;
const bucket = process.env.R2_BUCKET!;
const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
const publicHost =
  process.env.NEXT_PUBLIC_R2_CUSTOM_HOSTNAME ||
  process.env.NEXT_PUBLIC_R2_PUBLIC_HOSTNAME ||
  '';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: true,
});

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const plantId = (form.get('plantId') as string | null)?.trim();

    if (!file || !plantId) {
      return NextResponse.json({ error: 'file and plantId are required' }, { status: 400 });
    }

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const key = `plants/${plantId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const buf = Buffer.from(await file.arrayBuffer());

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buf,
        ContentType: file.type || 'application/octet-stream',
      }),
    );

    const url = publicHost ? `https://${publicHost}/${key}` : null;

    const photo = await prisma.photo.create({
      data: {
        plantId,
        objectKey: key,
        url,
        contentType: file.type || null,
      },
    });

    return NextResponse.json(photo);
  } catch (err: any) {
    console.error('upload error', err);
    return NextResponse.json({ error: 'upload failed', detail: err?.message }, { status: 500 });
  }
}
