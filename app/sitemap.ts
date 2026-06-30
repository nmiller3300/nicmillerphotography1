export const dynamic = 'force-dynamic'

import { MetadataRoute } from 'next'
import { db } from '@/lib/db'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nicmiller.photography'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE}/portfolio`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/prints`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/about`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/story`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/contact`, changeFrequency: 'yearly', priority: 0.5 },
  ]

  try {
    const [prints, media, collections] = await Promise.all([
      db.$queryRawUnsafe<Array<{id:number}>>(`SELECT id FROM prints WHERE published = true`),
      db.$queryRawUnsafe<Array<{id:number,updated_at:Date}>>(`SELECT id, updated_at FROM media WHERE status = 'published'`),
      db.$queryRawUnsafe<Array<{slug:string}>>(`SELECT slug FROM collections WHERE published = true AND slug IS NOT NULL`),
    ])

    const printRoutes: MetadataRoute.Sitemap = prints.map((p) => ({
      url: `${BASE}/prints/${p.id}`, changeFrequency: 'weekly' as const, priority: 0.8,
    }))
    const photoRoutes: MetadataRoute.Sitemap = media.map((m) => ({
      url: `${BASE}/photos/${m.id}`, lastModified: m.updated_at, changeFrequency: 'monthly' as const, priority: 0.7,
    }))
    const collectionRoutes: MetadataRoute.Sitemap = collections.map((c) => ({
      url: `${BASE}/collections/${c.slug}`, changeFrequency: 'monthly' as const, priority: 0.7,
    }))

    return [...staticRoutes, ...printRoutes, ...photoRoutes, ...collectionRoutes]
  } catch {
    // DB unreachable at build time — return static routes so the build never fails
    return staticRoutes
  }
}
