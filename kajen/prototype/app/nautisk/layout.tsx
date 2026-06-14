import Image from 'next/image'
import Link from 'next/link'

export default function NautiskLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <header className="bg-white border-b border-sand-light">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

          <div className="flex items-center gap-3">
            <Image src="/billeder/Logo.jpg" alt="HUNDESTED BAADEVÆRFT logo" width={30} height={30} className="object-contain" />
            <div className="flex flex-col leading-tight border-l border-gray-200 pl-3">
              <span className="text-xs font-black uppercase tracking-widest text-navy">Hundested</span>
              <span className="text-xs font-black uppercase tracking-widest text-navy">Baadeværft</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-navy/40 select-none">
            <span>Hjem</span>
            <span>Priser</span>
            <span>Kontakt</span>
            <span className="bg-sand/40 text-sand px-5 py-2 cursor-default rounded">Book kranløft</span>
          </nav>

          <span className="text-xs bg-sand/10 text-sand font-bold px-3 py-1 rounded-full border border-sand/20">
            Konceptudkast
          </span>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-navy text-white">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image src="/billeder/Logo.jpg" alt="logo" width={32} height={32} className="object-contain" />
              <div className="flex flex-col leading-tight border-l border-white/20 pl-3">
                <span className="text-xs font-black uppercase tracking-widest">Hundested</span>
                <span className="text-xs font-black uppercase tracking-widest">Baadeværft</span>
              </div>
            </div>
            <p className="text-white/50 text-xs leading-relaxed">Nordre Beddingsvej 47<br />DK-3390 Hundested</p>
          </div>
          <div>
            <p className="font-bold text-white/90 mb-2 text-xs uppercase tracking-widest">Kontakt</p>
            <p className="text-white/50 text-xs leading-relaxed">Tel. 71 99 70 02<br />hundested@baadevaerft.com</p>
          </div>
          <div>
            <p className="font-bold text-white/90 mb-2 text-xs uppercase tracking-widest">Telefontider</p>
            <p className="text-white/50 text-xs leading-relaxed">Mandag, onsdag og fredag<br />kl. 8–11</p>
          </div>
        </div>
        <div className="border-t border-white/10 text-center py-3 text-xs text-white/20">
          Konceptudkast · Kajen v0.1
        </div>
      </footer>
    </div>
  )
}
