/**
 * app/admin/layout.tsx
 *
 * Admin layout — server-side auth guard (middleware also runs but this
 * is the belt-and-suspenders check that handles session expiry from Settings).
 *
 * If the session is invalid or expired, redirects to home with ?admin=1
 * which triggers the PIN overlay on the public site.
 */

import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'

export const metadata = { title: 'Admin — Nic Miller Photography', robots: 'noindex' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin()
  if (!session) {
    redirect('/?admin=1')
  }

  return <>{children}</>
}
