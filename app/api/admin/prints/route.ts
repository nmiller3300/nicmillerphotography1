export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const rows = await db.$queryRawUnsafe<Array<Record<string,unknown>>>(`
      SELECT p.id, p.title, p.location, p.edition, p.paper,
             p.from_price as "fromPrice", p.featured, p.published,
             p.external_url as "externalUrl", p.media_id as "mediaId",
             d.url as "thumbUrl"
      FROM prints p
      LEFT JOIN media m ON m.id = p.media_id
      LEFT JOIN derivatives d ON d.media_id = m.id AND d.format = 'webp' AND d.width = 960
      ORDER BY p.id ASC
    `)
    return NextResponse.json(rows)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const items = Array.isArray(body) ? body : [body]

  try {
    for (const item of items as Array<Record<string,unknown>>) {
      // If no id, it's a new print — insert it
      if (!item.id || String(item.id).length > 10) {
        // New print (client-generated temp id is a large timestamp)
        const title     = String(item.title||'New Print').replace(/'/g,"''")
        const location  = item.location ? `'${String(item.location).replace(/'/g,"''")}'` : 'NULL'
        const fromPrice = item.fromPrice ? Number(item.fromPrice) : 'NULL'
        const featured  = item.featured  ? 'true' : 'false'
        const published = item.published ? 'true' : 'false'
        const extUrl    = item.externalUrl ? `'${String(item.externalUrl).replace(/'/g,"''")}'` : 'NULL'
        const mediaId   = item.mediaId || item.media_id ? Number(item.mediaId||item.media_id) : 'NULL'

        await db.$executeRawUnsafe(`
          INSERT INTO prints (title, location, from_price, featured, published, external_url, media_id)
          VALUES ('${title}', ${location}, ${fromPrice}, ${featured}, ${published}, ${extUrl}, ${mediaId})
        `)
      } else {
        // Existing print — update it
        const id = Number(item.id)
        const sets: string[] = []
        if (item.title       !== undefined) sets.push(`title = '${String(item.title).replace(/'/g,"''")}'`)
        if (item.location    !== undefined) sets.push(`location = ${item.location ? `'${String(item.location).replace(/'/g,"''")}'` : 'NULL'}`)
        if (item.fromPrice   !== undefined) sets.push(`from_price = ${item.fromPrice ? Number(item.fromPrice) : 'NULL'}`)
        if (item.featured    !== undefined) sets.push(`featured = ${!!item.featured}`)
        if (item.published   !== undefined) sets.push(`published = ${!!item.published}`)
        if (item.externalUrl !== undefined) sets.push(`external_url = ${item.externalUrl ? `'${String(item.externalUrl).replace(/'/g,"''")}'` : 'NULL'}`)
        const mediaId = item.mediaId || item.media_id
        if (mediaId !== undefined) sets.push(`media_id = ${mediaId ? Number(mediaId) : 'NULL'}`)
        if (sets.length > 0) {
          await db.$executeRawUnsafe(`UPDATE prints SET ${sets.join(', ')} WHERE id = ${id}`)
        }
      }
    }

    // Single-selection enforcement: only ONE print can be featured on the homepage.
    // If the incoming list marks any as featured, keep only the first such one.
    const featuredIncoming = items.filter((it) => (it as Record<string,unknown>).featured === true)
    if (featuredIncoming.length > 0) {
      // Resolve the id we want to keep featured (first featured item that has a real id)
      const keep = featuredIncoming.find((it) => {
        const id = (it as Record<string,unknown>).id
        return id && String(id).length <= 10
      }) as Record<string,unknown> | undefined
      if (keep && keep.id) {
        await db.$executeRawUnsafe(`UPDATE prints SET featured = false WHERE id != ${Number(keep.id)} AND featured = true`)
      } else {
        // Featured item was newly created (no stable id yet) — keep the most recent featured row
        await db.$executeRawUnsafe(`
          UPDATE prints SET featured = false
          WHERE featured = true AND id NOT IN (SELECT id FROM prints WHERE featured = true ORDER BY id DESC LIMIT 1)
        `)
      }
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Prints PATCH error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = Number(request.nextUrl.searchParams.get('id'))
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  try {
    await db.$executeRawUnsafe(`DELETE FROM prints WHERE id = ${id}`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
