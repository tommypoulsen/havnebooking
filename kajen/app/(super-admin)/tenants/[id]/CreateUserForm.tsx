'use client'

import { useActionState } from 'react'
import { createTenantUser } from '../actions'

export function CreateUserForm({ tenantId }: { tenantId: string }) {
  const [error, formAction, isPending] = useActionState(createTenantUser, null)

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3 pt-4 border-t border-warm-gray">
      <input type="hidden" name="tenant_id" value={tenantId} />

      <div className="col-span-2 sm:col-span-1">
        <label className="block text-xs font-medium text-charcoal/60 mb-1">Navn</label>
        <input
          name="full_name"
          required
          className="w-full border border-warm-gray rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-charcoal/20"
          placeholder="Fornavn Efternavn"
        />
      </div>

      <div className="col-span-2 sm:col-span-1">
        <label className="block text-xs font-medium text-charcoal/60 mb-1">E-mail</label>
        <input
          name="email"
          type="email"
          required
          className="w-full border border-warm-gray rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-charcoal/20"
          placeholder="navn@havn.dk"
        />
      </div>

      <div className="col-span-2 sm:col-span-1">
        <label className="block text-xs font-medium text-charcoal/60 mb-1">Adgangskode</label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className="w-full border border-warm-gray rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-charcoal/20"
          placeholder="Min. 8 tegn"
        />
      </div>

      <div className="col-span-2 sm:col-span-1">
        <label className="block text-xs font-medium text-charcoal/60 mb-1">Rolle</label>
        <select
          name="role"
          className="w-full border border-warm-gray rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-charcoal/20 bg-white"
        >
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
        </select>
      </div>

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
