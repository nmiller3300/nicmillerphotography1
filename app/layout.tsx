export const dynamic = 'force-dynamic'

/**
 * app/layout.tsx
 *
 * Root layout — loads Jost + Manrope from Google Fonts, sets the charcoal
 * background, and includes the gold-particle canvas (client component).
 *
 * Fonts: Jost (headings, weight 200/300/400/500) + Manrope (body, weight 300-700)
 * These match the existing design exactly.
 */

import type { Metadata } from 'next'
import { Jost, Manrope } from 'next/font/google'
import { db } from '@/lib/db'
import './globals.css'

const jost = Jost({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500'],
  variable: '--font-jost',
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-manrope',
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const [seo, settings] = await Promise.all([
    db.seoSettings.findFirst(),
    db.settings.findFirst(),
  ])

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nicmiller.photography'

  return {
    title: seo?.title ?? 'Nic Miller Photography',
    description: seo?.description ?? 'Fine art nature & landscape prints.',
    metadataBase: new URL(siteUrl),
    alternates: { canonical: seo?.canonical ?? siteUrl },
    robots: seo?.indexable === false ? 'noindex,nofollow' : 'index,follow',
    openGraph: {
      title: seo?.title ?? 'Nic Miller Photography',
      description: seo?.description ?? '',
      siteName: 'Nic Miller Photography',
      type: 'website',
    },
    icons: { icon: '/favicon.ico' },
    other: {
      'instagram': settings?.instagram ?? '',
    },
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${jost.variable} ${manrope.variable}`}>
      <body>
        {children}
      </body>
    </html>
  )
}
