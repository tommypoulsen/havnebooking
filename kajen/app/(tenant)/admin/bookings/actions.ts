'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { zUuid } from '@/lib/utils/zod'
import { createClient } from '@/lib/supabase/server'
import { getTenant } from '@/lib/utils/tenant'
import { calculateRefundOere } from '@/lib/utils/cancellation'
import { quickpayAuthHeader } from '@/lib/utils/quickpay'

export async function cancelOrder(
  _prev: string | null | undefined,
  formData: FormData,
): Promise<string | null> {
  const parsed = zUuid.safeParse(formData.get('order_id'))
  if (!parsed.success) return 'Ugyldig ordre-id'
  const orderId = parsed.data

  const supabase = await createClient()
  const tenant = await getTenant()
  if (!tenant) return 'Tenant ikke fundet'

  const { data: order } = await supabase
    .from('orders')
    .select('id, status, total_oere')
    .eq('id', orderId)
    .eq('tenant_id', tenant.id)
    .single()

  if (!order) return 'Ordre ikke fundet'
  if (order.status !== 'pending' && order.status !== 'confirmed')
    return 'Ordre er allerede annulleret eller refunderet'

  // Get order lines to find time slots (for capacity release) and service dates (for refund policy)
  const { data: lines } = await supabase
    .from('order_lines')
    .select('id, time_slot_id, starts_at')
    .eq('order_id', orderId)

  const timeSlotIds = (lines ?? []).map(l => l.time_slot_id).filter(Boolean) as string[]

  // Resolve starts_at for timeslot-based lines
  let slotStartsAt: Record<string, string> = {}
  if (timeSlotIds.length > 0) {
    const { data: slots } = await supabase
      .from('time_slots')
      .select('id, starts_at')
      .in('id', timeSlotIds)
    slotStartsAt = Object.fromEntries((slots ?? []).map(s => [s.id, s.starts_at]))
  }

  // Earliest service date across all lines — used to determine applicable refund policy
  const dates = (lines ?? [])
    .map(l => (l.time_slot_id ? slotStartsAt[l.time_slot_id] : l.starts_at))
    .filter(Boolean) as string[]
  const earliestDate = dates.sort()[0] ?? null

  // Get tenant cancellation policies (ordered most generous first)
  const { data: policies } = await supabase
    .from('cancellation_policies')
    .select('days_before, refund_pct')
    .eq('tenant_id', tenant.id)
    .order('days_before', { ascending: false })

  const refundOere = calculateRefundOere(order.total_oere, earliestDate, policies ?? [])

  // Get captured payment if any
  const { data: payment } = await supabase
    .from('payments')
    .select('id, provider_reference, amount_oere')
    .eq('order_id', orderId)
    .eq('status', 'captured')
    .maybeSingle()

  if (payment && refundOere > 0) {
    const refundRes = await fetch(
      `https://api.quickpay.net/payments/${payment.provider_reference}/refund`,
      {
        method: 'POST',
        headers: {
          Authorization:    quickpayAuthHeader(),
          'Accept-Version': 'v10',
          'Content-Type':   'application/json',
        },
        body: JSON.stringify({ amount: refundOere }),
      }
    )
    // QuickPay returns 202 Accepted on success
    if (!refundRes.ok) {
      console.error(
        `[cancelOrder] QuickPay refund failed for payment ${payment.provider_reference}: ${refundRes.status}`
      )
      return 'Refundering fejlede — betalingen er ikke tilbageført'
    }

    const { error: refundError } = await supabase.from('refunds').insert({
      payment_id: payment.id,
      amount_oere: refundOere,
      reason: 'Admin-annullering',
    })
    if (refundError) return 'Refundering fejlede — ordre ikke annulleret'

    if (refundOere >= payment.amount_oere) {
      await supabase.from('payments').update({ status: 'refunded' }).eq('id', payment.id)
    }
  }

  // Release time slot capacity — only if confirmed (booked_count was incremented at confirmation)
  if (order.status === 'confirmed') {
    for (const slotId of timeSlotIds) {
      await supabase.rpc('decrement_booked_count', { slot_id: slotId })
    }
  }

  const newStatus = payment && refundOere > 0 ? 'refunded' : 'cancelled'
  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)

  if (error) return 'Kunne ikke annullere ordre'

  revalidatePath('/admin/bookings')
  return null
}
