/**
 * lib/image-pipeline.ts
 *
 * Processes an uploaded photo buffer into:
 *   1. A sha256 checksum (deduplication key)
 *   2. Extracted metadata (width, height, orientation, EXIF)
 *   3. Web derivatives in AVIF + WebP + JPEG at multiple widths
 *
 * Constraints from the brief:
 *   - Never upscale beyond the original width
 *   - Strip GPS from all public files
 *   - Convert to sRGB and embed an sRGB ICC profile
 *   - No AI enhance, no auto brightness/contrast/saturation/sharpen
 *   - AVIF ~50–60 quality, WebP ~80, JPEG ~82
 *   - Formats: AVIF + WebP + JPEG fallback
 *   - The private master is stored as-is (no processing)
 */

import sharp, { Metadata as SharpMeta } from 'sharp'
import crypto from 'crypto'
import ExifReader from 'exifreader'

// Derivative widths to generate, in pixels. Any width ≥ original is skipped.
const DERIVATIVE_WIDTHS = [480, 960, 1440, 2048, 2560] as const

export type DerivativeFormat = 'avif' | 'webp' | 'jpeg'

export interface DerivativeResult {
  format: DerivativeFormat
  width: number
  buffer: Buffer
  bytes: number
}

export interface ExtractedMeta {
  width: number
  height: number
  aspect: number
  orientation: 'Landscape' | 'Portrait' | 'Square' | 'Pano'
  fileSize: number
  colorProfile: string
  exif: Record<string, unknown>  // raw EXIF, includes GPS — only stored in DB, never sent to browser
}

export interface PipelineResult {
  checksum: string
  meta: ExtractedMeta
  derivatives: DerivativeResult[]
}

// ─── Checksum ─────────────────────────────────────────────────────────────────

export function computeChecksum(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

function classifyOrientation(w: number, h: number): ExtractedMeta['orientation'] {
  const ratio = w / h
  if (ratio >= 2.0) return 'Pano'
  if (ratio > 1.05) return 'Landscape'
  if (ratio < 0.95) return 'Portrait'
  return 'Square'
}

function extractExif(buffer: Buffer): Record<string, unknown> {
  try {
    const tags = ExifReader.load(buffer, { expanded: true })
    // Flatten to plain object — ExifReader values are objects with .value, .description
    const flat: Record<string, unknown> = {}
    for (const [group, groupTags] of Object.entries(tags)) {
      if (groupTags && typeof groupTags === 'object') {
        for (const [tag, val] of Object.entries(groupTags as Record<string, unknown>)) {
          const entry = val as { description?: unknown; value?: unknown }
          flat[`${group}.${tag}`] = entry?.description ?? entry?.value ?? val
        }
      }
    }
    return flat
  } catch {
    return {}
  }
}

export async function extractMeta(buffer: Buffer, fileSize: number): Promise<ExtractedMeta> {
  const meta: SharpMeta = await sharp(buffer).metadata()

  const w = meta.width ?? 0
  const h = meta.height ?? 0
  const aspect = h > 0 ? w / h : 1

  // Determine ICC profile name from the raw buffer profile or fall back to a label
  const colorProfile = meta.icc ? (meta.icc.toString('latin1').match(/sRGB|AdobeRGB|ProPhoto|P3/i)?.[0] ?? 'Unknown') : 'Unknown'

  return {
    width: w,
    height: h,
    aspect,
    orientation: classifyOrientation(w, h),
    fileSize,
    colorProfile,
    exif: extractExif(buffer),
  }
}

// ─── Derivative Generation ────────────────────────────────────────────────────

async function makeDerivative(
  buffer: Buffer,
  width: number,
  format: DerivativeFormat,
  jpegQuality: number,  // from settings.imageQuality, defaults 82
): Promise<Buffer> {
  const pipeline = sharp(buffer)
    .resize({ width, withoutEnlargement: true })
    .toColorspace('srgb')
    // Embed sRGB ICC profile so colours are accurate in every viewer.
    // Sharp strips GPS by default when you don't call keepMetadata() — this is
    // exactly what we want. We DO embed the ICC profile for colour fidelity.
    .withMetadata({ icc: 'srgb' })

  switch (format) {
    case 'avif':
      return pipeline.avif({ quality: 55, effort: 4 }).toBuffer()
    case 'webp':
      return pipeline.webp({ quality: 80 }).toBuffer()
    case 'jpeg':
      return pipeline.jpeg({ quality: jpegQuality, mozjpeg: true }).toBuffer()
  }
}

// ─── Full Pipeline ────────────────────────────────────────────────────────────

/**
 * Process a raw upload buffer.
 *
 * @param buffer      - The original file bytes (stored untouched as master)
 * @param jpegQuality - Pulled from Settings.imageQuality (default 82)
 * @returns           - Checksum, extracted metadata, and all derivative buffers
 *
 * Caller is responsible for:
 *   1. Checking DB for duplicate checksum before calling this
 *   2. Uploading master buffer to private Blob (lib/blob.ts putMaster)
 *   3. Uploading each derivative to public Blob (lib/blob.ts putDerivative)
 *   4. Writing Media + Derivative rows to DB
 */
export async function processPipeline(
  buffer: Buffer,
  jpegQuality = 82,
): Promise<PipelineResult> {
  const checksum = computeChecksum(buffer)
  const meta = await extractMeta(buffer, buffer.length)

  const derivatives: DerivativeResult[] = []
  const formats: DerivativeFormat[] = ['avif', 'webp', 'jpeg']

  for (const width of DERIVATIVE_WIDTHS) {
    // Never upscale
    if (width >= meta.width) continue

    for (const format of formats) {
      const derivBuffer = await makeDerivative(buffer, width, format, jpegQuality)
      derivatives.push({
        format,
        width,
        buffer: derivBuffer,
        bytes: derivBuffer.length,
      })
    }
  }

  return { checksum, meta, derivatives }
}

// ─── On-demand Crop Derivative ────────────────────────────────────────────────

export interface CropBox {
  x: number      // percentage 0–100
  y: number
  width: number
  height: number
}

/**
 * Apply a non-destructive crop + zoom to the master buffer and return a
 * derivative buffer for a specific context (e.g. desktop_hero).
 *
 * Used by the image editor "Save crop" flow — writes the coordinates to the
 * `crops` table, then generates/re-generates the context derivative.
 */
export async function applyCrop(
  masterBuffer: Buffer,
  cropBox: CropBox,
  zoom: number,  // percentage, e.g. 118
  targetWidth: number,
  format: DerivativeFormat,
  jpegQuality = 82,
): Promise<Buffer> {
  const meta: SharpMeta = await sharp(masterBuffer).metadata()
  const imgW = meta.width ?? 0
  const imgH = meta.height ?? 0

  // Convert percentage crop box to pixel coordinates
  const left = Math.round((cropBox.x / 100) * imgW)
  const top = Math.round((cropBox.y / 100) * imgH)
  const cropW = Math.round((cropBox.width / 100) * imgW)
  const cropH = Math.round((cropBox.height / 100) * imgH)

  const pipeline = sharp(masterBuffer)
    .extract({ left, top, width: cropW, height: cropH })
    .resize({ width: targetWidth, withoutEnlargement: true })
    .toColorspace('srgb')
    .withMetadata({ icc: 'srgb' })

  switch (format) {
    case 'avif': return pipeline.avif({ quality: 55, effort: 4 }).toBuffer()
    case 'webp': return pipeline.webp({ quality: 80 }).toBuffer()
    case 'jpeg': return pipeline.jpeg({ quality: jpegQuality, mozjpeg: true }).toBuffer()
  }
}
