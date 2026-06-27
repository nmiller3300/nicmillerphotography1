/**
 * app/api/admin/messages/route.ts
 *
 * GET /api/admin/messages?status=New&page=1
 * Returns paginated messages for the inbox folder view.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

const PAGE_SIZE = 25

export async function GET(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const status = searchParams.get('status')   // New | Read | Replied | Archived
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))

  const where = status ? { status } : {}

  const [total, items] = await Promise.all([
    db.message.count({ where }),
    db.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ])

  // Counts per folder for the sidebar badges
  const counts = await db.message.groupBy({
    by: ['status'],
    _count: { status: true },
  })

  const folderCounts = Object.fromEntries(
    counts.map((c) => [c.status, c._count.status]),
  )

  return NextResponse.json({
    total,
    page,
    pageSize: PAGE_SIZE,
    folderCounts,
    items,
  })
}
