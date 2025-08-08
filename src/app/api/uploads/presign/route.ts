import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2, R2_BUCKET, PUBLIC_HOST } from '@/lib/r2';
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

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
