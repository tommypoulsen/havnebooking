import { notFound, redirect } from 'next/navigation'
import { getTenant } from '@/lib/utils/tenant'
import { createClient } from '@/lib/supabase/server'
import { AdminNav } from './AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getTenant()
  if (!tenant) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const role = user.app_metadata?.role as string | undefined
  const userTenantId = user.app_metadata?.tenant_id as string | undefined

  // super_admin can access any tenant's admin panel
  const isSuperAdmin = role === 'super_admin'
  const isTenantAdmin = (role === 'admin' || role === 'staff') && userTenantId === tenant.id

  if (!isSuperAdmin && !isTenantAdmin) redirect('/login')

  return (
    <div className="flex min-h-screen">
      <AdminNav tenantName={tenant.config.displayName} />
      <main className="flex-1 bg-offwhite p-8 overflow-auto">{children}</main>
    </div>
  )
}
