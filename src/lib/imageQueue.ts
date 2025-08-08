import { Queue } from 'bullmq';

const connection = {
  connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' } as any,
};

export type ImageJob = {
  originalKey: string;
  baseKey: string;
  photoId: string;
};

export const imageQueue = new Queue<ImageJob>('image-processing', connection as any);

export function enqueueImage(job: ImageJob) {
  return imageQueue.add('process', job);
}
