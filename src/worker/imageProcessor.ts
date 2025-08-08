import { Worker } from 'bullmq';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { r2, R2_BUCKET, PUBLIC_HOST } from '@/lib/r2';
import { prisma } from '@/lib/db';
import type { ImageJob } from '@/lib/imageQueue';

const connection = {
  connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' } as any,
};

new Worker<ImageJob>(
  'image-processing',
  async job => {
    const { originalKey, baseKey, photoId } = job.data;

    const obj = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: originalKey }));
    const buffer = Buffer.from(await obj.Body!.transformToByteArray());

    const metadata = await sharp(buffer).metadata();

    const fullWebp = await sharp(buffer)
      .resize({ width: 1600, height: 1600, fit: 'inside' })
      .webp({ quality: 85 })
      .toBuffer();
    const fullAvif = await sharp(buffer)
      .resize({ width: 1600, height: 1600, fit: 'inside' })
      .avif({ quality: 50 })
      .toBuffer();
    const thumbWebp = await sharp(buffer)
      .resize({ width: 400, height: 400, fit: 'inside' })
      .webp({ quality: 80 })
      .toBuffer();
    const thumbAvif = await sharp(buffer)
      .resize({ width: 400, height: 400, fit: 'inside' })
      .avif({ quality: 50 })
      .toBuffer();

    const fullWebpKey = `${baseKey}.webp`;
    const fullAvifKey = `${baseKey}.avif`;
    const thumbWebpKey = `${baseKey}-thumb.webp`;
    const thumbAvifKey = `${baseKey}-thumb.avif`;

    await Promise.all([
      r2.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: fullWebpKey, Body: fullWebp, ContentType: 'image/webp' })),
      r2.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: fullAvifKey, Body: fullAvif, ContentType: 'image/avif' })),
      r2.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: thumbWebpKey, Body: thumbWebp, ContentType: 'image/webp' })),
      r2.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: thumbAvifKey, Body: thumbAvif, ContentType: 'image/avif' })),
    ]);

    const publicBase = PUBLIC_HOST;
    const url = `https://${publicBase}/${encodeURIComponent(R2_BUCKET)}/${fullWebpKey}`;
    const thumbUrl = `https://${publicBase}/${encodeURIComponent(R2_BUCKET)}/${thumbWebpKey}`;

    await prisma.photo.update({
      where: { id: photoId },
      data: {
        objectKey: fullWebpKey,
        url,
        thumbUrl,
        contentType: 'image/webp',
        width: metadata.width ?? undefined,
        height: metadata.height ?? undefined,
      },
    });
  },
  connection as any
);
