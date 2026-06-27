/**
 * app/api/admin/login/route.ts
 *
 * POST { pin: string } → sets HTTP-only session cookie on success.
 *
 * Security:
 *   - Constant-time comparison (verifyPin) prevents timing attacks
 *   - Rate limiting: 5 attempts per IP per 10 min (Vercel KV / Upstash Redis)
 *   - PIN lives only in ADMIN_PIN env var — never in client code
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession, verifyPin } from '@/lib/auth'
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit'

const schema = z.object({
  pin: z.string().regex(/^\d{6}$/, 'PIN must be exactly 6 digits'),
})

export async function POST(request: NextRequest) {
  // Rate limiting — use the forwarded IP header (Vercel sets this)
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  const rateLimit = await checkRateLimit(`login:${ip}`)

  if (!rateLimit.allowed) {
    const retryAfterSecs = Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil(retryAfterSecs / 60)} minute(s).` },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSecs),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetAt / 1000)),
        },
      },
    )
  }

  // Parse body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid PIN format' }, { status: 400 })
  }

  const { pin } = parsed.data

  const storedPin = process.env.ADMIN_PIN
  if (!storedPin) {
    console.error('ADMIN_PIN env var not set')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  if (!verifyPin(pin, storedPin)) {
    return NextResponse.json(
      {
        error: 'Incorrect PIN.',
        remaining: rateLimit.remaining,
      },
      { status: 401 },
    )
  }

  // ✓ Correct PIN — create session
  await resetRateLimit(`login:${ip}`)

  const session = await getSession()
  session.isAdmin = true
  session.createdAt = Date.now()
  await session.save()

  return NextResponse.json({ ok: true })
}
