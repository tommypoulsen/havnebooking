'use server'

import { headers } from 'next/headers'
import { z } from 'zod'
import { zUuid } from '@/lib/utils/zod'
import { createServiceClient } from '@/lib/supabase/service'
import { getTenant } from '@/lib/utils/tenant'
import { calculatePrice, daysBetween } from '@/lib/utils/pricing'
import type { DurationType, PricingRule, Result } from '@/lib/types/domain'

const CreateOrderSchema = z.object({
  service_id:       zUuid,
  size_category_id: zUuid.nullable(),
  time_slot_id:     zUuid.nullable(),
  start_date:       z.string().nullable(),
  end_date:         z.string().nullable(),
  form_answers:     z.record(z.string(), z.string()),
  full_name:        z.string().min(2).max(200).trim(),
  email:            z.string().email().trim().toLowerCase(),
  phone:            z.string().min(5).max(50).trim(),
})

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>

function durationType(serviceType: string): DurationType {
  if (serviceType === 'timeslot') return 'per_lift'
  if (serviceType === 'capacity') return 'per_season'
  return 'per_day'
}

function quickpayAuthHeader() {
  return 'Basic ' + Buffer.from(':' + process.env.QUICKPAY_API_KEY).toString('base64')
}

export async function createOrder(
  input: CreateOrderInput,
): Promise<Result<{ paymentUrl: string }>> {
  const parsed = CreateOrderSchema.safeParse(input)
  if (!parsed.success) return { error: 'Ugyldige oplysninger — tjek venligst alle felter' }
  const data = parsed.data

  const tenant = await getTenant()
  if (!tenant) return { error: 'Tenant ikke fundet' }

  // Service role bypasses RLS — we enforce tenant isolation manually below
  const supabase = createServiceClient()

  // Verify service belongs to this tenant and is active
  const { data: service } = await supabase
    .from('services')
    .select('id, type, active')
    .eq('id', data.service_id)
    .eq('tenant_id', tenant.id)
    .single()

  if (!service || !service.active) return { error: 'Ydelsen er ikke tilgængelig' }

  // For timeslot services: verify slot exists for this service and has capacity
  if (service.type === 'timeslot') {
    if (!data.time_slot_id) return { error: 'Vælg venligst et tidspunkt' }
    const { data: slot } = await supabase
      .from('time_slots')
      .select('id, capacity, booked_count, service_id')
      .eq('id', data.time_slot_id)
      .eq('service_id', data.service_id)
      .single()

    if (!slot) return { error: 'Tidspunktet findes ikke' }
    if (slot.booked_count >= slot.capacity) return { error: 'Tidspunktet er desværre fuldt booket' }
  }

  // Compute price server-side — never trust client-supplied price
  const { data: rules } = await supabase
    .from('pricing_rules')
    .select('id, service_id, size_category_id, duration_type, price_oere, valid_from, valid_to')
    .eq('service_id', data.service_id)

  const dt = durationType(service.type)
  const days =
    data.start_date && data.end_date ? daysBetween(data.start_date, data.end_date) : 1

  const priceOere = calculatePrice(
    (rules as PricingRule[]) ?? [],
    data.size_category_id,
    dt,
    { days },
  )
  if (priceOere === null)
    return { error: 'Pris ikke tilgængelig for den valgte konfiguration' }

  // Find or create guest customer — auth_id is nullable for guest bookings
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', data.email)
    .eq('tenant_id', tenant.id)
    .maybeSingle()

  let userId: string

  if (existingUser) {
    userId = existingUser.id
    await supabase
      .from('users')
      .update({ full_name: data.full_name, phone: data.phone })
      .eq('id', existingUser.id)
  } else {
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        tenant_id: tenant.id,
        auth_id:   null,
        email:     data.email,
        role:      'customer',
        full_name: data.full_name,
        phone:     data.phone,
      })
      .select('id')
      .single()

    if (userError || !newUser) return { error: 'Kunne ikke registrere bruger' }
    userId = newUser.id
  }

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      tenant_id:  tenant.id,
      user_id:    userId,
      status:     'pending',
      total_oere: priceOere,
    })
    .select('id')
    .single()

  if (orderError || !order) return { error: 'Kunne ikke oprette ordre' }

  // Create order line
  const { error: lineError } = await supabase.from('order_lines').insert({
    order_id:         order.id,
    service_id:       data.service_id,
    size_category_id: data.size_category_id,
    time_slot_id:     data.time_slot_id,
    starts_at:        data.start_date,
    ends_at:          data.end_date,
    quantity:         1,
    unit_price_oere:  priceOere,
    line_total_oere:  priceOere,
    attributes:       data.form_answers,
  })

  if (lineError) {
    await supabase.from('orders').delete().eq('id', order.id)
    return { error: 'Kunne ikke gemme booking-detaljer' }
  }

  // Build base URL from request host (works locally and in production)
  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${protocol}://${host}`

  const confirmationUrl = `${baseUrl}/book/${data.service_id}/confirmation?order=${order.id}`

  // Dev bypass: if QUICKPAY_API_KEY is not configured, skip payment and confirm directly
  if (!process.env.QUICKPAY_API_KEY) {
    await supabase.from('orders').update({ status: 'confirmed' }).eq('id', order.id)
    return { data: { paymentUrl: confirmationUrl } }
  }

  // QuickPay: create payment
  // order_id max 20 chars [a-zA-Z0-9-]
  const qpOrderId = order.id.replace(/-/g, '').slice(0, 20)

  const paymentRes = await fetch('https://api.quickpay.net/payments', {
    method: 'POST',
    headers: {
      Authorization:    quickpayAuthHeader(),
      'Accept-Version': 'v10',
      'Content-Type':   'application/json',
    },
    body: JSON.stringify({ order_id: qpOrderId, currency: 'DKK' }),
  })

  if (!paymentRes.ok) {
    await supabase.from('orders').delete().eq('id', order.id)
    return { error: 'Betalingsgateway utilgængelig — prøv igen' }
  }

  const qpPayment = await paymentRes.json() as { id: number }

  // QuickPay: create payment link (hosted payment page)
  const linkRes = await fetch(`https://api.quickpay.net/payments/${qpPayment.id}/link`, {
    method: 'PUT',
    headers: {
      Authorization:    quickpayAuthHeader(),
      'Accept-Version': 'v10',
      'Content-Type':   'application/json',
    },
    body: JSON.stringify({
      amount:       priceOere,
      continue_url: confirmationUrl,
      cancel_url:   `${baseUrl}/book/${data.service_id}`,
      auto_capture: true,
    }),
  })

  if (!linkRes.ok) {
    await supabase.from('orders').delete().eq('id', order.id)
    return { error: 'Kunne ikke oprette betalingslink' }
  }

  const qpLink = await linkRes.json() as { url: string }

  // Record pending payment
  await supabase.from('payments').insert({
    order_id:           order.id,
    provider:           'quickpay',
    provider_reference: qpPayment.id.toString(),
    amount_oere:        priceOere,
    status:             'pending',
  })

  return { data: { paymentUrl: qpLink.url } }
}
