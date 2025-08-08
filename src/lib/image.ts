export function cfResize(url: string, width: number) {
  const base = process.env.NEXT_PUBLIC_CF_IMAGE_BASE;
  if (!base) return url;
  return `${base}/cdn-cgi/image/width=${width},quality=75/${url}`;
}
