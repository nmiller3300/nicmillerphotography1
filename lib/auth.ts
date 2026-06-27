/**
 * lib/auth.ts
 *
 * Session management with iron-session.
 * All admin API routes and the /admin page go through requireAdmin().
 */

import { getIronSession, IronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { db } from './db'

export interface SessionData {
  isAdmin: boolean
  createdAt: number  // unix ms — used to enforce session expiry from Settings
}

export const SESSION_COOKIE = 'nm_admin'

export function sessionOptions() {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET env var missing or too short (need 32+ chars)')
  }
  return {
    password: secret,
    cookieName: SESSION_COOKIE,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      // Max cookie lifetime — iron-session enforces a separate in-cookie expiry
      // based on sessionMinutes from Settings. Set cookie max to 1 day so the
      // browser doesn't hold a stale cookie indefinitely.
      maxAge: 60 * 60 * 24,
    },
  }
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions())
}

/**
 * Verify the current request is authenticated.
 * Returns the session if valid, null if not (expired or never set).
 *
 * Usage in route handlers:
 *   const session = await requireAdmin()
 *   if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 */
export async function requireAdmin(): Promise<IronSession<SessionData> | null> {
  const session = await getSession()

  if (!session.isAdmin || !session.createdAt) return null

  // Check expiry against the configurable session_minutes setting
  const settings = await db.settings.findFirst()
  const maxMinutes = settings?.sessionMinutes ?? 120
  const ageMinutes = (Date.now() - session.createdAt) / 60_000

  if (ageMinutes > maxMinutes) {
    await session.destroy()
    return null
  }

  return session
}

/**
 * Constant-time PIN comparison to prevent timing attacks.
 * Both strings are padded to the same length before comparison.
 */
export function verifyPin(submitted: string, stored: string): boolean {
  // crypto.timingSafeEqual requires equal-length Buffers
  const a = Buffer.from(submitted.padEnd(16, '\0'))
  const b = Buffer.from(stored.padEnd(16, '\0'))
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('crypto').timingSafeEqual(a, b)
  } catch {
    return false
  }
}
