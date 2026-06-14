import { notFound } from 'next/navigation'
import { getTenant } from '@/lib/utils/tenant'
import { createClient } from '@/lib/supabase/server'
import { upsertInventory, addSizeCategory, deleteSizeCategory } from './actions'
import { InventoryRow } from './InventoryRow'
import { AddCategoryForm } from './AddCategoryForm'

export default async function LagerPage() {
  const tenant = await getTenant()
  if (!tenant) notFound()

  const supabase = await createClient()

  const { data: services } = await supabase
    .from('services')
    .select('id, name, sort_order')
    .eq('tenant_id', tenant.id)
    .eq('type', 'capacity')
    .order('sort_order')

  if (!services?.length) {
    return (
      <div className="max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold text-charcoal">Lagerstyring</h1>
        <p className="text-sm text-charcoal/50">
          Ingen kapacitetsservices fundet. Opret en service af typen &quot;capacity&quot; for at styre lager.
        </p>
      </div>
    )
  }

  const serviceIds = services.map(s => s.id)

  const [{ data: rawCats }, { data: rawInv }] = await Promise.all([
    supabase
      .from('size_categories')
      .select('id, service_id, label, sort_order')
      .in('service_id', serviceIds)
      .order('sort_order'),
    supabase
      .from('capacity_inventory')
      .select('id, service_id, size_category_id, total_units')
      .in('service_id', serviceIds),
  ])

  const invByCat = new Map(
    (rawInv ?? []).map(r => [r.size_category_id, { id: r.id, total_units: r.total_units }])
  )

  const catsByService: Record<string, { id: string; label: string; sort_order: number }[]> = {}
  for (const cat of rawCats ?? []) {
    if (!catsByService[cat.service_id]) catsByService[cat.service_id] = []
    catsByService[cat.service_id]!.push(cat)
  }

  return (
    <div className="max-w-3xl space-y-10">
      <h1 className="text-2xl font-bold text-charcoal">Lagerstyring</h1>

      {services.map(service => {
        const cats = catsByService[service.id] ?? []
        const totalUnits = cats.reduce(
          (sum, c) => sum + (invByCat.get(c.id)?.total_units ?? 0),
          0
        )

        return (
          <section key={service.id}>
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-charcoal/40">
                {service.name}
              </h2>
              {totalUnits > 0 && (
                <span className="text-xs text-charcoal/40">{totalUnits} pladser i alt</span>
              )}
            </div>

            {cats.length > 0 ? (
              <div className="bg-white border border-warm-gray rounded-xl overflow-hidden divide-y divide-warm-gray">
                {cats.map(cat => (
                  <InventoryRow
                    key={cat.id}
                    categoryId={cat.id}
                    serviceId={service.id}
                    label={cat.label}
                    booked={0}
                    inventory={invByCat.get(cat.id) ?? null}
                    upsertInventory={upsertInventory}
                    deleteSizeCategory={deleteSizeCategory}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-charcoal/40 bg-white border border-warm-gray rounded-xl px-4 py-6 text-center">
                Ingen størrelseskategorier endnu
              </p>
            )}

            <AddCategoryForm serviceId={service.id} addSizeCategory={addSizeCategory} />
          </section>
        )
      })}
    </div>
  )
}
