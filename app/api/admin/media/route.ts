/**
 * app/api/admin/media/route.ts
 *
 * GET  /api/admin/media?status=&orientation=&category=&sort=newest|oldest&page=1
 * → paginated media list
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

const PAGE_SIZE = 48

export async function GET(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const status = searchParams.get('status')          // draft | published | archived | (all)
  const orientation = searchParams.get('orientation') // Landscape | Portrait | Square | Pano
  const categorySlug = searchParams.get('category')
  const sort = searchParams.get('sort') ?? 'newest'
  const featured = searchParams.get('featured')
  const printEnabled = searchParams.get('print')
  const homepage = searchParams.get('homepage')
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))

  const where: Prisma.MediaWhereInput = {}

  if (status === 'archived') {
    where.status = 'archived'
  } else if (status && status !== 'all') {
    where.status = status
    where.NOT = { status: 'archived' }
  } else if (!status) {
    // default: exclude archived
    where.NOT = { status: 'archived' }
  }

  if (orientation) where.orientation = orientation
  if (featured === 'true') where.featured = true
  if (printEnabled === 'true') where.printEnabled = true
  if (homepage === 'true') where.homepage = true

  if (categorySlug) {
    where.category = { slug: categorySlug }
  }

  const orderBy: Prisma.MediaOrderByWithRelationInput =
    sort === 'oldest'
      ? { createdAt: 'asc' }
      : { createdAt: 'desc' }

  const [total, items] = await Promise.all([
    db.media.count({ where }),
    db.media.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        derivatives: {
          where: { format: 'webp', width: 960 }, // thumbnail
          take: 1,
        },
        category: true,
      },
    }),
  ])

  return NextResponse.json({
    total,
    page,
    pageSize: PAGE_SIZE,
    pages: Math.ceil(total / PAGE_SIZE),
    items: items.map((m) => ({
      id: m.id,
      title: m.title,
      location: m.location,
      status: m.status,
      orientation: m.orientation,
      featured: m.featured,
      printEnabled: m.printEnabled,
      homepage: m.homepage,
      category: m.category?.name ?? null,
      thumbUrl: m.derivatives[0]?.url ?? null,
      createdAt: m.createdAt,
    })),
  })
}
