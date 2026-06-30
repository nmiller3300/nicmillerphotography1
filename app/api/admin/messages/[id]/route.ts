export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{id:string}> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const msgId = parseInt(id)
  try {
    const rows = await db.$queryRawUnsafe<Array<Record<string,unknown>>>(
      `SELECT id, name, email, body, status, created_at FROM messages WHERE id = ${msgId} LIMIT 1`
    )
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (rows[0].status === 'New') {
      await db.$executeRawUnsafe(`UPDATE messages SET status = 'Read' WHERE id = ${msgId}`)
      rows[0].status = 'Read'
    }
    return NextResponse.json({ ...rows[0], createdAt: rows[0].created_at })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{id:string}> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const msgId = parseInt(id)
  let body: Record<string,unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const allowed = ['New','Read','Replied','Archived']
  if (typeof body.status !== 'string' || !allowed.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 422 })
  }
  try {
    await db.$executeRawUnsafe(`UPDATE messages SET status = '${body.status}' WHERE id = ${msgId}`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
