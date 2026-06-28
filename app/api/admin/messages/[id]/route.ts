export const runtime = 'nodejs'

/**
 * app/api/admin/messages/[id]/route.ts
 *
 * GET    /api/admin/messages/:id           → single message (marks New → Read)
 * PATCH  /api/admin/messages/:id  { status }  → update status
 *
 * GET    /api/admin/messages               → list by folder (status)
 *   ?status=New|Read|Replied|Archived
 *   ?page=1
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

const STATUS_VALUES = ['New', 'Read', 'Replied', 'Archived'] as const

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const message = await db.message.findUnique({ where: { id: Number(id) } })
  if (!message) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Auto-advance New → Read on open
  if (message.status === 'New') {
    await db.message.update({ where: { id: Number(id) }, data: { status: 'Read' } })
    message.status = 'Read'
  }

  return NextResponse.json(message)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const schema = z.object({ status: z.enum(STATUS_VALUES) })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const message = await db.message.update({
    where: { id: Number(id) },
    data: { status: parsed.data.status },
  })

  return NextResponse.json(message)
}
