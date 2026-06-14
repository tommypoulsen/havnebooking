import { getTenant } from '@/lib/utils/tenant'
import { notFound } from 'next/navigation'

export default async function TenantHomePage() {
  const tenant = await getTenant()
  if (!tenant) notFound()

  return (
    <main style={{ fontFamily: 'system-ui', padding: '2rem' }}>
      <h1>{tenant.config.displayName}</h1>
      <p>Subdomain: <code>{tenant.subdomain}</code></p>
      <p>Tenant ID: <code>{tenant.id}</code></p>
      <p style={{ color: 'green' }}>✓ Database connection OK</p>
    </main>
  )
}
