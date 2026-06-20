import { notFound } from 'next/navigation'
import { getTenant } from '@/lib/utils/tenant'
import { createClient } from '@/lib/supabase/server'
import { AddOnRulesEditor } from './AddOnRulesEditor'
import type { Service, SizeCategory } from '@/lib/types/domain'

export default async function AddOnsPage() {
  const tenant = await getTenant()
  if (!tenant) notFound()

  const supabase = await createClient()

  const { data: services } = await supabase
    .from('services')
    .select('id, tenant_id, name, type, description, config, active, sort_order')
    .eq('tenant_id', tenant.id)
    .eq('active', true)
    .order('sort_order')

  const allServices = (services as Service[] | null) ?? []
  const serviceIds = allServices.map(s => s.id)

  const { data: sizeCategories } = serviceIds.length > 0
    ? await supabase
        .from('size_categories')
        .select('id, service_id, label, description, sort_order')
        .in('service_id', serviceIds)
        .order('sort_order')
    : { data: [] }

  const allCategories = (sizeCategories as SizeCategory[] | null) ?? []

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-charcoal mb-2">Tillægsregler</h1>
      <p className="text-sm text-charcoal/50 mb-10">
        Tillægsydelser der automatisk tilføjes til bookingen baseret på kundens valg
      </p>

      <div className="space-y-12">
        {allServices.map(service => (
          <section key={service.id}>
            <h2 className="text-xs font-black uppercase tracking-widest text-charcoal/40 mb-4">
              {service.name}
            </h2>
            <AddOnRulesEditor
              service={service}
              sizeCategories={allCategories.filter(c => c.service_id === service.id)}
              allServices={allServices}
            />
          </section>
        ))}
      </div>
    </div>
  )
}
