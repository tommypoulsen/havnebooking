import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTenant } from '@/lib/utils/tenant'
import { createClient } from '@/lib/supabase/server'
import type { Service } from '@/lib/types/domain'

export default async function TenantHomePage() {
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
    <div>
      {/* Hero */}
      <section className="relative bg-charcoal text-white min-h-[480px] flex items-center">
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, var(--color-charcoal) 0%, var(--color-navy-dark) 100%)' }} />
        <div className="relative max-w-6xl mx-auto px-6 py-20 w-full">
          <div className="w-10 h-0.5 bg-rust mb-8" />
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tight mb-4 leading-none text-white">
            {tenant.config.displayName}
          </h1>
          <p className="text-rust-light text-sm font-bold uppercase tracking-widest mb-6">
            Online booking
          </p>
          <p className="text-white/55 text-base mb-10 max-w-md leading-relaxed">
            Book ydelser direkte online — nemt, hurtigt og uden telefonkø.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/book"
              className="bg-rust hover:bg-rust-dark text-white text-xs font-black uppercase tracking-widest px-8 py-4 transition-colors"
            >
              Book nu
            </Link>
            <Link
              href="/kontakt"
              className="border border-white/30 hover:border-white text-white text-xs font-black uppercase tracking-widest px-8 py-4 transition-colors"
            >
              Kontakt os
            </Link>
          </div>
        </div>
      </section>

      {/* Services as info boxes */}
      {services && services.length > 0 && (
        <section className="bg-charcoal-mid text-white border-t border-white/10">
          <div className={`max-w-6xl mx-auto grid grid-cols-1 divide-y md:divide-y-0 md:divide-x divide-white/10
            ${services.length === 2 ? 'md:grid-cols-2' : services.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-1'}`}>
            {(services as Service[]).map(service => (
              <Link
                key={service.id}
                href={`/book/${service.id}`}
                className="group p-8 hover:bg-charcoal transition-colors"
              >
                <p className="text-xs font-black uppercase tracking-widest text-rust-light mb-4 group-hover:text-white transition-colors">
                  {service.name}
                </p>
                <p className="text-white/70 text-sm leading-relaxed">
                  {service.description ?? 'Book online'}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
