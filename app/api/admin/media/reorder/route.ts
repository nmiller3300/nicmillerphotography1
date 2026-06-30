export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

// PATCH — body: { order: number[] } — sets sort_order by array position
export async function PATCH(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { order?: number[] }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!Array.isArray(body.order) || body.order.length === 0) {
    return NextResponse.json({ error: 'order array required' }, { status: 400 })
  }

  try {
    // Build a single CASE statement to update all in one query
    const ids = body.order.map(n => Number(n)).filter(n => !isNaN(n))
    const cases = ids.map((id, i) => `WHEN ${id} THEN ${i}`).join(' ')
    await db.$executeRawUnsafe(`UPDATE media SET sort_order = CASE id ${cases} ELSE sort_order END WHERE id IN (${ids.join(',')})`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
