import { cache } from 'react'
import { headers, cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { Tenant } from '@/lib/types/domain'

function extractSubdomain(host: string): string {
  // "hundested.localhost:3000" → "hundested"
  // "hundested.havnebooking.dk" → "hundested"
  return host.split('.')[0].split(':')[0]
}

// cache() deduplicates calls within a single request —
// layout + child components all share the same DB fetch.
export const getTenant = cache(async (): Promise<Tenant | null> => {
  const headersList = await headers()
  const cookieStore = await cookies()
  const host = headersList.get('host') ?? ''

  // tenant-override cookie: set by proxy.ts when ?tenant= is in the URL — lets
  // developers test tenant sites on the root domain without a custom subdomain.
  // RLS via JWT still enforces data isolation; this only affects which UI is shown.
  const tenantOverride = cookieStore.get('tenant-override')?.value
  const subdomain = tenantOverride ?? extractSubdomain(host)

  const supabase = await createClient()
  const { data } = await supabase
    .from('tenants')
    .select('id, name, subdomain, config, active, created_at')
    .eq('subdomain', subdomain)
    .eq('active', true)
    .single()

  return data as Tenant | null
})
