export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

const PAGE_SIZE = 48

export async function GET(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = request.nextUrl
    const filter = searchParams.get('status') ?? 'all'
    const sort   = searchParams.get('sort') ?? 'newest'
    const page   = Math.max(1, Number(searchParams.get('page') ?? '1'))
    const offset = (page - 1) * PAGE_SIZE
    const order  = sort === 'oldest' ? 'ASC' : 'DESC'
    const orderBy = sort === 'manual' ? 'm.sort_order ASC, m.created_at DESC' : `m.created_at ${order}`

    // Build WHERE clause with raw SQL to avoid Prisma type issues
    let where = `m.status != 'archived'`
    if (filter === 'published') where = `m.status = 'published'`
    else if (filter === 'drafts') where = `m.status = 'draft'`
    else if (filter === 'archived') where = `m.status = 'archived'`
    else if (filter === 'featured') where = `m.featured = true AND m.status != 'archived'`
    else if (filter === 'print') where = `m.print_enabled = true AND m.status != 'archived'`
    else if (filter === 'homepage') where = `m.homepage = true AND m.status != 'archived'`
    else if (filter === 'landscape') where = `m.orientation = 'Landscape' AND m.status != 'archived'`
    else if (filter === 'portrait') where = `m.orientation = 'Portrait' AND m.status != 'archived'`
    else if (filter === 'pano') where = `m.orientation = 'Pano' AND m.status != 'archived'`

    const [countResult, items] = await Promise.all([
      db.$queryRawUnsafe<[{count: bigint}]>(
        `SELECT COUNT(*) as count FROM media m WHERE ${where}`
      ),
      db.$queryRawUnsafe<Array<{
        id: number; title: string; location: string|null; status: string
        orientation: string|null; featured: boolean; print_enabled: boolean
        homepage: boolean; created_at: Date; thumb_url: string|null
      }>>(
        `SELECT m.id, m.title, m.location, m.status, m.orientation,
                m.featured, m.print_enabled, m.homepage, m.created_at,
                d.url as thumb_url
         FROM media m
         LEFT JOIN derivatives d ON d.media_id = m.id
           AND d.format = 'webp' AND d.width = 960
         WHERE ${where}
         ORDER BY ${orderBy}
         LIMIT ${PAGE_SIZE} OFFSET ${offset}`
      )
    ])

    const total = Number(countResult[0]?.count ?? 0)

    return NextResponse.json({
      total,
      page,
      pageSize: PAGE_SIZE,
      pages: Math.ceil(total / PAGE_SIZE),
      items: items.map(m => ({
        id:           m.id,
        title:        m.title,
        location:     m.location,
        status:       m.status,
        orientation:  m.orientation,
        featured:     m.featured,
        printEnabled: m.print_enabled,
        homepage:     m.homepage,
        thumbUrl:     m.thumb_url,
        createdAt:    m.created_at,
      })),
    })
  } catch (err) {
    console.error('Media list error:', err)
    return NextResponse.json({ error: String(err), items: [], total: 0 }, { status: 500 })
  }
}
