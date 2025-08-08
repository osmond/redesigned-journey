import { NextResponse } from 'next/server'
import { R2_BUCKET, s3, PUBLIC_HOSTNAME } from '@/lib/s3'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'

export async function POST(req: Request) {
  const { plantId, contentType, ext } = await req.json()
  if (!plantId) return NextResponse.json({ error: 'plantId required' }, { status: 400 })
  const key = `${plantId}/${randomUUID()}.${(ext || 'jpg').replace(/[^a-zA-Z0-9]/g, '')}`

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
