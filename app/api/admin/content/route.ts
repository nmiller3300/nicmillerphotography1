/**
 * app/api/admin/content/route.ts
 *
 * GET  /api/admin/content?keys=heroEyebrow,heroTitle  → { heroEyebrow: '...', ... }
 * GET  /api/admin/content                              → all content rows
 *
 * PATCH /api/admin/content  { key: value, ... }
 *   Accepts any subset of the known content keys. Unknown keys are rejected.
 *
 * Known keys (from the localStorage spec):
 *   heroEyebrow, heroTitle, heroSubtitle, aboutBio, storyTitle, story
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

const KNOWN_KEYS = [
  'heroEyebrow',
  'heroTitle',
  'heroSubtitle',
  'aboutBio',
  'storyTitle',
  'story',      // stored as JSON array of paragraph strings
] as const

const patchSchema = z.object({
  heroEyebrow: z.string().optional(),
  heroTitle: z.string().optional(),
  heroSubtitle: z.string().optional(),
  aboutBio: z.string().optional(),
  storyTitle: z.string().optional(),
  story: z.array(z.string()).optional(),
  heroImgMediaId: z.number().nullable().optional(),
}).strict()

export async function GET(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const keysParam = request.nextUrl.searchParams.get('keys')
  const keysFilter = keysParam ? keysParam.split(',').filter(Boolean) : null

  const rows = await db.siteContent.findMany({
    where: keysFilter ? { key: { in: keysFilter } } : undefined,
  })

  const content = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  return NextResponse.json(content)
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  // Upsert each provided key
  const updates = Object.entries(parsed.data).filter(([, v]) => v !== undefined)

  await Promise.all(
    updates.map(([key, value]) =>
      db.siteContent.upsert({
        where: { key },
        create: { key, value: value as never },
        update: { value: value as never },
      }),
    ),
  )

  return NextResponse.json({ ok: true, updated: updates.map(([k]) => k) })
}

// Also export available keys for the admin panel to enumerate
export async function OPTIONS() {
  return NextResponse.json({ keys: KNOWN_KEYS })
}
