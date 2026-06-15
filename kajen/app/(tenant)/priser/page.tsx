import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTenant } from '@/lib/utils/tenant'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils/pricing'
import type { Service, SizeCategory, PricingRule, DurationType } from '@/lib/types/domain'

const durationLabel: Record<DurationType, string> = {
  per_lift:   'Pr. løft',
  per_season: 'Pr. sæson',
  per_day:    'Pr. dag',
}

export default async function PriserPage() {
  const tenant = await getTenant()
  if (!tenant) notFound()

  const supabase = await createClient()

  const { data: servicesData } = await supabase
    .from('services')
    .select('id, name, type, sort_order')
    .eq('tenant_id', tenant.id)
    .eq('active', true)
    .order('sort_order')

  const serviceIds = (servicesData ?? []).map(s => s.id)

  const [{ data: categoriesData }, { data: rulesData }] = await Promise.all([
    supabase
      .from('size_categories')
      .select('id, service_id, label, sort_order')
      .in('service_id', serviceIds)
      .order('sort_order'),
    supabase
      .from('pricing_rules')
      .select('id, service_id, size_category_id, duration_type, price_oere')
      .in('service_id', serviceIds),
  ])

  const services = (servicesData as Pick<Service, 'id' | 'name' | 'type' | 'sort_order'>[]) ?? []
  const categories = (categoriesData as Pick<SizeCategory, 'id' | 'service_id' | 'label' | 'sort_order'>[]) ?? []
  const rules = (rulesData as Pick<PricingRule, 'id' | 'service_id' | 'size_category_id' | 'duration_type' | 'price_oere'>[]) ?? []

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="flex items-baseline justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-charcoal">Priser</h1>
          <p className="text-sm text-charcoal/40 mt-1">Alle priser inkl. moms</p>
        </div>
        <Link
          href="/book"
          className="bg-rust hover:bg-rust-dark text-white text-xs font-black uppercase tracking-widest px-6 py-3 transition-colors"
        >
          Book
        </Link>
      </div>

      <div className="space-y-10">
        {services.map(service => {
          const serviceCategories = categories.filter(c => c.service_id === service.id)
          const serviceRules = rules.filter(r => r.service_id === service.id)
          const durations = [...new Set(serviceRules.map(r => r.duration_type))] as DurationType[]

          if (durations.length === 0) return null

          return (
            <div key={service.id}>
              <h2 className="text-xs font-black uppercase tracking-widest text-rust mb-3">{service.name}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-charcoal">
                      <th className="text-left py-2 pr-6 text-xs font-black uppercase tracking-widest text-charcoal w-1/3" />
                      {serviceCategories.length > 0
                        ? serviceCategories.map(cat => (
                            <th key={cat.id} className="text-right py-2 px-3 text-xs font-bold text-charcoal/50 whitespace-nowrap">
                              {cat.label}
                            </th>
                          ))
                        : <th className="text-right py-2 px-3 text-xs font-bold text-charcoal/50">Pris</th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    {durations.map(duration => (
                      <tr key={duration} className="border-b border-warm-gray">
                        <td className="py-2.5 pr-6 font-medium text-charcoal">{durationLabel[duration]}</td>
                        {serviceCategories.length > 0
                          ? serviceCategories.map(cat => {
                              const rule = serviceRules.find(
                                r => r.duration_type === duration && r.size_category_id === cat.id
                              )
                              return (
                                <td key={cat.id} className="py-2.5 px-3 text-right text-charcoal/60 whitespace-nowrap">
                                  {rule ? formatPrice(rule.price_oere) : '—'}
                                </td>
                              )
                            })
                          : (() => {
                              const rule = serviceRules.find(
                                r => r.duration_type === duration && r.size_category_id === null
                              )
                              return (
                                <td className="py-2.5 px-3 text-right text-charcoal/60 whitespace-nowrap">
                                  {rule ? formatPrice(rule.price_oere) : '—'}
                                </td>
                              )
                            })()
                        }
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>

      {tenant.config.contactPhone && (
        <p className="text-xs text-charcoal/40 mt-10">
          Spørgsmål? Ring på <strong className="text-charcoal/60">{tenant.config.contactPhone}</strong>
          {tenant.config.contactHours && ` · ${tenant.config.contactHours}`}
        </p>
      )}
    </div>
  )
}
