import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { putMaster, putDerivative } from '@/lib/blob'
import { computeChecksum, extractMeta, processPipeline } from '@/lib/image-pipeline'

const ALLOWED_MIME = new Set(['image/jpeg','image/png','image/webp','image/tiff'])
const MAX_FILE_SIZE = 50 * 1024 * 1024

export const config = { api: { bodyParser: false } }

export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({
      error: 'Blob storage not connected. Go to Vercel → Storage → Create Database → Blob, then redeploy.',
      code: 'NO_BLOB_TOKEN',
    }, { status: 503 })
  }

  let formData: FormData
  try { formData = await request.formData() }
  catch { return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 }) }

  const file = formData.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: "Missing 'file' field" }, { status: 400 })
  if (!ALLOWED_MIME.has(file.type)) return NextResponse.json({ error: `Unsupported type: ${file.type}` }, { status: 415 })
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'File exceeds 50MB' }, { status: 413 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const checksum = computeChecksum(buffer)

  const existing = await db.media.findUnique({ where: { checksum } })
  if (existing) return NextResponse.json({ error: 'Duplicate file already in library.', mediaId: existing.id }, { status: 409 })

  try {
    const masterKey = await putMaster(checksum, buffer, file.type)
    const settings  = await db.settings.findFirst()
    const quality   = settings?.imageQuality ?? 82
    const { meta, derivatives } = await processPipeline(buffer, quality)

    const derivativeUploads = await Promise.all(
      derivatives.map(async d => {
        const url = await putDerivative(checksum, d.format, d.width, d.buffer)
        return { format: d.format, width: d.width, url, bytes: d.bytes }
      })
    )

    const media = await db.media.create({
      data: {
        title:        file.name.replace(/\.[^.]+$/, ''),
        checksum,
        width:        meta.width,
        height:       meta.height,
        aspect:       meta.aspect,
        orientation:  meta.orientation,
        fileSize:     BigInt(meta.fileSize),
        colorProfile: meta.colorProfile,
        exif:         meta.exif as never,
        masterKey,
        status:       'draft',
        derivatives:  { create: derivativeUploads },
      },
      include: { derivatives: true },
    })

    return NextResponse.json({
      id:           media.id,
      title:        media.title,
      status:       media.status,
      orientation:  media.orientation,
      width:        meta.width,
      height:       meta.height,
      thumbUrl:     derivativeUploads.find(d => d.format === 'webp')?.url ?? derivativeUploads[0]?.url ?? null,
      derivatives:  media.derivatives,
    }, { status: 201 })

  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
