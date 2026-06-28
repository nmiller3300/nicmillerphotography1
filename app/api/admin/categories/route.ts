export const runtime = 'nodejs'

/**
 * app/api/admin/categories/route.ts
 *
 * GET    /api/admin/categories            → all categories ordered
 * POST   /api/admin/categories            → { name } → create
 * PATCH  /api/admin/categories/:id        → { name, order } → update
 * DELETE /api/admin/categories/:id        → delete (only if no media attached)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function GET() {
  const categories = await db.category.findMany({ orderBy: { order: 'asc' } })
  return NextResponse.json(categories)
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const schema = z.object({ name: z.string().min(1).max(64) })
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const slug = slugify(parsed.data.name)
  const maxOrder = await db.category.aggregate({ _max: { order: true } })
  const order = (maxOrder._max.order ?? 0) + 1

  try {
    const cat = await db.category.create({ data: { name: parsed.data.name, slug, order } })
    return NextResponse.json(cat, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Category name or slug already exists' }, { status: 409 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const schema = z.object({
    id: z.number(),
    name: z.string().min(1).max(64).optional(),
    order: z.number().optional(),
  })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { id, ...data } = parsed.data
  const update: { name?: string; slug?: string; order?: number } = {}
  if (data.name) { update.name = data.name; update.slug = slugify(data.name) }
  if (data.order !== undefined) update.order = data.order

  const cat = await db.category.update({ where: { id }, data: update })
  return NextResponse.json(cat)
}

export async function DELETE(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = Number(request.nextUrl.searchParams.get('id'))
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const mediaCount = await db.media.count({ where: { categoryId: id } })
  if (mediaCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${mediaCount} photo(s) use this category. Reassign them first.` },
      { status: 409 },
    )
  }

  await db.category.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
