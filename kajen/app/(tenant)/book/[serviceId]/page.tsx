import { notFound } from 'next/navigation'
import { getTenant } from '@/lib/utils/tenant'
import { createClient } from '@/lib/supabase/server'
import { BookingWizard } from './BookingWizard'
import type { Service, SizeCategory, PricingRule, TimeSlot } from '@/lib/types/domain'

export default async function BookingPage({
  params,
}: {
  params: Promise<{ serviceId: string }>
}) {
  const { serviceId } = await params
  const tenant = await getTenant()
  if (!tenant) notFound()

  const supabase = await createClient()

  const { data: service } = await supabase
    .from('services')
    .select('id, name, description, type, config, tenant_id')
    .eq('id', serviceId)
    .eq('tenant_id', tenant.id)
    .eq('active', true)
    .single()

  if (!service) notFound()

  const [{ data: sizeCategories }, { data: pricingRules }, { data: timeSlots }] =
    await Promise.all([
      supabase
        .from('size_categories')
        .select('id, service_id, label, description, sort_order')
        .eq('service_id', serviceId)
        .order('sort_order'),
      supabase
        .from('pricing_rules')
        .select('id, service_id, size_category_id, duration_type, price_oere, valid_from, valid_to')
        .eq('service_id', serviceId),
      service.type === 'timeslot'
        ? supabase
            .from('time_slots')
            .select('id, service_id, starts_at, capacity, booked_count')
            .eq('service_id', serviceId)
            .gt('starts_at', new Date().toISOString())
            .order('starts_at')
            .limit(60)
        : { data: [] },
    ])

  // Filter to available slots only (client can't do this without raw SQL)
  const availableSlots = (timeSlots as TimeSlot[] | null)?.filter(
    s => s.booked_count < s.capacity
  ) ?? []

  return (
    <main className="min-h-screen bg-offwhite">
      <div className="max-w-xl mx-auto px-4 py-12">
        <BookingWizard
          service={service as Service}
          sizeCategories={(sizeCategories as SizeCategory[]) ?? []}
          pricingRules={(pricingRules as PricingRule[]) ?? []}
          timeSlots={availableSlots}
        />
      </div>
    </main>
  )
}
