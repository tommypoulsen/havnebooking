import { createHmac } from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { sendBookingConfirmation } from '@/lib/email/sendBookingConfirmation'
import { formatPrice } from '@/lib/utils/pricing'

type QpOperation = {
  id: number
  type: string
  amount: number
  pending: boolean
  qp_status_code: string
}

type QpWebhookPayload = {
  id: number
  order_id: string
  accepted: boolean
  currency: string
  operations: QpOperation[]
}

export async function POST(request: Request) {
  const rawBody = await request.text()

  // Validate HMAC-SHA256 signature using the QuickPay private key
  const signature = request.headers.get('quickpay-checksum-sha256')
  const privateKey = process.env.QUICKPAY_PRIVATE_KEY

  if (!privateKey) {
    console.error('[quickpay webhook] QUICKPAY_PRIVATE_KEY not set')
    return new Response('Configuration error', { status: 500 })
  }

  const computed = createHmac('sha256', privateKey).update(rawBody).digest('hex')
  if (signature !== computed) {
    console.warn('[quickpay webhook] Invalid signature')
    return new Response('Invalid signature', { status: 403 })
  }

  let payload: QpWebhookPayload
  try {
    payload = JSON.parse(rawBody) as QpWebhookPayload
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  // Only process accepted (paid) callbacks
  if (!payload.accepted) {
    return new Response('OK', { status: 200 })
  }

  const providerReference = payload.id.toString()
  const supabase = createServiceClient()

  // Idempotency: skip if already captured
  const { data: payment } = await supabase
    .from('payments')
    .select('id, status, order_id, amount_oere')
    .eq('provider_reference', providerReference)
    .maybeSingle()

  if (!payment) {
    console.error('[quickpay webhook] No payment found for provider_reference:', providerReference)
    return new Response('OK', { status: 200 })
  }

  if (payment.status === 'captured') {
    return new Response('OK', { status: 200 })
  }

  // Mark payment as captured
  await supabase
    .from('payments')
    .update({ status: 'captured' })
    .eq('id', payment.id)

  // Get order lines to find time slots that need booked_count incremented
  const { data: lines } = await supabase
    .from('order_lines')
    .select('time_slot_id')
    .eq('order_id', payment.order_id)

  const timeSlotIds = (lines ?? []).map(l => l.time_slot_id).filter(Boolean) as string[]
  let capacityOk = true

  if (timeSlotIds.length > 0) {
    const { data: allOk } = await supabase.rpc('increment_booked_count_bulk', {
      slot_ids: timeSlotIds,
    })
    capacityOk = allOk === true
    if (!capacityOk) {
      console.error(
        `[quickpay webhook] One or more slots at capacity for order ${payment.order_id}`
      )
    }
  }

  if (!capacityOk) {
    // Slot became full between selection and payment. Cancel and mark for manual refund.
    // TODO: trigger QuickPay refund API call automatically once refund flow is wired up.
    await supabase.from('payments').update({ status: 'refunded' }).eq('id', payment.id)
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', payment.order_id)
    console.error(
      `[quickpay webhook] Order ${payment.order_id} cancelled — manual refund of ${payment.amount_oere} øre required`
    )
    return new Response('OK', { status: 200 })
  }

  // Confirm order
  await supabase
    .from('orders')
    .update({ status: 'confirmed' })
    .eq('id', payment.order_id)

  // Send confirmation email — wrapped in try/catch so email failure never causes non-200
  // (QuickPay would retry the webhook if we returned 5xx)
  try {
    const { data: orderData } = await supabase
      .from('orders')
      .select(`
        id, total_oere,
        users ( email ),
        order_lines (
          starts_at, ends_at,
          services ( name ),
          time_slots ( starts_at )
        ),
        tenants ( config )
      `)
      .eq('id', payment.order_id)
      .single()

    if (orderData) {
      const user    = Array.isArray(orderData.users) ? orderData.users[0] : orderData.users
      const tenant  = Array.isArray(orderData.tenants) ? orderData.tenants[0] : orderData.tenants
      const line    = Array.isArray(orderData.order_lines) ? orderData.order_lines[0] : orderData.order_lines
      const service = line && (Array.isArray(line.services) ? line.services[0] : line.services)
      const slot    = line && (Array.isArray(line.time_slots) ? line.time_slots[0] : line.time_slots)

      const dateStr = slot?.starts_at
        ? new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(slot.starts_at))
        : line?.starts_at
          ? new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(line.starts_at))
          : '—'

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const config = (tenant as any)?.config ?? {}

      if (user?.email && service?.name) {
        await sendBookingConfirmation({
          toEmail:            user.email,
          orderId:            orderData.id,
          serviceName:        service.name,
          formattedDates:     dateStr,
          totalDkk:           formatPrice(orderData.total_oere),
          tenantDisplayName:  config.displayName ?? '',
          tenantContactEmail: config.contactEmail ?? '',
        })
      }
    }
  } catch (emailErr) {
    console.error('[quickpay webhook] Confirmation email failed:', emailErr)
  }

  return new Response('OK', { status: 200 })
}
