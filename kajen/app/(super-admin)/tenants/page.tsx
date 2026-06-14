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
      <h1 className="text-2xl font-bold text-charcoal mb-6">Tenanter</h1>

      <div className="bg-white rounded-xl border border-warm-gray overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-warm-gray bg-offwhite">
              <th className="text-left px-4 py-3 font-medium text-charcoal/60">Navn</th>
              <th className="text-left px-4 py-3 font-medium text-charcoal/60">Subdomain</th>
              <th className="text-left px-4 py-3 font-medium text-charcoal/60">Oprettet</th>
              <th className="text-left px-4 py-3 font-medium text-charcoal/60">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-gray">
            {(tenants as Tenant[] | null)?.map(tenant => (
              <tr key={tenant.id}>
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
                      ? 'bg-green-100 text-green-700'
                      : 'bg-warm-gray text-charcoal/50'
                  }`}>
                    {tenant.active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
