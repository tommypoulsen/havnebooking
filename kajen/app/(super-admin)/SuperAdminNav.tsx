'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/lib/supabase/actions'

const NAV = [
  { href: '/tenants', label: 'Tenanter' },
]

export function SuperAdminNav() {
  const pathname = usePathname()

  return (
    <nav className="w-52 shrink-0 bg-navy min-h-screen flex flex-col">
      <div className="px-4 py-5 border-b border-navy-mid">
        <p className="text-xs text-offwhite/40 uppercase tracking-wider mb-1">Super Admin</p>
        <p className="text-offwhite font-semibold text-sm">Havnebooking</p>
      </div>

      <div className="flex flex-col gap-1 p-3 flex-1">
        {NAV.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname.startsWith(href)
                ? 'bg-sand text-charcoal'
                : 'text-offwhite/60 hover:text-offwhite hover:bg-navy-mid'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <form action={logout} className="p-3">
        <button
          type="submit"
          className="w-full px-3 py-2 rounded-lg text-sm text-offwhite/40 hover:text-offwhite hover:bg-navy-mid transition-colors text-left"
        >
          Log ud
        </button>
      </form>
    </nav>
  )
}
