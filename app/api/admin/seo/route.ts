/**
 * app/api/admin/seo/route.ts
 *
 * GET   /api/admin/seo   → singleton SEO settings row
 * PATCH /api/admin/seo   → update SEO settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

const seoSchema = z.object({
  title: z.string().max(120).optional(),
  description: z.string().max(300).optional(),
  slug: z.string().optional(),
  canonical: z.string().url().optional(),
  ogMediaId: z.number().nullable().optional(),
  indexable: z.boolean().optional(),
})

export async function GET() {
  const seo = await db.seoSettings.findFirst()
  return NextResponse.json(
    seo ?? {
      id: 1,
      title: 'Nic Miller Photography — Fine Art Nature & Landscape Prints',
      description:
        'Limited-edition nature, wildlife and landscape prints by Nic Miller. Museum-quality archival paper, shipped worldwide.',
      slug: '/',
      canonical: process.env.NEXT_PUBLIC_SITE_URL ?? '',
      ogMediaId: null,
      indexable: true,
    },
  )
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = seoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const seo = await db.seoSettings.upsert({
    where: { id: 1 },
    create: { id: 1, ...parsed.data },
    update: parsed.data,
  })

  return NextResponse.json(seo)
}
