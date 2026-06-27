/**
 * app/api/admin/upload/route.ts
 *
 * POST multipart/form-data with a 'file' field.
 *
 * Pipeline (matches the brief exactly):
 *   1. Read buffer, compute sha256 — reject exact duplicates
 *   2. Store untouched master in private Blob (never modified, never served)
 *   3. Extract metadata (width, height, aspect, orientation, EXIF)
 *   4. Generate web derivatives: AVIF + WebP + JPEG at [480,960,1440,2048,2560]
 *      — skip widths ≥ original width (no upscaling)
 *      — convert to sRGB, embed sRGB ICC profile, strip GPS
 *   5. Upload each derivative to public Blob (content-addressed by checksum)
 *   6. Write Media + Derivative rows to DB
 *   7. Return the new Media record with derivatives
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { putMaster, putDerivative } from '@/lib/blob'
import { processPipeline } from '@/lib/image-pipeline'

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/tiff'])
const MAX_FILE_SIZE = 50 * 1024 * 1024  // 50 MB

export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ── Parse multipart form ─────────────────────────────────────────────────
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing 'file' field" }, { status: 400 })
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${file.type}. Use JPEG, PNG, WebP, or TIFF.` },
      { status: 415 },
    )
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File exceeds 50 MB limit' }, { status: 413 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  // ── 1. Checksum + duplicate check ─────────────────────────────────────────
  const { computeChecksum } = await import('@/lib/image-pipeline')
  const checksum = computeChecksum(buffer)

  const existing = await db.media.findUnique({ where: { checksum } })
  if (existing) {
    return NextResponse.json(
      { error: 'Duplicate: this exact file is already in the library.', mediaId: existing.id },
      { status: 409 },
    )
  }

  // ── 2. Upload master to private Blob ──────────────────────────────────────
  const masterKey = await putMaster(checksum, buffer, file.type)

  // ── 3 & 4. Extract metadata + generate derivatives ────────────────────────
  const settings = await db.settings.findFirst()
  const jpegQuality = settings?.imageQuality ?? 82

  const { meta, derivatives } = await processPipeline(buffer, jpegQuality)

  // ── 5. Upload derivatives to public Blob ──────────────────────────────────
  const derivativeUploads = await Promise.all(
    derivatives.map(async (d) => {
      const url = await putDerivative(checksum, d.format, d.width, d.buffer)
      return { format: d.format, width: d.width, url, bytes: d.bytes }
    }),
  )

  // ── 6. Write to DB ────────────────────────────────────────────────────────
  const filename = file.name.replace(/\.[^.]+$/, '')  // strip extension

  const media = await db.media.create({
    data: {
      title: filename,
      checksum,
      width: meta.width,
      height: meta.height,
      aspect: meta.aspect,
      orientation: meta.orientation,
      fileSize: BigInt(meta.fileSize),
      colorProfile: meta.colorProfile,
      exif: meta.exif as never,
      masterKey,
      status: 'draft',
      derivatives: {
        create: derivativeUploads,
      },
    },
    include: { derivatives: true },
  })

  // ── 7. Return ──────────────────────────────────────────────────────────────
  return NextResponse.json(
    {
      id: media.id,
      title: media.title,
      status: media.status,
      orientation: media.orientation,
      width: media.width,
      height: media.height,
      derivatives: media.derivatives,
    },
    { status: 201 },
  )
}

// Disable Next.js default body parsing — we handle multipart ourselves
export const config = { api: { bodyParser: false } }
