import { getIronSession, IronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { db } from './db'

export interface SessionData {
  isAdmin: boolean
  createdAt: number
}

export const SESSION_COOKIE = 'nm_admin'

export function sessionOptions() {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET env var missing or too short')
  return {
    password: secret,
    cookieName: SESSION_COOKIE,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24,
    },
  }
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions())
}

export async function requireAdmin(): Promise<IronSession<SessionData> | null> {
  const session = await getSession()
  if (!session.isAdmin || !session.createdAt) return null

  // Raw SQL — no Prisma model methods
  let maxMinutes = 120
  try {
    const rows = await db.$queryRawUnsafe<Array<{session_minutes:number}>>(
      `SELECT session_minutes FROM settings WHERE id = 1 LIMIT 1`
    )
    if (rows[0]?.session_minutes) maxMinutes = rows[0].session_minutes
  } catch { /* use default */ }

  if ((Date.now() - session.createdAt) / 60_000 > maxMinutes) {
    await session.destroy()
    return null
  }
  return session
}

export function verifyPin(submitted: string, stored: string): boolean {
  const a = Buffer.from(submitted.padEnd(16, '\0'))
  const b = Buffer.from(stored.padEnd(16, '\0'))
  try { return require('crypto').timingSafeEqual(a, b) } catch { return false }
}
