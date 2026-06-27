import type { NextConfig } from 'next'

const config: NextConfig = {
  images: {
    // Allow Vercel Blob public CDN URLs
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Allow large image uploads (multipart body up to 50MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
}

export default config
