'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const navLinks = [
  { href: '/hundested',         label: 'Hjem' },
  { href: '/hundested/priser',  label: 'Priser' },
  { href: '/hundested/kontakt', label: 'Kontakt' },
  { href: '/admin',             label: 'Administration' },
]

export default function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="bg-white border-b border-warm-gray relative z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

          {/* Logo */}
          <Link href="/hundested" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <Image src="/billeder/Logo.jpg" alt="HUNDESTED BAADEVÆRFT logo" width={30} height={30} className="object-contain" />
            <div className="flex flex-col leading-tight border-l border-gray-200 pl-3">
              <span className="text-xs font-black uppercase tracking-widest text-[#1a1a1a]">Hundested</span>
              <span className="text-xs font-black uppercase tracking-widest text-[#1a1a1a]">Baadeværft</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} className="hover:text-rust transition-colors">{l.label}</Link>
            ))}
            <Link href="/hundested/book" className="bg-rust hover:bg-rust-dark text-white px-5 py-2 transition-colors">
              Book kranløft
            </Link>
          </nav>

          {/* Burger-knap (mobil) */}
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

      {/* Mobil-menu overlay */}
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
              href="/hundested/book"
              onClick={() => setOpen(false)}
              className="mt-6 bg-rust hover:bg-rust-dark text-white font-black uppercase tracking-widest text-sm px-8 py-4 text-center transition-colors rounded-lg"
            >
              Book kranløft
            </Link>
          </nav>
        </div>
      )}
    </>
  )
}
