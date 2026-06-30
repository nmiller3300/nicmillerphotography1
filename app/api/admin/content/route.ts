export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

// Keys that store plain strings
const STRING_KEYS = ['heroEyebrow','heroTitle','heroSubtitle','aboutBio','storyTitle','portraitUrl','storyImageUrl']
// Keys that store JSON arrays
const ARRAY_KEYS = ['story']

export async function GET(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const keysParam = request.nextUrl.searchParams.get('keys')
    const keysFilter = keysParam ? keysParam.split(',').filter(Boolean) : null

    const rows = keysFilter
      ? await db.$queryRawUnsafe<Array<{key:string,value:string}>>(
          `SELECT key, value::text as value FROM site_content WHERE key IN (${keysFilter.map(k=>`'${k.replace(/'/g,"''")}'`).join(',')})`
        )
      : await db.$queryRawUnsafe<Array<{key:string,value:string}>>(`SELECT key, value::text as value FROM site_content`)

    const content: Record<string, unknown> = {}
    for (const r of rows) {
      const raw = r.value
      if (ARRAY_KEYS.includes(r.key)) {
        try { content[r.key] = JSON.parse(raw) } catch { content[r.key] = [] }
      } else {
        // strip surrounding quotes from JSON-stored strings
        try { content[r.key] = JSON.parse(raw) } catch { content[r.key] = raw?.replace(/^"|"$/g,'') }
      }
    }
    return NextResponse.json(content)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    const updated: string[] = []
    for (const [key, value] of Object.entries(body)) {
      if (value === undefined) continue
      if (!STRING_KEYS.includes(key) && !ARRAY_KEYS.includes(key)) continue // ignore unknown keys silently

      // Store as JSON text so both strings and arrays round-trip cleanly
      const jsonValue = JSON.stringify(value).replace(/'/g, "''")
      await db.$executeRawUnsafe(`
        INSERT INTO site_content (key, value) VALUES ('${key}', '${jsonValue}')
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `)
      updated.push(key)
    }
    return NextResponse.json({ ok: true, updated })
  } catch (err) {
    console.error('Content PATCH error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
