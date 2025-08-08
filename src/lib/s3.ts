import { S3Client } from '@aws-sdk/client-s3'

export const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export const R2_BUCKET = process.env.R2_BUCKET!
export const PUBLIC_HOSTNAME =
  process.env.NEXT_PUBLIC_R2_CUSTOM_HOSTNAME ||
  process.env.NEXT_PUBLIC_R2_PUBLIC_HOSTNAME
