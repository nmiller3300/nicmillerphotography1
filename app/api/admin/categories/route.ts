export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

function esc(s: string) { return String(s).replace(/'/g, "''") }
function slugify(name: string) { return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }

export async function GET() {
  try {
    const rows = await db.$queryRawUnsafe<Array<{id:number,name:string,slug:string,order:number}>>(
      `SELECT id, name, slug, "order" FROM categories ORDER BY "order" ASC`
    )
    return NextResponse.json(rows)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: Record<string,unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  const slug = slugify(name)
  try {
    const maxRow = await db.$queryRawUnsafe<Array<{max:number}>>(`SELECT COALESCE(MAX("order"),0) as max FROM categories`)
    const order = (maxRow[0]?.max ?? 0) + 1
    await db.$executeRawUnsafe(`INSERT INTO categories (name, slug, "order") VALUES ('${esc(name)}', '${esc(slug)}', ${order})`)
    const cat = await db.$queryRawUnsafe<Array<{id:number,name:string,slug:string,order:number}>>(
      `SELECT id, name, slug, "order" FROM categories WHERE slug = '${esc(slug)}' LIMIT 1`
    )
    return NextResponse.json(cat[0], { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Category already exists' }, { status: 409 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: Record<string,unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const id = Number(body.id)
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const sets: string[] = []
  if (typeof body.name === 'string') { sets.push(`name = '${esc(body.name)}'`); sets.push(`slug = '${esc(slugify(body.name))}'`) }
  if (typeof body.order === 'number') sets.push(`"order" = ${body.order}`)
  if (sets.length) await db.$executeRawUnsafe(`UPDATE categories SET ${sets.join(', ')} WHERE id = ${id}`)
  const cat = await db.$queryRawUnsafe<Array<Record<string,unknown>>>(`SELECT * FROM categories WHERE id = ${id} LIMIT 1`)
  return NextResponse.json(cat[0])
}

export async function DELETE(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = Number(request.nextUrl.searchParams.get('id'))
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const cnt = await db.$queryRawUnsafe<Array<{count:number}>>(`SELECT COUNT(*)::int as count FROM media WHERE category_id = ${id}`)
  if ((cnt[0]?.count ?? 0) > 0) return NextResponse.json({ error: `Cannot delete: ${cnt[0].count} photo(s) use this category` }, { status: 409 })
  await db.$executeRawUnsafe(`DELETE FROM categories WHERE id = ${id}`)
  return NextResponse.json({ ok: true })
}
