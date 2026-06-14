import Link from 'next/link'
import Image from 'next/image'

export default function ThemePicker() {
  return (
    <div className="min-h-screen bg-charcoal flex flex-col items-center justify-center p-8">

      <div className="text-center mb-10">
        <div className="flex justify-center mb-5">
          <Image src="/billeder/Logo.jpg" alt="HUNDESTED BAADEVÆRFT logo" width={56} height={56} className="object-contain" />
        </div>
        <p className="text-xs font-black uppercase tracking-widest text-rust mb-2">Kajen · Prototype v0.1</p>
        <h1 className="text-3xl font-black uppercase tracking-tight text-white leading-none">
          Hundested<br />Baadeværft
        </h1>
        <p className="text-white/40 text-sm mt-3">Vælg en designvariant at se</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">

        {/* Hundested — nuværende stil */}
        <Link href="/hundested" className="group block bg-[#1e1e1e] text-white rounded-xl overflow-hidden border border-white/10 hover:border-white/25 transition-colors">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Image src="/billeder/Logo.jpg" alt="logo" width={28} height={28} className="object-contain" />
              <div className="flex flex-col leading-tight border-l border-white/20 pl-3">
                <span className="text-xs font-black uppercase tracking-widest text-white">Hundested</span>
                <span className="text-xs font-black uppercase tracking-widest text-white">Baadeværft</span>
              </div>
            </div>
            <h2 className="text-lg font-black uppercase tracking-tight mb-2">Original</h2>
            <p className="text-white/40 text-sm leading-relaxed">
              Mørk og rå æstetik der matcher den eksisterende hjemmeside. Sort, rustbrun og industriel karakter.
            </p>
          </div>
          <div className="flex h-2">
            <div className="flex-1 bg-rust" />
            <div className="flex-1 bg-[#1e1e1e]" />
            <div className="flex-1 bg-rust-dark" />
            <div className="flex-1 bg-[#2e2e2e]" />
          </div>
          <div className="px-8 py-4 text-xs font-black uppercase tracking-widest text-white/30 group-hover:text-white/70 transition-colors">
            Se variant →
          </div>
        </Link>

        {/* Nautisk — lys/marineblå */}
        <Link href="/nautisk" className="group block bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-gray-400 transition-colors">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-7 h-7 bg-[#1a3558] rounded flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-black">HB</span>
              </div>
              <div className="flex flex-col leading-tight border-l border-gray-200 pl-3">
                <span className="text-xs font-black uppercase tracking-widest text-[#1a3558]">Hundested</span>
                <span className="text-xs font-black uppercase tracking-widest text-[#1a3558]">Baadeværft</span>
              </div>
            </div>
            <h2 className="text-lg font-black uppercase tracking-tight text-[#1a3558] mb-2">Nautisk</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Lys og maritim æstetik med marineblå og sandfarvet palette. Klassisk og professionel stil.
            </p>
          </div>
          <div className="flex h-2">
            <div className="flex-1 bg-[#1a3558]" />
            <div className="flex-1 bg-[#2a527a]" />
            <div className="flex-1 bg-[#b8935a]" />
            <div className="flex-1 bg-[#faf6f0]" />
          </div>
          <div className="px-8 py-4 text-xs font-black uppercase tracking-widest text-gray-300 group-hover:text-gray-600 transition-colors">
            Se variant →
          </div>
        </Link>

      </div>

    </div>
  )
}
