'use server'

import { z } from 'zod'
import { headers } from 'next/headers'
import { zUuid } from '@/lib/utils/zod'
import { createServiceClient } from '@/lib/supabase/service'
import { getTenant } from '@/lib/utils/tenant'
import { calculatePrice, daysBetween } from '@/lib/utils/pricing'
import { resolveAddOns } from '@/lib/utils/addons'
import { filterVisibleFormAnswers } from '@/lib/utils/form'
import { deriveOrderId, quickpayAuthHeader } from '@/lib/utils/quickpay'
import type { DurationType, PricingRule, ServiceConfig, Result } from '@/lib/types/domain'

const QpPaymentSchema = z.object({ id: z.number() })
const QpLinkSchema    = z.object({ url: z.string().url() })

const CreateOrderSchema = z.object({
  service_id:       zUuid,
  size_category_id: zUuid.nullable(),
  time_slot_id:     zUuid.nullable(),
  start_date:       z.string().nullable(),
  end_date:         z.string().nullable(),
  form_answers:     z.record(z.string().max(100), z.string().max(1000)),
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
    .select('id, name, type, active, config')
    .eq('id', data.service_id)
    .eq('tenant_id', tenant.id)
    .single()

  if (!service || !service.active) return { error: 'Ydelsen er ikke tilgængelig' }

  const serviceConfig = service.config as unknown as ServiceConfig

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

  // Apply server-side visibility filtering before add-on resolution.
  // Replicates the client's dependsOn logic to strip stale hidden-field values.
  const visibleFormAnswers = filterVisibleFormAnswers(
    serviceConfig.formFields ?? [],
    data.form_answers,
  )

  // Resolve add-ons before order creation so total is known upfront
  const addOnRules = serviceConfig.addOnRules ?? []
  let resolvedAddOns: ReturnType<typeof resolveAddOns> = []

  if (addOnRules.length > 0) {
    const addOnServiceIds = [...new Set(addOnRules.filter(r => r.serviceId).map(r => r.serviceId!))]
    const { data: addOnPricing } = addOnServiceIds.length > 0
      ? await supabase
          .from('pricing_rules')
          .select('id, service_id, size_category_id, duration_type, price_oere, valid_from, valid_to')
          .in('service_id', addOnServiceIds)
      : { data: [] }

    const pricingByService = (addOnPricing ?? []).reduce<Record<string, PricingRule[]>>((acc, r) => {
      ;(acc[r.service_id] ??= []).push(r as PricingRule)
      return acc
    }, {})

    resolvedAddOns = resolveAddOns(addOnRules, visibleFormAnswers, data.size_category_id, pricingByService)
  }

  const addOnTotal = resolvedAddOns.reduce((s, l) => s + l.amountOere * l.quantity, 0)
  const totalOere = priceOere + addOnTotal

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

  // Create order and all lines atomically in a single transaction
  const { data: rpcData, error: orderError } = await supabase.rpc(
    'create_order_with_lines',
    {
      p_tenant_id:    tenant.id,
      p_user_id:      userId,
      p_total_oere:   totalOere,
      p_primary_line: {
        service_id:       data.service_id,
        size_category_id: data.size_category_id,
        time_slot_id:     data.time_slot_id,
        starts_at:        data.start_date,
        ends_at:          data.end_date,
        unit_price_oere:  priceOere,
        label:            service.name,
        attributes:       visibleFormAnswers,
      },
      p_addon_lines: resolvedAddOns.map(l => ({
        service_id:       l.serviceId ?? data.service_id,
        size_category_id: l.sizeCategoryId ?? data.size_category_id,
        quantity:         l.quantity,
        unit_price_oere:  l.amountOere,
        line_total_oere:  l.amountOere * l.quantity,
        label:            l.label,
        attributes:       { add_on_rule_id: l.ruleId },
      })),
    }
  )

  const orderId = rpcData as string | null
  if (orderError || !orderId) return { error: 'Kunne ikke oprette ordre' }

  // Derive base URL: explicit env var wins, then host header (normalized by reverse proxy in prod)
  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1')
  const protocol = isLocalhost ? 'http' : 'https'
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    `${protocol}://${host}`

  const confirmationUrl = `${baseUrl}/book/${data.service_id}/confirmation?order=${orderId}`

  // Dev bypass: if QUICKPAY_API_KEY is not configured, skip payment and confirm directly.
  // In production this must never happen — throw so misconfiguration is immediately visible.
  if (!process.env.QUICKPAY_API_KEY) {
    if (process.env.NODE_ENV === 'production')
      throw new Error('[createOrder] QUICKPAY_API_KEY is not set in production')
    await supabase.from('orders').update({ status: 'confirmed' }).eq('id', orderId)
    return { data: { paymentUrl: confirmationUrl } }
  }

  // QuickPay: create payment — derive a deterministic 20-char hex ID from the order UUID
  const qpOrderId = deriveOrderId(orderId)

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
    await supabase.from('orders').delete().eq('id', orderId)
    return { error: 'Betalingsgateway utilgængelig — prøv igen' }
  }

  const qpPaymentParsed = QpPaymentSchema.safeParse(await paymentRes.json())
  if (!qpPaymentParsed.success) {
    await supabase.from('orders').delete().eq('id', orderId)
    return { error: 'Uventet svar fra betalingsgateway' }
  }
  const qpPayment = qpPaymentParsed.data

  // QuickPay: create payment link (hosted payment page)
  const linkRes = await fetch(`https://api.quickpay.net/payments/${qpPayment.id}/link`, {
    method: 'PUT',
    headers: {
      Authorization:    quickpayAuthHeader(),
      'Accept-Version': 'v10',
      'Content-Type':   'application/json',
    },
    body: JSON.stringify({
      amount:       totalOere,
      continue_url: confirmationUrl,
      cancel_url:   `${baseUrl}/book/${data.service_id}`,
      auto_capture: true,
    }),
  })

  if (!linkRes.ok) {
    await supabase.from('orders').delete().eq('id', orderId)
    return { error: 'Kunne ikke oprette betalingslink' }
  }

  const qpLinkParsed = QpLinkSchema.safeParse(await linkRes.json())
  if (!qpLinkParsed.success) {
    await supabase.from('orders').delete().eq('id', orderId)
    return { error: 'Uventet svar fra betalingsgateway (link)' }
  }
  const qpLink = qpLinkParsed.data

  // Record pending payment
  await supabase.from('payments').insert({
    order_id:           orderId,
    provider:           'quickpay',
    provider_reference: qpPayment.id.toString(),
    amount_oere:        totalOere,
    status:             'pending',
  })

  return { data: { paymentUrl: qpLink.url } }
}
