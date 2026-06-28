import { put, del, head } from '@vercel/blob'

export async function putMaster(checksum: string, buffer: Buffer, mimeType: string): Promise<string> {
  const pathname = `masters/${checksum}`
  await put(pathname, buffer, { access: 'public', contentType: mimeType, addRandomSuffix: false })
  return pathname
}

export async function getMasterUrl(pathname: string): Promise<string> {
  const blob = await head(pathname)
  return blob.url
}

export async function deleteMaster(pathname: string): Promise<void> {
  await del(pathname)
}

export async function putDerivative(checksum: string, format: string, width: number, buffer: Buffer): Promise<string> {
  const ext = format === 'jpeg' ? 'jpg' : format
  const { url } = await put(`photos/${checksum}/${width}.${ext}`, buffer, {
    access: 'public', contentType: `image/${format}`, addRandomSuffix: false,
    cacheControlMaxAge: 60 * 60 * 24 * 365,
  })
  return url
}

export async function putMockup(printId: number, index: number, buffer: Buffer, mimeType: string): Promise<string> {
  const ext = mimeType.split('/')[1] ?? 'jpg'
  const { url } = await put(`mockups/${printId}/${index}.${ext}`, buffer, { access: 'public', contentType: mimeType, addRandomSuffix: false })
  return url
}

export async function deleteDerivatives(checksum: string): Promise<void> {
  const keys: string[] = []
  for (const fmt of ['avif','webp','jpg']) for (const w of [480,960,1440,2048,2560]) keys.push(`photos/${checksum}/${w}.${fmt}`)
  await del(keys).catch(() => {})
}
