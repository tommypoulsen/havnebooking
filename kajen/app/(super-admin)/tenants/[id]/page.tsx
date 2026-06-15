import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { toggleTenantActive, updateTenant } from '../actions'
import { EditTenantClient } from './EditTenantClient'
import { CreateUserForm } from './CreateUserForm'
import type { Tenant } from '@/lib/types/domain'

export default async function EditTenantPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data }, { data: users }] = await Promise.all([
    supabase
      .from('tenants')
      .select('id, name, subdomain, active, config, created_at')
      .eq('id', id)
      .single(),
    supabase
      .from('users')
      .select('id, full_name, email, role, created_at')
      .eq('tenant_id', id)
      .in('role', ['admin', 'staff'])
      .order('created_at'),
  ])

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

      <div className="bg-white rounded-xl border border-warm-gray p-6 mt-6">
        <h2 className="text-sm font-semibold text-charcoal mb-4">Brugere</h2>

        {users && users.length > 0 ? (
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="border-b border-warm-gray">
                <th className="text-left py-2 text-xs font-medium text-charcoal/50">Navn</th>
                <th className="text-left py-2 text-xs font-medium text-charcoal/50">E-mail</th>
                <th className="text-left py-2 text-xs font-medium text-charcoal/50">Rolle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-gray">
              {users.map(u => (
                <tr key={u.id}>
                  <td className="py-2 text-charcoal">{u.full_name ?? '—'}</td>
                  <td className="py-2 text-charcoal/60">{u.email}</td>
                  <td className="py-2">
                    <span className="text-xs font-medium bg-offwhite text-charcoal/60 px-2 py-0.5 rounded-full">
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-charcoal/40 mb-4">Ingen brugere endnu.</p>
        )}

        <CreateUserForm tenantId={tenant.id} />
      </div>
    </div>
  )
}
