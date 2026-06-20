'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/lib/supabase/actions'

const NAV = [
  { href: '/admin/timeslots', label: 'Tidspunkter' },
  { href: '/admin/bookings',  label: 'Bookinger' },
  { href: '/admin/pricing',   label: 'Priser' },
  { href: '/admin/addons',    label: 'Tillægsregler' },
  { href: '/admin/lager',     label: 'Lager' },
  { href: '/admin/settings',  label: 'Indstillinger' },
]

export function AdminNav({ tenantName }: { tenantName: string }) {
  const pathname = usePathname()

  return (
    <nav className="w-52 shrink-0 bg-charcoal min-h-screen flex flex-col">
      <div className="px-4 py-5 border-b border-charcoal-mid">
        <p className="text-xs text-offwhite/40 uppercase tracking-wider mb-1">Admin</p>
        <p className="text-offwhite font-semibold text-sm leading-tight">{tenantName}</p>
      </div>

      <div className="flex flex-col gap-1 p-3 flex-1">
        {NAV.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname.startsWith(href)
                ? 'bg-rust text-offwhite'
                : 'text-offwhite/60 hover:text-offwhite hover:bg-charcoal-mid'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <form action={logout} className="p-3">
        <button
          type="submit"
          className="w-full px-3 py-2 rounded-lg text-sm text-offwhite/40 hover:text-offwhite hover:bg-charcoal-mid transition-colors text-left"
        >
          Log ud
        </button>
      </form>
    </nav>
  )
}
