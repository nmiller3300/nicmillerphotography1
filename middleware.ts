/**
 * middleware.ts
 *
 * Runs on every request that matches the config.matcher.
 * Protects /admin/* pages and /api/admin/* routes.
 *
 * Middleware runs on the Edge Runtime, which doesn't have access to Prisma or
 * Node built-ins. We do a lightweight cookie check here and let the API routes
 * do the full session validation (including expiry against Settings).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import type { SessionData } from '@/lib/auth'

const SESSION_COOKIE = 'nm_admin'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow the login/logout routes through unconditionally
  if (
    pathname === '/api/admin/login' ||
    pathname === '/api/admin/logout'
  ) {
    return NextResponse.next()
  }

  // Check for a valid session cookie
  const response = NextResponse.next()

  const secret = process.env.SESSION_SECRET
  if (!secret) {
    // Misconfigured — block access
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  let isAdmin = false
  try {
    // iron-session on the Edge Runtime — pass request + response
    const session = await getIronSession<SessionData>(request, response, {
      password: secret,
      cookieName: SESSION_COOKIE,
    })
    isAdmin = session.isAdmin === true
  } catch {
    isAdmin = false
  }

  if (!isAdmin) {
    // API routes return 401 JSON; page routes redirect to home (which shows the PIN overlay)
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/?admin=1', request.url))
  }

  return response
}

export const config = {
  matcher: [
    // Protect admin API
    '/api/admin/:path*',
    // Protect admin page
    '/admin/:path*',
  ],
}
