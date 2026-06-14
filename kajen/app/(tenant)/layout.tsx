import { notFound } from 'next/navigation'
import { getTenant } from '@/lib/utils/tenant'
import { SiteHeader } from '@/app/components/SiteHeader'
import { SiteFooter } from '@/app/components/SiteFooter'

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getTenant()
  if (!tenant) notFound()

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader displayName={tenant.config.displayName} />
      <main className="flex-1 bg-offwhite">{children}</main>
      <SiteFooter name={tenant.name} config={tenant.config} />
    </div>
  )
}
