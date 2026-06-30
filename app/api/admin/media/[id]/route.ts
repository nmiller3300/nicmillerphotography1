export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { deleteMaster, deleteDerivatives } from '@/lib/blob'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  try {
    const rows = await db.$queryRawUnsafe<Array<Record<string,unknown>>>(`
      SELECT m.id, m.title, m.caption, m.description, m.alt, m.location, m.camera,
             m.capture_date, m.status, m.orientation, m.featured,
             m.print_enabled, m.homepage, m.created_at,
             d.url as thumb_url
      FROM media m
      LEFT JOIN derivatives d ON d.media_id = m.id AND d.format = 'webp' AND d.width = 960
      WHERE m.id = ${parseInt(id)}
      LIMIT 1
    `)
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(rows[0])
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const mediaId = parseInt(id)

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    // Pull known fields — ignore extras like isPortrait, isStoryBanner (handled below)
    const title       = typeof body.title       === 'string' ? body.title.replace(/'/g,"''")       : null
    const caption     = typeof body.caption     === 'string' ? body.caption.replace(/'/g,"''")     : null
    const description = typeof body.description === 'string' ? body.description.replace(/'/g,"''") : null
    const alt         = typeof body.alt         === 'string' ? body.alt.replace(/'/g,"''")         : null
    const location    = typeof body.location    === 'string' ? body.location.replace(/'/g,"''")    : null
    const camera      = typeof body.camera      === 'string' ? body.camera.replace(/'/g,"''")      : null
    const captureDate = typeof body.captureDate === 'string' ? body.captureDate.replace(/'/g,"''") : null
    const status      = ['draft','published','archived'].includes(body.status as string) ? body.status as string : null
    const featured    = typeof body.featured    === 'boolean' ? body.featured    : null
    const printEnabled= typeof body.printEnabled=== 'boolean' ? body.printEnabled: null
    const homepage    = typeof body.homepage    === 'boolean' ? body.homepage    : null

    // Build SET clause
    const sets: string[] = ['updated_at = NOW()']
    if (title        !== null) sets.push(`title = '${title}'`)
    if (caption      !== null) sets.push(`caption = '${caption}'`)
    if (description  !== null) sets.push(`description = '${description}'`)
    if (alt          !== null) sets.push(`alt = '${alt}'`)
    if (location     !== null) sets.push(`location = '${location}'`)
    if (camera       !== null) sets.push(`camera = '${camera}'`)
    if (captureDate  !== null) sets.push(`capture_date = '${captureDate}'`)
    if (status       !== null) sets.push(`status = '${status}'`)
    if (featured     !== null) sets.push(`featured = ${featured}`)
    if (printEnabled !== null) sets.push(`print_enabled = ${printEnabled}`)
    if (homepage     !== null) sets.push(`homepage = ${homepage}`)

    await db.$executeRawUnsafe(`UPDATE media SET ${sets.join(', ')} WHERE id = ${mediaId}`)

    // Single-selection enforcement: only ONE photo can be the homepage hero.
    // If this photo was just set as hero, clear the flag on every other photo.
    if (homepage === true) {
      await db.$executeRawUnsafe(`UPDATE media SET homepage = false WHERE id != ${mediaId} AND homepage = true`)
    }

    // Handle portrait/story banner flags
    if (body.isPortrait === true) {
      const thumbRows = await db.$queryRawUnsafe<Array<{url:string}>>(`
        SELECT url FROM derivatives WHERE media_id = ${mediaId} AND format = 'webp' AND width = 960 LIMIT 1
      `)
      const url = thumbRows[0]?.url
      if (url) {
        await db.$executeRawUnsafe(`
          INSERT INTO site_content (key, value) VALUES ('portraitUrl', '"${url}"')
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `)
      }
    }
    if (body.isStoryBanner === true) {
      const dispRows = await db.$queryRawUnsafe<Array<{url:string}>>(`
        SELECT url FROM derivatives WHERE media_id = ${mediaId} AND format = 'webp' ORDER BY width DESC LIMIT 1
      `)
      const url = dispRows[0]?.url
      if (url) {
        await db.$executeRawUnsafe(`
          INSERT INTO site_content (key, value) VALUES ('storyImageUrl', '"${url}"')
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `)
      }
    }

    // Return the thumb URL for the media grid
    const thumbRows = await db.$queryRawUnsafe<Array<{url:string}>>(`
      SELECT url FROM derivatives WHERE media_id = ${mediaId} AND format = 'webp' AND width = 960 LIMIT 1
    `)

    return NextResponse.json({ id: mediaId, status: body.status, thumbUrl: thumbRows[0]?.url ?? null })
  } catch (err) {
    console.error('PATCH media error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const mediaId = parseInt(id)

  try {
    const hard = request.nextUrl.searchParams.get('hard') === 'true'
    const rows = await db.$queryRawUnsafe<Array<{master_key:string,checksum:string}>>(
      `SELECT master_key, checksum FROM media WHERE id = ${mediaId} LIMIT 1`
    )
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (hard) {
      await Promise.allSettled([
        deleteMaster(rows[0].master_key),
        deleteDerivatives(rows[0].checksum),
      ])
      await db.$executeRawUnsafe(`DELETE FROM media WHERE id = ${mediaId}`)
      return NextResponse.json({ ok: true, deleted: true })
    }

    await db.$executeRawUnsafe(`UPDATE media SET status = 'archived' WHERE id = ${mediaId}`)
    return NextResponse.json({ ok: true, archived: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
