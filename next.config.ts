import type { NextConfig } from 'next'

const config: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'public.blob.vercel-storage.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
}

export default config
