/** @type {import('next').NextConfig} */
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
    ].filter(Boolean),
  },
}
export default nextConfig
