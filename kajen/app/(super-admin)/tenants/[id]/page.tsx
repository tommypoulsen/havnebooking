import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { toggleTenantActive, updateTenant } from '../actions'
import { EditTenantClient } from './EditTenantClient'
import type { Tenant } from '@/lib/types/domain'

export default async function EditTenantPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('tenants')
    .select('id, name, subdomain, active, config, created_at')
    .eq('id', id)
    .single()

  if (!data) notFound()

  const tenant = data as Tenant

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/tenants" className="text-xs text-charcoal/40 hover:text-charcoal transition-colors">
          ← Tenanter
        </Link>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">{tenant.name}</h1>
          <p className="text-sm text-charcoal/40 mt-0.5">{tenant.subdomain}.localhost</p>
        </div>
        <form action={toggleTenantActive}>
          <input type="hidden" name="id" value={tenant.id} />
          <input type="hidden" name="active" value={String(tenant.active)} />
          <button
            type="submit"
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              tenant.active
                ? 'bg-success-bg text-success hover:bg-danger-bg hover:text-danger'
                : 'bg-warm-gray text-charcoal/50 hover:bg-success-bg hover:text-success'
            }`}
          >
            {tenant.active ? 'Aktiv — klik for at deaktivere' : 'Inaktiv — klik for at aktivere'}
          </button>
        </form>
      </div>

      <EditTenantClient tenant={tenant} updateTenant={updateTenant} />
    </div>
  )
}
