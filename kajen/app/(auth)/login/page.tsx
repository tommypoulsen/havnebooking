'use client'

import { useActionState } from 'react'
import { login } from '@/lib/supabase/actions'

export default function LoginPage() {
  const [error, formAction, isPending] = useActionState(login, null)

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold text-charcoal mb-8 text-center">Log ind</h1>

      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-charcoal">E-mail</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="border border-warm-gray rounded-lg px-3 py-2 text-charcoal focus:outline-none focus:border-rust"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-charcoal">Adgangskode</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="border border-warm-gray rounded-lg px-3 py-2 text-charcoal focus:outline-none focus:border-rust"
          />
        </label>

        {error && (
          <p className="text-sm text-rust bg-rust/10 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="bg-rust text-offwhite font-semibold py-3 rounded-xl hover:bg-rust-dark transition-colors disabled:opacity-50 mt-2"
        >
          {isPending ? 'Logger ind…' : 'Log ind'}
        </button>
      </form>
    </div>
  )
}
