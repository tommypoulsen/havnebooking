'use client'

import { useActionState, useEffect, useRef } from 'react'

export function AddCategoryForm({
  serviceId,
  addSizeCategory,
}: {
  serviceId: string
  addSizeCategory: (_prev: string | null | undefined, formData: FormData) => Promise<string | null>
}) {
  const [state, formAction, isPending] = useActionState(addSizeCategory, undefined)
  const ref = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state === null) ref.current?.reset()
  }, [state])

  return (
    <div className="mt-3">
      <form ref={ref} action={formAction} className="flex gap-2 items-end">
        <input type="hidden" name="service_id" value={serviceId} />
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-xs text-charcoal/40">Størrelsesbetegnelse</span>
          <input
            type="text"
            name="label"
            placeholder="fx 0–3 ton"
            required
            className="border border-warm-gray rounded-lg px-3 py-2 text-sm text-charcoal focus:outline-none focus:border-rust"
          />
        </label>
        <label className="flex flex-col gap-1 w-28">
          <span className="text-xs text-charcoal/40">Antal pladser</span>
          <input
            type="number"
            name="total_units"
            min={1}
            max={9999}
            placeholder="20"
            required
            className="border border-warm-gray rounded-lg px-3 py-2 text-sm text-charcoal focus:outline-none focus:border-rust"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="bg-charcoal text-offwhite text-sm font-medium px-4 py-2 rounded-lg hover:bg-charcoal-mid transition-colors disabled:opacity-50 h-[38px] shrink-0"
        >
          {isPending ? '…' : '+ Tilføj'}
        </button>
      </form>
      {typeof state === 'string' && (
        <p className="text-xs text-rust mt-1">{state}</p>
      )}
      {state === null && (
        <p className="text-xs text-success mt-1">Størrelse tilføjet</p>
      )}
    </div>
  )
}
