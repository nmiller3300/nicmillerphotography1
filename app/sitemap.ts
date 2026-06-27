export const dynamic = 'force-dynamic'

/**
 * app/sitemap.ts
 * Auto-generates XML sitemap for SEO. Next.js calls this at build time (and
 * on-demand with ISR). Returns all public routes + published media pages.
 */

import { MetadataRoute } from 'next'
import { db } from '@/lib/db'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nicmiller.photography'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [prints, media] = await Promise.all([
    db.print.findMany({ where: { published: true } }),
    db.media.findMany({ where: { status: 'published' }, select: { id: true, updatedAt: true } }),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE}/portfolio`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/prints`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/about`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/story`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/contact`, changeFrequency: 'yearly', priority: 0.5 },
  ]

  const printRoutes: MetadataRoute.Sitemap = prints.map((p) => ({
    url: `${BASE}/prints/${p.id}`,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const photoRoutes: MetadataRoute.Sitemap = media.map((m) => ({
    url: `${BASE}/portfolio/${m.id}`,
    lastModified: m.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...staticRoutes, ...printRoutes, ...photoRoutes]
}
