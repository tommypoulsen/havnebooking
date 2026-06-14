import { notFound } from 'next/navigation'
import { getTenant } from '@/lib/utils/tenant'
import { getPalette } from '@/lib/utils/palettes'
import { SiteHeader } from '@/app/components/SiteHeader'
import { SiteFooter } from '@/app/components/SiteFooter'

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getTenant()
  if (!tenant) notFound()

  const palette = getPalette(tenant.config.theme)

  return (
    <div
      id="theme-root"
      className="min-h-screen flex flex-col"
      style={palette.vars as React.CSSProperties}
    >
      <SiteHeader displayName={tenant.config.displayName} logoUrl={tenant.config.logoUrl} />
      <main className="flex-1 bg-offwhite">{children}</main>
      <SiteFooter name={tenant.name} config={tenant.config} />
    </div>
  )
}
