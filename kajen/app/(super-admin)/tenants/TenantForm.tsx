'use client'

import { useActionState, useEffect } from 'react'
import type { Tenant } from '@/lib/types/domain'

type Action = (prev: string | null | undefined, formData: FormData) => Promise<string | null>

type Props = {
  action: Action
  tenant?: Tenant
  onSuccess?: () => void
}

export function TenantForm({ action, tenant, onSuccess }: Props) {
  const [state, formAction, isPending] = useActionState(action, undefined)

  useEffect(() => {
    if (state === null) onSuccess?.()
  }, [state, onSuccess])

  const config = tenant?.config

  return (
    <form action={formAction} className="space-y-5">
      {tenant && <input type="hidden" name="id" value={tenant.id} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Navn" name="name" defaultValue={tenant?.name} required
          hint="Fuldt juridisk navn" />
        <Field label="Subdomæne" name="subdomain" defaultValue={tenant?.subdomain} required
          hint="Kun små bogstaver, tal og - (fx hundested)" />
      </div>

      <div className="border-t border-warm-gray pt-5">
        <p className="text-xs font-black uppercase tracking-widest text-charcoal/40 mb-4">Kontaktoplysninger</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Visningsnavn" name="displayName" defaultValue={config?.displayName} required />
          <Field label="Kontakt-e-mail" name="contactEmail" type="email" defaultValue={config?.contactEmail} required />
          <Field label="Telefon" name="contactPhone" defaultValue={config?.contactPhone} />
          <Field label="Åbningstider" name="contactHours" defaultValue={config?.contactHours} />
        </div>
        <div className="mt-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-charcoal/60">Adresse <span className="text-charcoal/30">(én linje pr. adresselinje)</span></span>
            <textarea
              name="contactAddress"
              rows={2}
              defaultValue={config?.contactAddress?.join('\n')}
              className="border border-warm-gray rounded-lg px-3 py-2 text-sm text-charcoal focus:outline-none focus:border-charcoal resize-none"
            />
          </label>
        </div>
      </div>

      {typeof state === 'string' && (
        <p className="text-sm text-rust bg-rust/10 rounded-lg px-3 py-2">{state}</p>
      )}
      {state === null && (
        <p className="text-sm text-success bg-success-bg rounded-lg px-3 py-2">Gemt</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-charcoal hover:bg-charcoal-mid text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50"
      >
        {isPending ? 'Gemmer…' : tenant ? 'Gem ændringer' : 'Opret tenant'}
      </button>
    </form>
  )
}

function Field({
  label, name, defaultValue, required, type = 'text', hint,
}: {
  label: string
  name: string
  defaultValue?: string
  required?: boolean
  type?: string
  hint?: string
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-charcoal/60">
        {label}{required && <span className="text-rust ml-0.5">*</span>}
        {hint && <span className="text-charcoal/30 ml-1">({hint})</span>}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="border border-warm-gray rounded-lg px-3 py-2 text-sm text-charcoal focus:outline-none focus:border-charcoal"
      />
    </label>
  )
}
