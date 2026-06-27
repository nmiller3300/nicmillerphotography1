/**
 * app/api/admin/prints/route.ts
 *
 * GET   /api/admin/prints           → all print listings
 * POST  /api/admin/prints           → create a new print listing
 * PATCH /api/admin/prints           → { id, ...fields } → update
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

const sizeSchema = z.object({
  label: z.string(),
  price: z.number().positive(),
})

const printSchema = z.object({
  id: z.number().optional(),                    // required for PATCH
  mediaId: z.number().nullable().optional(),
  title: z.string().min(1),
  location: z.string().optional(),
  edition: z.string().optional(),
  paper: z.string().optional(),
  fromPrice: z.number().positive().optional(),
  sizes: z.array(sizeSchema).optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  externalUrl: z.string().url().nullable().optional(),
})

export async function GET() {
  const prints = await db.print.findMany({
    orderBy: { id: 'asc' },
    include: {
      media: {
        include: { derivatives: { where: { format: 'webp', width: 960 }, take: 1 } },
      },
    },
  })

  return NextResponse.json(
    prints.map((p) => ({
      ...p,
      thumbUrl: p.media?.derivatives[0]?.url ?? null,
    })),
  )
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = printSchema.omit({ id: true }).safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const print = await db.print.create({ data: parsed.data as never })
  return NextResponse.json(print, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Support both single { id, ...fields } and array [{ id, ...fields }, ...] bulk
  const items = Array.isArray(body) ? body : [body]
  const results = await Promise.all(
    items.map(async (item) => {
      const parsed = printSchema.safeParse(item)
      if (!parsed.success || !parsed.data.id) return { error: 'Invalid item' }
      const { id, ...data } = parsed.data
      return db.print.update({ where: { id }, data: data as never })
    }),
  )

  return NextResponse.json(results)
}

export async function DELETE(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = Number(request.nextUrl.searchParams.get('id'))
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await db.print.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
