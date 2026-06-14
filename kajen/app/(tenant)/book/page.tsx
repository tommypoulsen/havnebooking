import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTenant } from '@/lib/utils/tenant'
import { createClient } from '@/lib/supabase/server'
import type { Service } from '@/lib/types/domain'

const typeLabel: Record<string, string> = {
  timeslot: 'Tidsbestilling',
  capacity: 'Kapacitetsbooking',
  stock:    'Udstyrsleje',
}

export default async function BookPage() {
  const tenant = await getTenant()
  if (!tenant) notFound()

  const supabase = await createClient()
  const { data: services } = await supabase
    .from('services')
    .select('id, name, description, type, sort_order')
    .eq('tenant_id', tenant.id)
    .eq('active', true)
    .order('sort_order')

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="mb-10">
        <h1 className="text-3xl font-black uppercase tracking-tight text-charcoal">Book</h1>
        <p className="text-charcoal/40 mt-1 text-sm">{tenant.config.displayName} · Online booking</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(services as Service[])?.map(service => (
          <Link
            key={service.id}
            href={`/book/${service.id}`}
            className="group block bg-white border border-warm-gray hover:border-rust p-8 transition-colors"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-charcoal/40 mb-2">
              {typeLabel[service.type] ?? service.type}
            </p>
            <h2 className="text-xl font-black uppercase tracking-tight text-charcoal group-hover:text-rust transition-colors mb-2">
              {service.name}
            </h2>
            {service.description && (
              <p className="text-charcoal/60 text-sm leading-relaxed">{service.description}</p>
            )}
            <p className="mt-4 text-xs font-bold uppercase tracking-widest text-rust group-hover:underline">
              Book →
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
