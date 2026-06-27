export const dynamic = 'force-dynamic'
import { requireAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminPanel from '@/components/AdminPanel'

export default async function AdminPage() {
  const session = await requireAdmin()
  if (!session) redirect('/?admin=1')
  return <AdminPanel />
}
