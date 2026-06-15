'use client'

import { useActionState } from 'react'
import { createTenantUser } from '../actions'

export function CreateUserForm({ tenantId }: { tenantId: string }) {
  const [error, formAction, isPending] = useActionState(createTenantUser, null)

  return (
    <form aria-label="Opret bruger" action={formAction} className="grid grid-cols-2 gap-3 pt-4 border-t border-warm-gray">
      <input type="hidden" name="tenant_id" value={tenantId} />

      <label className="col-span-2 sm:col-span-1 flex flex-col gap-1">
        <span className="text-xs font-medium text-charcoal/60">Navn</span>
        <input
          name="full_name"
          required
          className="w-full border border-warm-gray rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-charcoal/20"
          placeholder="Fornavn Efternavn"
        />
      </label>

      <label className="col-span-2 sm:col-span-1 flex flex-col gap-1">
        <span className="text-xs font-medium text-charcoal/60">E-mail</span>
        <input
          name="email"
          type="email"
          required
          className="w-full border border-warm-gray rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-charcoal/20"
          placeholder="navn@havn.dk"
        />
      </label>

      <label className="col-span-2 sm:col-span-1 flex flex-col gap-1">
        <span className="text-xs font-medium text-charcoal/60">Adgangskode</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className="w-full border border-warm-gray rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-charcoal/20"
          placeholder="Min. 8 tegn"
        />
      </label>

      <label className="col-span-2 sm:col-span-1 flex flex-col gap-1">
        <span className="text-xs font-medium text-charcoal/60">Rolle</span>
        <select
          name="role"
          className="w-full border border-warm-gray rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-charcoal/20 bg-white"
        >
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
        </select>
      </label>

      {error && (
        <p className="col-span-2 text-xs text-danger">{error}</p>
      )}

      <div className="col-span-2">
        <button
          type="submit"
          disabled={isPending}
          className="text-xs bg-charcoal hover:bg-charcoal-mid disabled:opacity-40 text-white font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {isPending ? 'Opretter…' : 'Opret bruger'}
        </button>
      </div>
    </form>
  )
}
