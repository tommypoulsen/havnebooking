import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTenant } from '@/lib/utils/tenant'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils/pricing'
import type { OrderStatus } from '@/lib/types/domain'
import { CancelButton } from './CancelButton'

function formatDate(d: string) {
  return new Intl.DateTimeFormat('da-DK', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(d))
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending:   'Afventer',
  confirmed: 'Bekræftet',
  cancelled: 'Annulleret',
  refunded:  'Refunderet',
}

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending:   'bg-sand-light text-charcoal/70',
  confirmed: 'bg-success-bg text-success',
  cancelled: 'bg-warm-gray text-charcoal/50',
  refunded:  'bg-warm-gray text-charcoal/50',
}

const FILTERS: { value: string; label: string }[] = [
  { value: 'alle',      label: 'Alle' },
  { value: 'pending',   label: 'Afventer' },
  { value: 'confirmed', label: 'Bekræftet' },
  { value: 'cancelled', label: 'Annulleret' },
  { value: 'refunded',  label: 'Refunderet' },
]

const CANCELLABLE: OrderStatus[] = ['pending', 'confirmed']

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter } = await searchParams
  const activeFilter = FILTERS.find(f => f.value === filter)?.value ?? 'alle'

  const tenant = await getTenant()
  if (!tenant) notFound()

  const supabase = await createClient()

  let query = supabase
    .from('orders')
    .select('id, status, total_oere, created_at, users(full_name, email)')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })
    .limit(200)

  if (activeFilter !== 'alle') {
    query = query.eq('status', activeFilter)
  }

  const { data: orders } = await query

  type OrderRow = {
    id: string
    status: OrderStatus
    total_oere: number
    created_at: string
    users: { full_name: string | null; email: string | null } | null
  }

  const rows = (orders as OrderRow[] | null) ?? []

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-charcoal">Bookinger</h1>
        <p className="text-sm text-charcoal/40">{rows.length} {activeFilter === 'alle' ? 'total' : STATUS_LABEL[activeFilter as OrderStatus]?.toLowerCase()}</p>
      </div>

      {/* Filter tabs */}
      <div className="border-b border-warm-gray mb-6">
        <div className="flex gap-1">
          {FILTERS.map(f => (
            <Link
              key={f.value}
              href={f.value === 'alle' ? '/admin/bookings' : `/admin/bookings?filter=${f.value}`}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
                ${activeFilter === f.value
                  ? 'border-charcoal text-charcoal'
                  : 'border-transparent text-charcoal/40 hover:text-charcoal/70'}`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-charcoal/50 text-sm">Ingen bookinger endnu.</p>
      ) : (
        <div className="bg-white rounded-xl border border-warm-gray overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-warm-gray bg-offwhite">
                <th className="text-left px-4 py-3 font-medium text-charcoal/60">Kunde</th>
                <th className="text-left px-4 py-3 font-medium text-charcoal/60">Oprettet</th>
                <th className="text-left px-4 py-3 font-medium text-charcoal/60">Status</th>
                <th className="text-right px-4 py-3 font-medium text-charcoal/60">Total</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((order, i) => (
                <tr
                  key={order.id}
                  className={`border-b border-warm-gray ${i % 2 === 0 ? 'bg-white' : 'bg-offwhite'}`}
                >
                  <td className="px-4 py-3">
                    <p className="text-charcoal font-medium">{order.users?.full_name ?? '—'}</p>
                    <p className="text-charcoal/50 text-xs">{order.users?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-charcoal/70 whitespace-nowrap">{formatDate(order.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLOR[order.status]}`}>
                      {STATUS_LABEL[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-rust font-medium whitespace-nowrap">
                    {formatPrice(order.total_oere)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {CANCELLABLE.includes(order.status) && (
                      <CancelButton orderId={order.id} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
