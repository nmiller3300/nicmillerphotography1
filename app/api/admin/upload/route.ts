export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { put } from '@vercel/blob'
import crypto from 'crypto'
import sharp from 'sharp'

const ALLOWED = new Set(['image/jpeg','image/png','image/webp','image/tiff','image/heic'])
const MAX_SIZE = 50 * 1024 * 1024

export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
    return NextResponse.json({ error: 'Blob storage not connected. Go to Vercel → Storage → Blob → Connect.', code: 'NO_BLOB_TOKEN' }, { status: 503 })
  }

  let formData: FormData
  try { formData = await request.formData() }
  catch { return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 }) }

  const file = formData.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: "Missing 'file' field" }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File exceeds 50 MB' }, { status: 413 })

  const buffer = Buffer.from(await file.arrayBuffer())

  // Checksum + dupe check
  const checksum = crypto.createHash('sha256').update(buffer).digest('hex')
  // Only block if a LIVE (non-archived) copy exists. Archived/soft-deleted
  // rows get cleaned up so the photo can be re-uploaded.
  const existing = await db.$queryRawUnsafe<Array<{id:number,status:string}>>(
    `SELECT id, status FROM media WHERE checksum = '${checksum}' LIMIT 1`
  )
  if (existing.length > 0) {
    if (existing[0].status === 'archived') {
      // Purge the stale archived row + its derivatives so the new upload is clean
      await db.$executeRawUnsafe(`DELETE FROM media WHERE id = ${existing[0].id}`).catch(() => {})
    } else {
      return NextResponse.json({ error: 'This photo is already in your library.', mediaId: existing[0].id }, { status: 409 })
    }
  }

  // Get image metadata
  const meta = await sharp(buffer).metadata()
  const width = meta.width ?? 0
  const height = meta.height ?? 0
  const aspect = height > 0 ? width / height : 1
  const orientation = aspect > 1.2 ? 'Landscape' : aspect < 0.85 ? 'Portrait' : 'Square'
  const fileSize = buffer.length

  // Generate just 2 derivatives: 960px WebP (thumb) and 1440px WebP (display)
  const [thumb, display] = await Promise.all([
    sharp(buffer).resize(960, null, { withoutEnlargement: true }).webp({ quality: 90 }).toBuffer(),
    sharp(buffer).resize(1440, null, { withoutEnlargement: true }).webp({ quality: 90 }).toBuffer(),
  ])

  // Upload master + derivatives to Blob
  const [masterBlob, thumbBlob, displayBlob] = await Promise.all([
    put(`masters/${checksum}`, buffer, { access: 'public', addRandomSuffix: false, contentType: file.type }),
    put(`photos/${checksum}/960.webp`, thumb, { access: 'public', addRandomSuffix: false, contentType: 'image/webp' }),
    put(`photos/${checksum}/1440.webp`, display, { access: 'public', addRandomSuffix: false, contentType: 'image/webp' }),
  ])

  // Save to DB
  const title = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
  
  await db.$executeRawUnsafe(
    `INSERT INTO media (title, checksum, width, height, aspect, orientation, file_size, master_key, status, featured, print_enabled, homepage, created_at, updated_at)
     VALUES ('${title.replace(/'/g, "''")}', '${checksum}', ${width}, ${height}, ${aspect}, '${orientation}', ${fileSize}, '${masterBlob.pathname}', 'draft', false, false, false, NOW(), NOW())`
  )

  const inserted = await db.$queryRawUnsafe<Array<{id:number}>>(
    `SELECT id FROM media WHERE checksum = '${checksum}' LIMIT 1`
  )
  const mediaId = inserted[0]?.id

  if (mediaId) {
    await db.$executeRawUnsafe(
      `INSERT INTO derivatives (media_id, format, width, url, bytes) VALUES
       (${mediaId}, 'webp', 960, '${thumbBlob.url}', ${thumb.length}),
       (${mediaId}, 'webp', 1440, '${displayBlob.url}', ${display.length})`
    )
  }

  return NextResponse.json({
    id: mediaId,
    title,
    status: 'draft',
    orientation,
    thumbUrl: thumbBlob.url,
  }, { status: 201 })
}
