export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const cid = parseInt(id)
  try {
    const rows = await db.$queryRawUnsafe<Array<{id:number,title:string,status:string,thumbUrl:string|null}>>(`
      SELECT m.id, m.title, m.status, d.url as "thumbUrl"
      FROM collection_items ci
      JOIN media m ON m.id = ci.media_id
      LEFT JOIN derivatives d ON d.media_id = m.id AND d.format='webp' AND d.width=960
      WHERE ci.collection_id = ${cid}
      ORDER BY ci."order" ASC
    `)
    return NextResponse.json(rows)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
