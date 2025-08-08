import { NextResponse } from 'next/server'
import { R2_BUCKET, s3, PUBLIC_HOSTNAME } from '@/lib/s3'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/db'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getUserId() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => cookieStore.getAll() },
    }
  )
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.user.id ?? null
}

export async function POST(req: Request) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { plantId, contentType, ext } = await req.json()
  if (!plantId) return NextResponse.json({ error: 'plantId required' }, { status: 400 })
  const plant = await prisma.plant.findFirst({ where: { id: plantId, userId } })
  if (!plant) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const key = `users/${userId}/plants/${plantId}/${randomUUID()}.${(ext || 'jpg').replace(/[^a-zA-Z0-9]/g, '')}`

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType || 'application/octet-stream',
  })
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 })

  const host = PUBLIC_HOSTNAME
  const publicUrl = host ? `https://${host}/${key}` : `/${key}`
  return NextResponse.json({ uploadUrl, objectKey: key, publicUrl })
}
