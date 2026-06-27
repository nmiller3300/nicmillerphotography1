/**
 * app/api/contact/route.ts
 *
 * POST /api/contact  { name, email, body }
 * Creates a message row with status 'New'.
 * To enable email notifications, install resend (npm add resend) and set RESEND_API_KEY.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const contactSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  body: z.string().min(10).max(4000),
})

const recentSubmissions = new Map<string, number[]>()

function isSpam(ip: string): boolean {
  const now = Date.now()
  const window = 60 * 60 * 1000
  const times = (recentSubmissions.get(ip) ?? []).filter((t) => now - t < window)
  times.push(now)
  recentSubmissions.set(ip, times)
  return times.length > 3
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  if (isSpam(ip)) {
    return NextResponse.json(
      { error: 'Too many submissions. Please wait before trying again.' },
      { status: 429 },
    )
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const message = await db.message.create({ data: parsed.data })

  // Email notifications: install 'resend' (npm add resend) and set RESEND_API_KEY + NOTIFICATION_EMAIL
  // Then uncomment the block in the README.

  return NextResponse.json({ ok: true, id: message.id }, { status: 201 })
}
