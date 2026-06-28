export const runtime = 'nodejs'

/**
 * app/api/admin/settings/route.ts
 *
 * GET   /api/admin/settings   → singleton Settings row
 * PATCH /api/admin/settings   → update settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

const settingsSchema = z.object({
  email: z.string().email().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  copyright: z.string().optional(),
  storeUrl: z.string().url().nullable().optional(),
  imageQuality: z.number().int().min(60).max(100).optional(),
  sessionMinutes: z.number().int().min(5).max(1440).optional(),
})

const DEFAULTS = {
  email: 'nmiller3300@gmail.com',
  instagram: 'nicmiller.photography',
  facebook: 'nicmiller.photography',
  copyright: '© 2026 Nic Miller Photography. All rights reserved.',
  storeUrl: 'https://nicmillerphotography.pixieset.com',
  imageQuality: 82,
  sessionMinutes: 120,
}

export async function GET() {
  const settings = await db.settings.findFirst()
  return NextResponse.json(settings ?? { id: 1, ...DEFAULTS })
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = settingsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const settings = await db.settings.upsert({
    where: { id: 1 },
    create: { id: 1, ...DEFAULTS, ...parsed.data },
    update: parsed.data,
  })

  return NextResponse.json(settings)
}
