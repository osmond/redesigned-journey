import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2, R2_BUCKET, PUBLIC_HOST } from '@/lib/r2';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { objectKey, contentType } = await req.json();

    if (!objectKey || !contentType) {
      return NextResponse.json({ error: 'objectKey and contentType required' }, { status: 400 });
    }

    const cmd = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: objectKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(r2, cmd, { expiresIn: 60 }); // 60s

    const publicUrl = `https://${PUBLIC_HOST}/${encodeURIComponent(R2_BUCKET)}/${objectKey}`;

    return NextResponse.json({ uploadUrl, objectKey, publicUrl });
  } catch (e: any) {
    console.error('presign error', e);
    return NextResponse.json({ error: e?.message ?? 'presign failed' }, { status: 500 });
  }
}
