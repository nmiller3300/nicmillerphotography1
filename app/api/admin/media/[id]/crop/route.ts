export const runtime = 'nodejs'

/**
 * app/api/admin/media/[id]/crop/route.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

const VALID_CONTEXTS = [
  'desktop_hero',
  'mobile_hero',
  'portfolio_card',
  'collection_cover',
  'recent_thumb',
  'print_card',
  'social',
] as const

const cropSchema = z.object({
  context: z.enum(VALID_CONTEXTS),
  focalX: z.number().min(0).max(100).default(50),
  focalY: z.number().min(0).max(100).default(50),
  zoom: z.number().min(100).max(400).default(100),
  cropBox: z
    .object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    })
    .nullable()
    .optional(),
})

export async function POST(
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

  const parsed = cropSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { context, focalX, focalY, zoom, cropBox } = parsed.data

  // Prisma requires Prisma.JsonNull to explicitly set a nullable JSON field to null
  const cropBoxValue: Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined =
    cropBox === null ? Prisma.JsonNull : (cropBox as Prisma.InputJsonValue | undefined)

  const crop = await db.crop.upsert({
    where: { mediaId_context: { mediaId: Number(id), context } },
    create: { mediaId: Number(id), context, focalX, focalY, zoom, cropBox: cropBoxValue },
    update: { focalX, focalY, zoom, cropBox: cropBoxValue },
  })

  return NextResponse.json(crop)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const context = request.nextUrl.searchParams.get('context')

  if (!context || !VALID_CONTEXTS.includes(context as typeof VALID_CONTEXTS[number])) {
    return NextResponse.json({ error: 'Valid context required' }, { status: 400 })
  }

  await db.crop.deleteMany({ where: { mediaId: Number(id), context } })
  return NextResponse.json({ ok: true, reset: context })
}
