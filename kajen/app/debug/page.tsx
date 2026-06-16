import { cookies, headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export default async function DebugPage() {
  const cookieStore = await cookies()
  const headersList = await headers()
  const host = headersList.get('host') ?? ''
  const tenantOverride = cookieStore.get('tenant-override')?.value
  const allCookies = cookieStore.getAll()

  const supabase = await createClient()
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('id, name, subdomain, active')
    .eq('subdomain', tenantOverride ?? host.split('.')[0])
    .eq('active', true)
    .single()

  return (
    <pre style={{ padding: 24, fontFamily: 'monospace', fontSize: 14 }}>
      {JSON.stringify(
        {
          host,
          tenantOverride,
          allCookies: allCookies.map(c => ({ name: c.name, value: c.value })),
          tenantQuery: { subdomain: tenantOverride ?? host.split('.')[0], result: tenant, error: error?.message },
        },
        null,
        2
      )}
    </pre>
  )
}
