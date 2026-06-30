export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

function esc(s: string) { return String(s).replace(/'/g, "''") }

export async function GET() {
  try {
    const rows = await db.$queryRawUnsafe<Array<Record<string,unknown>>>(
      `SELECT email, instagram, facebook, copyright, store_url, image_quality, session_minutes FROM settings WHERE id = 1 LIMIT 1`
    )
    const s = rows[0]
    return NextResponse.json(s ? {
      email: s.email, instagram: s.instagram, facebook: s.facebook,
      copyright: s.copyright, storeUrl: s.store_url,
      imageQuality: s.image_quality, sessionMinutes: s.session_minutes,
    } : {
      email: 'nmiller3300@gmail.com', instagram: 'nicmiller.photography', facebook: 'nicmiller.photography',
      copyright: '© 2026 Nic Miller Photography. All rights reserved.',
      storeUrl: 'https://nicmillerphotography.pixieset.com', imageQuality: 82, sessionMinutes: 120,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string,unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    const sets: string[] = []
    if (typeof body.email      === 'string') sets.push(`email = '${esc(body.email)}'`)
    if (typeof body.instagram  === 'string') sets.push(`instagram = '${esc(body.instagram)}'`)
    if (typeof body.facebook   === 'string') sets.push(`facebook = '${esc(body.facebook)}'`)
    if (typeof body.copyright  === 'string') sets.push(`copyright = '${esc(body.copyright)}'`)
    if (typeof body.storeUrl   === 'string') sets.push(`store_url = '${esc(body.storeUrl)}'`)
    if (typeof body.imageQuality === 'number') sets.push(`image_quality = ${Math.min(100,Math.max(60,body.imageQuality))}`)
    if (typeof body.sessionMinutes === 'number') sets.push(`session_minutes = ${Math.min(1440,Math.max(5,body.sessionMinutes))}`)

    if (sets.length > 0) {
      await db.$executeRawUnsafe(`
        INSERT INTO settings (id, email, instagram, facebook, copyright, store_url, image_quality, session_minutes)
        VALUES (1, 'nmiller3300@gmail.com', 'nicmiller.photography', 'nicmiller.photography',
                '© 2026 Nic Miller Photography. All rights reserved.',
                'https://nicmillerphotography.pixieset.com', 82, 120)
        ON CONFLICT (id) DO UPDATE SET ${sets.join(', ')}
      `)
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
