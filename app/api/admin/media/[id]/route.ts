/**
 * app/api/admin/media/[id]/route.ts
 *
 * GET    /api/admin/media/:id  → full media record + derivatives + crops
 * PATCH  /api/admin/media/:id  → update metadata, status, flags, category
 * DELETE /api/admin/media/:id  → soft-delete (set status='archived') or hard-delete
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { deleteMaster, deleteDerivatives } from '@/lib/blob'

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  caption: z.string().optional(),
  description: z.string().optional(),
  alt: z.string().optional(),
  captureDate: z.string().optional(),
  location: z.string().optional(),
  camera: z.string().optional(),
  categoryId: z.number().nullable().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  featured: z.boolean().optional(),
  printEnabled: z.boolean().optional(),
  homepage: z.boolean().optional(),
}).strict()

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const media = await db.media.findUnique({
    where: { id: Number(id) },
    include: { derivatives: true, crops: true, category: true },
  })

  if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Strip the private master key from the response
  const { masterKey: _mk, exif, ...rest } = media
  return NextResponse.json({ ...rest, hasExif: !!exif })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const media = await db.media.update({
    where: { id: Number(id) },
    data: parsed.data,
    include: {
      derivatives: { where: { format: 'webp', width: 960 }, take: 1 },
      category: true,
    },
  })

  return NextResponse.json({
    id: media.id,
    title: media.title,
    status: media.status,
    thumbUrl: media.derivatives[0]?.url ?? null,
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { searchParams } = request.nextUrl
  const hard = searchParams.get('hard') === 'true'

  const media = await db.media.findUnique({ where: { id: Number(id) } })
  if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (hard) {
    // Hard delete — remove from Blob and DB
    await Promise.all([
      deleteMaster(media.masterKey),
      deleteDerivatives(media.checksum),
    ])
    await db.media.delete({ where: { id: Number(id) } })
    return NextResponse.json({ ok: true, deleted: true })
  }

  // Soft delete — archive only
  await db.media.update({ where: { id: Number(id) }, data: { status: 'archived' } })
  return NextResponse.json({ ok: true, archived: true })
}
