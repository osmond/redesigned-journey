import { NextResponse } from 'next/server'
import { R2_BUCKET, s3, PUBLIC_HOSTNAME } from '@/lib/s3'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { plantId, contentType, ext } = await req.json()
  if (!plantId) return NextResponse.json({ error: 'plantId required' }, { status: 400 })
  const plant = await prisma.plant.findFirst({ where: { id: plantId, userId: user.id } })
  if (!plant) return NextResponse.json({ error: 'not found' }, { status: 404 })
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
