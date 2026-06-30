export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const status = request.nextUrl.searchParams.get('status')
  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') ?? '1'))
  const PAGE_SIZE = 25
  const offset = (page - 1) * PAGE_SIZE
  const where = status ? `WHERE status = '${status.replace(/'/g,"''")}'` : ''

  try {
    const [countRows, items, folderRows] = await Promise.all([
      db.$queryRawUnsafe<Array<{count:number}>>(`SELECT COUNT(*)::int as count FROM messages ${where}`),
      db.$queryRawUnsafe<Array<{id:number,name:string,email:string,body:string,status:string,created_at:string}>>(
        `SELECT id, name, email, body, status, created_at FROM messages ${where} ORDER BY created_at DESC LIMIT ${PAGE_SIZE} OFFSET ${offset}`
      ),
      db.$queryRawUnsafe<Array<{status:string,count:number}>>(
        `SELECT status, COUNT(*)::int as count FROM messages GROUP BY status`
      ),
    ])
    const folderCounts = Object.fromEntries(folderRows.map(r => [r.status, r.count]))
    return NextResponse.json({
      total: countRows[0]?.count ?? 0, page, pageSize: PAGE_SIZE, folderCounts,
      items: items.map(m => ({ id:m.id, name:m.name, email:m.email, body:m.body, status:m.status, createdAt:m.created_at })),
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
