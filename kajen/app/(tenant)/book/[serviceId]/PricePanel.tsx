'use client'

import { formatPrice } from '@/lib/utils/pricing'
import type { ResolvedLine } from '@/lib/utils/addons'

export function PricePanel({
  primaryLabel,
  primaryAmountOere,
  addOnLines,
}: {
  primaryLabel: string
  primaryAmountOere: number | null
  addOnLines: ResolvedLine[]
}) {
  const hasPrice = primaryAmountOere !== null

  const totalOere = hasPrice
    ? primaryAmountOere + addOnLines.reduce((s, l) => s + l.amountOere * l.quantity, 0)
    : null

  return (
    <div className="bg-white border border-warm-gray rounded-xl p-5">
      <h3 className="text-sm font-bold uppercase tracking-widest text-charcoal/40 mb-4">
        Din ordre
      </h3>

      {!hasPrice ? (
        <p className="text-sm text-charcoal/50">
          Prisen beregnes efterhånden som du vælger.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2 mb-4">
            <PriceLine label={primaryLabel} amountOere={primaryAmountOere} />
            {addOnLines.map(line => (
              <PriceLine
                key={line.ruleId}
                label={line.label}
                amountOere={line.amountOere * line.quantity}
              />
            ))}
          </div>
          <div className="border-t border-warm-gray pt-3 flex justify-between items-baseline">
            <span className="text-sm font-semibold text-charcoal">Total</span>
            <span className="text-xl font-bold text-rust">{formatPrice(totalOere!)}</span>
          </div>
        </>
      )}
    </div>
  )
}

function PriceLine({ label, amountOere }: { label: string; amountOere: number }) {
  return (
    <div className="flex justify-between items-start gap-3">
      <span className="text-sm text-charcoal/70">{label}</span>
      <span className="text-sm text-charcoal shrink-0">{formatPrice(amountOere)}</span>
    </div>
  )
}
