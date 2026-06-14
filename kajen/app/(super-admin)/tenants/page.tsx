import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Tenant } from '@/lib/types/domain'

function formatDate(d: string) {
  return new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(d))
}

export default async function TenantsPage() {
  const supabase = await createClient()
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, name, subdomain, active, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-charcoal">Tenanter</h1>
        <Link
          href="/tenants/new"
          className="text-xs bg-charcoal hover:bg-charcoal-mid text-white font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Opret tenant
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-warm-gray overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-warm-gray bg-offwhite">
              <th className="text-left px-4 py-3 font-medium text-charcoal/60">Navn</th>
              <th className="text-left px-4 py-3 font-medium text-charcoal/60">Subdomain</th>
              <th className="text-left px-4 py-3 font-medium text-charcoal/60">Oprettet</th>
              <th className="text-left px-4 py-3 font-medium text-charcoal/60">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-gray">
            {(tenants as Tenant[] | null)?.map(tenant => (
              <tr key={tenant.id} className="hover:bg-offwhite/50 transition-colors">
                <td className="px-4 py-3 font-medium text-charcoal">{tenant.name}</td>
                <td className="px-4 py-3 text-charcoal/60">
                  <code className="text-xs bg-offwhite px-1.5 py-0.5 rounded">
                    {tenant.subdomain}
                  </code>
                </td>
                <td className="px-4 py-3 text-charcoal/60">{formatDate(tenant.created_at)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    tenant.active
                      ? 'bg-success-bg text-success'
                      : 'bg-warm-gray text-charcoal/50'
                  }`}>
                    {tenant.active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/tenants/${tenant.id}`}
                    className="text-xs text-charcoal/40 hover:text-charcoal transition-colors"
                  >
                    Rediger →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
