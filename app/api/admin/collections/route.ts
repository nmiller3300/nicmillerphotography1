export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'series'
}
function esc(s: string) { return s.replace(/'/g, "''") }

// GET — all collections with item count + cover url (admin sees all; public filters published)
export async function GET(request: NextRequest) {
  const publicOnly = request.nextUrl.searchParams.get('public') === '1'
  try {
    const rows = await db.$queryRawUnsafe<Array<Record<string, unknown>>>(`
      SELECT c.id, c.title, c.slug, c.description, c.published, c.homepage,
             c."order" as "order", c.cover_media_id as "coverMediaId",
             cov.url as "coverUrl",
             COUNT(ci.media_id)::int as "itemCount"
      FROM collections c
      LEFT JOIN derivatives cov ON cov.media_id = c.cover_media_id AND cov.format='webp' AND cov.width=960
      LEFT JOIN collection_items ci ON ci.collection_id = c.id
      ${publicOnly ? 'WHERE c.published = true' : ''}
      GROUP BY c.id, cov.url
      ORDER BY c."order" ASC, c.id ASC
    `)
    return NextResponse.json(rows)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// POST — create a new collection
export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const title = esc(String(body.title || 'New Series'))
  const slug = esc(slugify(String(body.title || 'series')) + '-' + Date.now().toString(36).slice(-4))
  try {
    await db.$executeRawUnsafe(`INSERT INTO collections (title, slug, published, homepage, "order") VALUES ('${title}', '${slug}', false, false, (SELECT COALESCE(MAX("order"),0)+1 FROM collections))`)
    const rows = await db.$queryRawUnsafe<Array<{id:number}>>(`SELECT id FROM collections WHERE slug = '${slug}' LIMIT 1`)
    return NextResponse.json({ id: rows[0]?.id, slug })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// PATCH — update collection meta and/or its ordered items
export async function PATCH(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const id = Number(body.id)
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  try {
    const sets: string[] = []
    if (typeof body.title === 'string')        sets.push(`title = '${esc(body.title)}'`)
    if (typeof body.description === 'string')   sets.push(`description = '${esc(body.description)}'`)
    if (typeof body.published === 'boolean')    sets.push(`published = ${body.published}`)
    if (typeof body.homepage === 'boolean')     sets.push(`homepage = ${body.homepage}`)
    if (body.coverMediaId !== undefined)        sets.push(`cover_media_id = ${body.coverMediaId ? Number(body.coverMediaId) : 'NULL'}`)
    if (sets.length) await db.$executeRawUnsafe(`UPDATE collections SET ${sets.join(', ')} WHERE id = ${id}`)

    // Replace ordered items if provided
    if (Array.isArray(body.items)) {
      await db.$executeRawUnsafe(`DELETE FROM collection_items WHERE collection_id = ${id}`)
      const items = body.items as number[]
      if (items.length) {
        const values = items.map((mid, i) => `(${id}, ${Number(mid)}, ${i})`).join(', ')
        await db.$executeRawUnsafe(`INSERT INTO collection_items (collection_id, media_id, "order") VALUES ${values}`)
      }
      // Auto-set cover to first item if none chosen
      if (body.coverMediaId === undefined && items.length) {
        await db.$executeRawUnsafe(`UPDATE collections SET cover_media_id = ${Number(items[0])} WHERE id = ${id} AND cover_media_id IS NULL`)
      }
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// DELETE — remove a collection (items cascade)
export async function DELETE(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = Number(request.nextUrl.searchParams.get('id'))
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  try {
    await db.$executeRawUnsafe(`DELETE FROM collections WHERE id = ${id}`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
