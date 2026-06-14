'use client'

import { useActionState } from 'react'
import { updatePricingRule } from './actions'
import { formatPrice } from '@/lib/utils/pricing'
import type { PricingRule, SizeCategory } from '@/lib/types/domain'

const DURATION_LABEL: Record<string, string> = {
  per_lift:   'pr. løft',
  per_season: 'pr. sæson',
  per_day:    'pr. dag',
}

export function PriceRow({
  rule,
  sizeLabel,
  serviceName,
}: {
  rule: PricingRule
  sizeLabel: string | null
  serviceName: string
}) {
  const [error, formAction, isPending] = useActionState(updatePricingRule, null)

  return (
    <tr>
      <td className="px-4 py-3 text-charcoal">{serviceName}</td>
      <td className="px-4 py-3 text-charcoal">{sizeLabel ?? 'Alle størrelser'}</td>
      <td className="px-4 py-3 text-charcoal/60">{DURATION_LABEL[rule.duration_type]}</td>
      <td className="px-4 py-3">
        <form action={formAction} className="flex items-center gap-2">
          <input type="hidden" name="id" value={rule.id} />
          <input
            name="price_oere"
            type="number"
            required
            min={1}
            defaultValue={rule.price_oere}
            className="w-28 border border-warm-gray rounded-lg px-2 py-1 text-sm text-charcoal focus:outline-none focus:border-rust text-right"
          />
          <span className="text-xs text-charcoal/40">øre</span>
          <button
            type="submit"
            disabled={isPending}
            className="text-xs bg-rust text-offwhite px-3 py-1 rounded-lg hover:bg-rust-dark transition-colors disabled:opacity-50"
          >
            {isPending ? '…' : 'Gem'}
          </button>
          {error && <span className="text-xs text-rust">{error}</span>}
        </form>
        <p className="text-xs text-charcoal/40 mt-0.5 pl-0.5">
          = {formatPrice(rule.price_oere)}
        </p>
      </td>
    </tr>
  )
}
