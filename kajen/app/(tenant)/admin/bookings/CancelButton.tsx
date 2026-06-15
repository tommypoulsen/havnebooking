'use client'

import { useActionState } from 'react'
import { cancelOrder } from './actions'

export function CancelButton({ orderId }: { orderId: string }) {
  const [state, formAction, isPending] = useActionState(cancelOrder, undefined)

  if (state === null) {
    return <span className="text-xs text-charcoal/40 italic">Annulleret</span>
  }

  return (
    <form
      action={formAction}
      onSubmit={e => {
        if (!confirm('Annuller denne booking? Eventuel refundering beregnes automatisk ud fra afbestillingspolitikken.')) {
          e.preventDefault()
        }
      }}
    >
      <input type="hidden" name="order_id" value={orderId} />
      {typeof state === 'string' && (
        <p className="text-xs text-danger mb-1">{state}</p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="text-xs text-danger hover:text-danger/70 disabled:opacity-40 transition-colors whitespace-nowrap"
      >
        {isPending ? 'Annullerer…' : 'Annuller'}
      </button>
    </form>
  )
}
