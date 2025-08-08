/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; img-src 'self' data: https:; script-src 'self'; style-src 'self' 'unsafe-inline';",
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig = {
  experimental: { serverActions: { allowedOrigins: ["*"] } },
  images: {
    remotePatterns: [
      process.env.NEXT_PUBLIC_R2_PUBLIC_HOSTNAME
        ? { protocol: 'https', hostname: process.env.NEXT_PUBLIC_R2_PUBLIC_HOSTNAME, pathname: '/**' }
        : undefined,
      process.env.NEXT_PUBLIC_R2_CUSTOM_HOSTNAME
        ? { protocol: 'https', hostname: process.env.NEXT_PUBLIC_R2_CUSTOM_HOSTNAME, pathname: '/**' }
        : undefined,
      process.env.NEXT_PUBLIC_CF_IMAGE_BASE
        ? { protocol: 'https', hostname: new URL(process.env.NEXT_PUBLIC_CF_IMAGE_BASE).hostname, pathname: '/**' }
        : undefined,
    ].filter(Boolean),
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}
export default nextConfig
