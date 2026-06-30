export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

function esc(s: string) { return String(s).replace(/'/g, "''") }

export async function GET() {
  try {
    const rows = await db.$queryRawUnsafe<Array<Record<string,unknown>>>(
      `SELECT id, title, description, slug, canonical, og_media_id, indexable FROM seo_settings WHERE id = 1 LIMIT 1`
    )
    const seo = rows[0]
    return NextResponse.json(seo ? {
      id: seo.id, title: seo.title, description: seo.description,
      slug: seo.slug, canonical: seo.canonical, ogMediaId: seo.og_media_id, indexable: seo.indexable,
    } : {
      id: 1,
      title: 'Nic Miller Photography — Fine Art Nature & Landscape Prints',
      description: 'Limited-edition nature, wildlife and landscape prints by Nic Miller. Museum-quality archival paper, shipped worldwide.',
      slug: '/', canonical: process.env.NEXT_PUBLIC_SITE_URL ?? '', ogMediaId: null, indexable: true,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: Record<string,unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  try {
    const sets: string[] = []
    if (typeof body.title       === 'string')  sets.push(`title = '${esc(body.title)}'`)
    if (typeof body.description === 'string')  sets.push(`description = '${esc(body.description)}'`)
    if (typeof body.slug        === 'string')  sets.push(`slug = '${esc(body.slug)}'`)
    if (typeof body.canonical   === 'string')  sets.push(`canonical = '${esc(body.canonical)}'`)
    if (typeof body.indexable   === 'boolean') sets.push(`indexable = ${body.indexable}`)
    if (body.ogMediaId !== undefined) sets.push(`og_media_id = ${body.ogMediaId ? Number(body.ogMediaId) : 'NULL'}`)
    if (sets.length) {
      await db.$executeRawUnsafe(`
        INSERT INTO seo_settings (id, title, description, slug, canonical, indexable)
        VALUES (1, 'Nic Miller Photography', 'Fine art nature & landscape photography.', '/', '', true)
        ON CONFLICT (id) DO UPDATE SET ${sets.join(', ')}
      `)
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
