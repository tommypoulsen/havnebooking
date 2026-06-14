'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/',        label: 'Hjem' },
  { href: '/priser',  label: 'Priser' },
  { href: '/kontakt', label: 'Kontakt' },
]

export function SiteHeader({ displayName, logoUrl }: { displayName: string; logoUrl?: string }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const [first, ...rest] = displayName.split(' ')

  return (
    <>
      <header className="bg-white border-b border-warm-gray relative z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={displayName} className="h-10 w-auto object-contain" />
            ) : (
              <div className="flex flex-col leading-tight border-l-2 border-rust pl-3">
                <span className="text-xs font-black uppercase tracking-widest text-charcoal">{first}</span>
                {rest.length > 0 && (
                  <span className="text-xs font-black uppercase tracking-widest text-charcoal">{rest.join(' ')}</span>
                )}
              </div>
            )}
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest">
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={`transition-colors ${pathname === l.href ? 'text-rust' : 'text-charcoal hover:text-rust'}`}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/book"
              className="bg-rust hover:bg-rust-dark text-white px-5 py-2 transition-colors"
            >
              Book
            </Link>
          </nav>

          <button
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5"
            onClick={() => setOpen(v => !v)}
            aria-label="Menu"
          >
            <span className={`block w-6 h-0.5 bg-charcoal transition-all duration-200 ${open ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-6 h-0.5 bg-charcoal transition-all duration-200 ${open ? 'opacity-0' : ''}`} />
            <span className={`block w-6 h-0.5 bg-charcoal transition-all duration-200 ${open ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-20 bg-white flex flex-col pt-20 px-6 md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-lg font-black uppercase tracking-tight text-charcoal py-4 border-b border-warm-gray hover:text-rust transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/book"
              onClick={() => setOpen(false)}
              className="mt-6 bg-rust hover:bg-rust-dark text-white font-black uppercase tracking-widest text-sm px-8 py-4 text-center transition-colors"
            >
              Book
            </Link>
          </nav>
        </div>
      )}
    </>
  )
}
