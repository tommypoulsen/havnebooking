'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { zUuid } from '@/lib/utils/zod'
import { createClient } from '@/lib/supabase/server'
import { getTenant } from '@/lib/utils/tenant'

const CreateSchema = z.object({
  service_id: zUuid,
  date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time:       z.string().regex(/^\d{2}:\d{2}$/),
  capacity:   z.coerce.number().int().min(1).max(100),
})

const BatchSchema = z.object({
  service_id: zUuid,
  slots: z.array(z.object({
    starts_at: z.string().datetime(),
    capacity:  z.number().int().min(1).max(100),
  })).min(1).max(200),
})

async function verifyService(supabase: Awaited<ReturnType<typeof createClient>>, serviceId: string, tenantId: string) {
  const { data } = await supabase
    .from('services')
    .select('id')
    .eq('id', serviceId)
    .eq('tenant_id', tenantId)
    .single()
  return data
}

export async function createTimeSlot(
  _prev: string | null,
  formData: FormData
): Promise<string | null> {
  const parsed = CreateSchema.safeParse({
    service_id: formData.get('service_id'),
    date:       formData.get('date'),
    time:       formData.get('time'),
    capacity:   formData.get('capacity'),
  })
  if (!parsed.success) return 'Ugyldige værdier — tjek felterne'

  const { service_id, date, time, capacity } = parsed.data
  const starts_at = new Date(`${date}T${time}:00`).toISOString()

  const supabase = await createClient()
  const tenant = await getTenant()
  if (!tenant) return 'Tenant ikke fundet'

  if (!await verifyService(supabase, service_id, tenant.id)) return 'Ugyldig service'

  const { error } = await supabase
    .from('time_slots')
    .insert({ service_id, starts_at, capacity })

  if (error) return 'Kunne ikke oprette tidspunkt'

  revalidatePath('/admin/timeslots')
  return null
}

export async function createTimeSlotsFromSchedule(
  serviceId: string,
  slots: { starts_at: string; capacity: number }[]
): Promise<string | null> {
  const parsed = BatchSchema.safeParse({ service_id: serviceId, slots })
  if (!parsed.success) return 'Ugyldige værdier'

  const supabase = await createClient()
  const tenant = await getTenant()
  if (!tenant) return 'Tenant ikke fundet'

  if (!await verifyService(supabase, serviceId, tenant.id)) return 'Ugyldig service'

  const { error } = await supabase
    .from('time_slots')
    .upsert(
      parsed.data.slots.map(s => ({
        service_id: serviceId,
        starts_at:  s.starts_at,
        capacity:   s.capacity,
      })),
      { onConflict: 'service_id,starts_at', ignoreDuplicates: true }
    )

  if (error) return 'Kunne ikke oprette tidspunkter'

  revalidatePath('/admin/timeslots')
  return null
}

export async function deleteTimeSlot(formData: FormData): Promise<void> {
  const id = formData.get('id') as string

  const supabase = await createClient()
  const tenant = await getTenant()
  if (!tenant) return

  // Verify slot belongs to this tenant
  const { data: slot } = await supabase
    .from('time_slots')
    .select('id, service_id, booked_count')
    .eq('id', id)
    .single()

  if (!slot || slot.booked_count > 0) return

  await supabase.from('time_slots').delete().eq('id', id)
  revalidatePath('/admin/timeslots')
}
