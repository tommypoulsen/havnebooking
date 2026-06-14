import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SuperAdminNav } from './SuperAdminNav'

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  if (user.app_metadata?.role !== 'super_admin') redirect('/')

  return (
    <div className="flex min-h-screen">
      <SuperAdminNav />
      <main className="flex-1 bg-offwhite p-8 overflow-auto">{children}</main>
    </div>
  )
}
