import Image from 'next/image'
import SiteHeader from '@/app/components/SiteHeader'

export default function HundestedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1 bg-offwhite">{children}</main>

      <footer className="bg-charcoal text-white">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">

          {/* Logo + navn */}
          <div className="flex items-center gap-3">
            <Image src="/billeder/Logo.jpg" alt="HUNDESTED BAADEVÆRFT logo" width={40} height={40} className="object-contain" />
            <div className="flex flex-col leading-tight border-l border-white/20 pl-3">
              <span className="text-xs font-black uppercase tracking-widest text-white">Hundested</span>
              <span className="text-xs font-black uppercase tracking-widest text-white">Baadeværft</span>
            </div>
          </div>

          {/* Kontakt */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-12 text-xs text-white/50 leading-relaxed">
            <div>
              <p className="text-white/90 font-semibold mb-1">Adresse</p>
              <p>Nordre Beddingsvej 47<br />DK-3390 Hundested</p>
            </div>
            <div>
              <p className="text-white/90 font-semibold mb-1">Kontakt</p>
              <p>Tel. 71 99 70 02<br />hundested@baadevaerft.com</p>
            </div>
            <div>
              <p className="text-white/90 font-semibold mb-1">Telefontider</p>
              <p>Man, ons, fre<br />kl. 8–11</p>
            </div>
          </div>

        </div>
        <div className="border-t border-white/10 text-center py-3 text-xs text-white/20">
          Prototype · Kajen v0.1
        </div>
      </footer>
    </div>
  )
}
