'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'

type Inv = { id: string; total_units: number } | null

export function InventoryRow({
  categoryId,
  serviceId,
  label,
  booked,
  inventory,
  upsertInventory,
  deleteSizeCategory,
}: {
  categoryId: string
  serviceId: string
  label: string
  booked: number
  inventory: Inv
  upsertInventory: (_prev: string | null | undefined, formData: FormData) => Promise<string | null>
  deleteSizeCategory: (formData: FormData) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [state, formAction, isPending] = useActionState(upsertInventory, undefined)
  const [isDeleting, startDelete] = useTransition()

  useEffect(() => {
    if (state === null) setEditing(false)
  }, [state])

  const total = inventory?.total_units ?? 0
  const pct = total > 0 ? Math.min(100, Math.round((booked / total) * 100)) : 0
  const barColor = pct < 50 ? 'bg-sand' : pct < 80 ? 'bg-rust-light' : 'bg-rust'

  function handleDelete() {
    if (!confirm(`Slet størrelsen "${label}"? Handlingen kan ikke fortrydes.`)) return
    startDelete(async () => {
      const fd = new FormData()
      fd.set('id', categoryId)
      await deleteSizeCategory(fd)
    })
  }

  return (
    <div className="px-4 py-3">
      {editing ? (
        <form action={formAction}>
          <input type="hidden" name="service_id" value={serviceId} />
          <input type="hidden" name="size_category_id" value={categoryId} />
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-charcoal flex-1 min-w-0">{label}</span>
            <label className="flex items-center gap-2 text-sm text-charcoal/60 shrink-0">
              Pladser
              <input
                type="number"
                name="total_units"
                defaultValue={inventory?.total_units ?? 1}
                min={1}
                max={9999}
                required
                className="w-20 border border-warm-gray rounded-lg px-2 py-1 text-sm text-charcoal focus:outline-none focus:border-rust"
              />
            </label>
            <button
              type="submit"
              disabled={isPending}
              className="text-xs font-medium text-offwhite bg-rust px-3 py-1.5 rounded-lg hover:bg-rust-dark transition-colors disabled:opacity-50 shrink-0"
            >
              {isPending ? '…' : 'Gem'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-xs text-charcoal/40 hover:text-charcoal shrink-0"
            >
              Annuller
            </button>
          </div>
          {typeof state === 'string' && (
            <p className="text-xs text-rust mt-1">{state}</p>
          )}
        </form>
      ) : (
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-charcoal flex-1 min-w-0">{label}</span>
          {total > 0 ? (
            <>
              <span className="text-sm text-charcoal/60 shrink-0 tabular-nums">
                {booked} / {total}
              </span>
              <div className="w-24 bg-warm-gray rounded-full h-1.5 shrink-0">
                <div
                  className={`${barColor} h-1.5 rounded-full transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </>
          ) : (
            <span className="text-xs text-charcoal/40 shrink-0">Ingen kapacitet sat</span>
          )}
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-charcoal/40 hover:text-charcoal transition-colors shrink-0"
          >
            Rediger
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-xs text-charcoal/30 hover:text-rust transition-colors shrink-0 disabled:opacity-50"
          >
            {isDeleting ? '…' : 'Slet'}
          </button>
        </div>
      )}
    </div>
  )
}
