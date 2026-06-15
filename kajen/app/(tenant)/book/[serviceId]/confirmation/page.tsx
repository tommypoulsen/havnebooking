import { notFound } from 'next/navigation'
import { getTenant } from '@/lib/utils/tenant'
import { createServiceClient } from '@/lib/supabase/service'
import { formatPrice } from '@/lib/utils/pricing'
import { zUuid } from '@/lib/utils/zod'

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>
}) {
  const { order: rawOrderId } = await searchParams
  const parsed = zUuid.safeParse(rawOrderId)
  if (!parsed.success) notFound()
  const orderId = parsed.data

  const tenant = await getTenant()
  if (!tenant) notFound()

  // Service client needed: the customer is not authenticated at this point
  const supabase = createServiceClient()

  const { data: order } = await supabase
    .from('orders')
    .select('id, status, total_oere')
    .eq('id', orderId)
    .eq('tenant_id', tenant.id)
    .maybeSingle()

  // Don't expose order details if it was cancelled or doesn't exist
  if (!order || order.status === 'cancelled') notFound()

  const shortId = orderId.replace(/-/g, '').slice(0, 8).toUpperCase()

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="max-w-xl">
        <div className="mb-8">
          <div className="w-12 h-12 rounded-full bg-success-bg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-charcoal mb-2">
            Tak for din booking
          </h1>
          <p className="text-charcoal/60">
            Du modtager en bekræftelse på e-mail inden for kort tid.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-warm-gray p-6 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-charcoal/40 mb-4">
            Ordredetaljer
          </p>
          <div className="flex justify-between items-center">
            <span className="text-sm text-charcoal/60">Ordrenummer</span>
            <span className="text-sm font-mono text-charcoal">{shortId}</span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-warm-gray">
            <span className="font-semibold text-charcoal">Total betalt</span>
            <span className="font-bold text-xl text-rust">{formatPrice(order.total_oere)}</span>
          </div>
        </div>

        <a
          href="/"
          className="mt-6 inline-block text-sm text-charcoal/50 hover:text-rust transition-colors"
        >
          ← Tilbage til forsiden
        </a>
      </div>
    </div>
  )
}
