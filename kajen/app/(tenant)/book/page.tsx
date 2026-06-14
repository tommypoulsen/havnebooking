import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTenant } from '@/lib/utils/tenant'
import { createClient } from '@/lib/supabase/server'
import type { Service } from '@/lib/types/domain'

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
    <main className="min-h-screen bg-offwhite">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-charcoal mb-2">
          {tenant.config.displayName}
        </h1>
        <p className="text-charcoal/60 mb-10">Vælg en ydelse for at booke</p>

        <div className="flex flex-col gap-4">
          {(services as Service[])?.map(service => (
            <Link
              key={service.id}
              href={`/book/${service.id}`}
              className="block bg-white rounded-xl p-6 border border-warm-gray hover:border-rust transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-charcoal group-hover:text-rust transition-colors">
                    {service.name}
                  </h2>
                  {service.description && (
                    <p className="text-charcoal/60 mt-1 text-sm">{service.description}</p>
                  )}
                </div>
                <span className="text-rust text-xl mt-1">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
