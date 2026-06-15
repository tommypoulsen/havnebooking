import { createHmac } from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'

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
    .single()

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

  for (const slotId of timeSlotIds) {
    const { data: ok } = await supabase.rpc('increment_booked_count', { slot_id: slotId })
    if (!ok) {
      capacityOk = false
      console.error(
        `[quickpay webhook] Slot ${slotId} at capacity for order ${payment.order_id}`
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

  // TODO: send booking confirmation email via Resend
  // await sendConfirmationEmail(payment.order_id)

  return new Response('OK', { status: 200 })
}
