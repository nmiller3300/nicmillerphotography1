export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function esc(s: string) { return String(s).replace(/'/g, "''") }

const recentSubmissions = new Map<string, number[]>()
function isSpam(ip: string): boolean {
  const now = Date.now()
  const window = 60 * 60 * 1000
  const times = (recentSubmissions.get(ip) ?? []).filter(t => now - t < window)
  times.push(now)
  recentSubmissions.set(ip, times)
  return times.length > 3
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isSpam(ip)) return NextResponse.json({ error: 'Too many submissions. Please wait.' }, { status: 429 })

  let body: Record<string,unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const msg = typeof body.body === 'string' ? body.body.trim() : ''

  if (!name || name.length > 120) return NextResponse.json({ error: 'Name required' }, { status: 422 })
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Valid email required' }, { status: 422 })
  if (!msg || msg.length < 10 || msg.length > 4000) return NextResponse.json({ error: 'Message must be 10-4000 characters' }, { status: 422 })

  try {
    await db.$executeRawUnsafe(
      `INSERT INTO messages (name, email, body, status, created_at) VALUES ('${esc(name)}', '${esc(email)}', '${esc(msg)}', 'New', NOW())`
    )
    const row = await db.$queryRawUnsafe<Array<{id:number}>>(
      `SELECT id FROM messages WHERE email = '${esc(email)}' ORDER BY created_at DESC LIMIT 1`
    )
    return NextResponse.json({ ok: true, id: row[0]?.id }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
