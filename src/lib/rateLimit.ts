const buckets = new Map<string, { count: number; expires: number }>();

export function checkRateLimit(key: string, limit = 60, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.expires < now) {
    buckets.set(key, { count: 1, expires: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}
