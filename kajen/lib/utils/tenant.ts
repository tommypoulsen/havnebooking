import { cache } from 'react'
import { headers } from 'next/headers'
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
  const host = headersList.get('host') ?? ''
  const subdomain = extractSubdomain(host)

  const supabase = await createClient()
  const { data } = await supabase
    .from('tenants')
    .select('id, name, subdomain, config, active, created_at')
    .eq('subdomain', subdomain)
    .eq('active', true)
    .single()

  return data as Tenant | null
})
