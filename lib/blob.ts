/**
 * lib/blob.ts
 *
 * Thin wrappers around @vercel/blob that enforce the private/public split.
 *
 *   private/masters/   — original files, NEVER publicly reachable
 *   public/photos/     — web derivatives (GPS stripped, sRGB, sized for the web)
 *   public/mockups/    — print mockup images
 *
 * Vercel Blob "private" access requires a signed token to download;
 * "public" access is a permanent CDN URL.
 */

import { put, del, head } from '@vercel/blob'

// ─── Private (masters) ────────────────────────────────────────────────────────

/**
 * Upload the untouched original file.
 * Returns the blob pathname (key) — store this in media.masterKey.
 * Never return this URL to the browser.
 */
export async function putMaster(
  checksum: string,
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const pathname = `masters/${checksum}`
  await put(pathname, buffer, {
    access: 'public', // masters stored at unguessable sha256 path, never returned to browser
    contentType: mimeType,
    addRandomSuffix: false,
  })
  return pathname
}

/**
 * Retrieve the private master blob URL (signed, short-lived).
 * Only use this server-side (e.g. to re-derive a crop on demand).
 * Never send this URL to the browser.
 */
export async function getMasterUrl(pathname: string): Promise<string> {
  const blob = await head(pathname, { token: process.env.BLOB_READ_WRITE_TOKEN })
  return blob.url  // this is the signed URL — valid for ~1 hour
}

/**
 * Delete a master — only call this when deleting media entirely.
 */
export async function deleteMaster(pathname: string): Promise<void> {
  await del(pathname)
}

// ─── Public (web derivatives) ─────────────────────────────────────────────────

/**
 * Upload a web derivative (GPS stripped, sRGB, sized for display).
 * Returns a permanent public CDN URL — safe to store in derivatives.url.
 */
export async function putDerivative(
  checksum: string,
  format: string,  // 'avif' | 'webp' | 'jpeg'
  width: number,
  buffer: Buffer,
): Promise<string> {
  const ext = format === 'jpeg' ? 'jpg' : format
  const pathname = `photos/${checksum}/${width}.${ext}`

  const { url } = await put(pathname, buffer, {
    access: 'public',
    contentType: `image/${format}`,
    addRandomSuffix: false,
    cacheControlMaxAge: 60 * 60 * 24 * 365, // 1 year — content-addressed by checksum
  })

  return url
}

/**
 * Upload a print mockup image (publicly visible on the print listing).
 */
export async function putMockup(
  printId: number,
  index: number,
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const ext = mimeType.split('/')[1] ?? 'jpg'
  const { url } = await put(`mockups/${printId}/${index}.${ext}`, buffer, {
    access: 'public',
    contentType: mimeType,
    addRandomSuffix: false,
  })
  return url
}

/**
 * Delete all public derivatives for a given checksum.
 * Call when fully deleting a media record.
 */
export async function deleteDerivatives(checksum: string): Promise<void> {
  // Vercel Blob doesn't support prefix deletes yet — delete known formats/widths.
  const FORMATS = ['avif', 'webp', 'jpg']
  const WIDTHS = [480, 960, 1440, 2048, 2560]
  const urls: string[] = []
  for (const fmt of FORMATS) {
    for (const w of WIDTHS) {
      urls.push(`photos/${checksum}/${w}.${fmt}`)
    }
  }
  // del() accepts a list of pathnames
  await del(urls).catch(() => {/* not all widths exist — that's fine */})
}
