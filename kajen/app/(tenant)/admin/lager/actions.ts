'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { zUuid } from '@/lib/utils/zod'
import { createClient } from '@/lib/supabase/server'
import { getTenant } from '@/lib/utils/tenant'

async function verifyService(
  supabase: Awaited<ReturnType<typeof createClient>>,
  serviceId: string,
  tenantId: string,
) {
  const { data } = await supabase
    .from('services')
    .select('id')
    .eq('id', serviceId)
    .eq('tenant_id', tenantId)
    .single()
  return data
}

const UpsertSchema = z.object({
  service_id:       zUuid,
  size_category_id: zUuid,
  total_units:      z.coerce.number().int().min(1).max(9999),
})

export async function upsertInventory(
  _prev: string | null | undefined,
  formData: FormData
): Promise<string | null> {
  const parsed = UpsertSchema.safeParse({
    service_id:       formData.get('service_id'),
    size_category_id: formData.get('size_category_id'),
    total_units:      formData.get('total_units'),
  })
  if (!parsed.success) return parsed.error.issues[0].message

  const supabase = await createClient()
  const tenant = await getTenant()
  if (!tenant) return 'Tenant ikke fundet'

  if (!await verifyService(supabase, parsed.data.service_id, tenant.id))
    return 'Ikke autoriseret'

  const { data: activeOrders } = await supabase
    .from('orders')
    .select('id')
    .in('status', ['confirmed', 'pending'])

  const activeOrderIds = activeOrders?.map(o => o.id) ?? []
  let confirmedCount = 0
  if (activeOrderIds.length > 0) {
    const { count } = await supabase
      .from('order_lines')
      .select('id', { count: 'exact', head: true })
      .eq('size_category_id', parsed.data.size_category_id)
      .in('order_id', activeOrderIds)
    confirmedCount = count ?? 0
  }

  if (parsed.data.total_units < confirmedCount)
    return `Kan ikke sætte kapacitet til ${parsed.data.total_units} — der er ${confirmedCount} aktive bookinger`

  const { error } = await supabase
    .from('capacity_inventory')
    .upsert(
      {
        service_id:       parsed.data.service_id,
        size_category_id: parsed.data.size_category_id,
        total_units:      parsed.data.total_units,
      },
      { onConflict: 'service_id,size_category_id' }
    )

  if (error) return 'Kunne ikke gemme kapacitet'

  revalidatePath('/admin/lager')
  return null
}

const AddSchema = z.object({
  service_id:  zUuid,
  label:       z.string().min(1).max(100).trim(),
  total_units: z.coerce.number().int().min(1).max(9999),
})

export async function addSizeCategory(
  _prev: string | null | undefined,
  formData: FormData
): Promise<string | null> {
  const parsed = AddSchema.safeParse({
    service_id:  formData.get('service_id'),
    label:       formData.get('label'),
    total_units: formData.get('total_units'),
  })
  if (!parsed.success) return parsed.error.issues[0].message

  const supabase = await createClient()
  const tenant = await getTenant()
  if (!tenant) return 'Tenant ikke fundet'

  if (!await verifyService(supabase, parsed.data.service_id, tenant.id))
    return 'Ikke autoriseret'

  const { data: existing } = await supabase
    .from('size_categories')
    .select('sort_order')
    .eq('service_id', parsed.data.service_id)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextSortOrder = (existing?.[0]?.sort_order ?? -1) + 1

  const { data: category, error: catError } = await supabase
    .from('size_categories')
    .insert({
      service_id: parsed.data.service_id,
      label:      parsed.data.label,
      sort_order: nextSortOrder,
    })
    .select('id')
    .single()

  if (catError || !category) return 'Kunne ikke oprette størrelse'

  const { error: invError } = await supabase
    .from('capacity_inventory')
    .insert({
      service_id:       parsed.data.service_id,
      size_category_id: category.id,
      total_units:      parsed.data.total_units,
    })

  if (invError) return 'Størrelse oprettet men kapacitet fejlede'

  revalidatePath('/admin/lager')
  return null
}

export async function deleteSizeCategory(formData: FormData): Promise<void> {
  const parsed = zUuid.safeParse(formData.get('id'))
  if (!parsed.success) return
  const id = parsed.data

  const supabase = await createClient()
  const tenant = await getTenant()
  if (!tenant) return

  const { data: cat } = await supabase
    .from('size_categories')
    .select('id, service_id')
    .eq('id', id)
    .single()

  if (!cat) return
  if (!await verifyService(supabase, cat.service_id, tenant.id)) return

  // Block deletion if bookings exist for this category
  const { count } = await supabase
    .from('order_lines')
    .select('id', { count: 'exact', head: true })
    .eq('size_category_id', id)

  if (count && count > 0) return

  await supabase.from('size_categories').delete().eq('id', id)
  revalidatePath('/admin/lager')
}
