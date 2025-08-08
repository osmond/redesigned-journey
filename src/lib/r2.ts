import { S3Client } from '@aws-sdk/client-s3';

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

export const R2_BUCKET = process.env.R2_BUCKET!;
export const PUBLIC_HOST = process.env.NEXT_PUBLIC_R2_PUBLIC_HOSTNAME!; // e.g. pub-xxxx.r2.dev
