import { notFound } from 'next/navigation'
import { getTenant } from '@/lib/utils/tenant'
import { createClient } from '@/lib/supabase/server'
import { PriceRow } from './PriceRow'
import type { PricingRule, SizeCategory, Service } from '@/lib/types/domain'

export default async function PricingPage() {
  const tenant = await getTenant()
  if (!tenant) notFound()

  const supabase = await createClient()

  const { data: services } = await supabase
    .from('services')
    .select('id, name')
    .eq('tenant_id', tenant.id)
    .eq('active', true)

  const serviceIds = (services as Pick<Service, 'id' | 'name'>[] | null)?.map(s => s.id) ?? []

  const [{ data: rules }, { data: categories }] = await Promise.all([
    supabase
      .from('pricing_rules')
      .select('id, service_id, size_category_id, duration_type, price_oere, valid_from, valid_to')
      .in('service_id', serviceIds)
      .order('service_id')
      .order('price_oere'),
    supabase
      .from('size_categories')
      .select('id, service_id, label')
      .in('service_id', serviceIds),
  ])

  const serviceMap = Object.fromEntries(
    (services as Pick<Service, 'id' | 'name'>[] | null)?.map(s => [s.id, s.name]) ?? []
  )
  const categoryMap = Object.fromEntries(
    (categories as Pick<SizeCategory, 'id' | 'label'>[] | null)?.map(c => [c.id, c.label]) ?? []
  )

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-charcoal mb-2">Priser</h1>
      <p className="text-sm text-charcoal/50 mb-6">Priser angives i øre (1 kr = 100 øre)</p>

      <div className="bg-white rounded-xl border border-warm-gray overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-warm-gray bg-offwhite">
              <th className="text-left px-4 py-3 font-medium text-charcoal/60">Service</th>
              <th className="text-left px-4 py-3 font-medium text-charcoal/60">Størrelse</th>
              <th className="text-left px-4 py-3 font-medium text-charcoal/60">Varighed</th>
              <th className="text-left px-4 py-3 font-medium text-charcoal/60">Pris</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-gray">
            {(rules as PricingRule[] | null)?.map(rule => (
              <PriceRow
                key={rule.id}
                rule={rule}
                serviceName={serviceMap[rule.service_id] ?? '—'}
                sizeLabel={rule.size_category_id ? categoryMap[rule.size_category_id] ?? '—' : null}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
