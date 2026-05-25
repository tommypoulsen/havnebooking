import Image from 'next/image'

const services = [
  {
    img: '/billeder/bådoptagning2.jpeg',
    title: 'Kranløft',
    text: 'Professionelt kranløft til optagning og isætning. Fra 893 kr. inkl. moms.',
  },
  {
    img: '/billeder/stativer1.jpeg',
    title: 'Vinteropbevaring',
    text: 'Sikre stativpladser i overdækket hal eller udendørs. Sæsonleje fra 1.575 kr.',
  },
  {
    img: '/billeder/arbejde2.jpeg',
    title: 'Vedligehold & reparation',
    text: 'To store bådhaller med lakrum, fiberrum og smedje. Vi klarer alt derimellem.',
  },
]

const facilityImages = [
  { src: '/billeder/hundestedhavn2.webp',       alt: 'Hundested havn' },
  { src: '/billeder/hundestedhavn3.webp',       alt: 'Havnebassinet' },
  { src: '/billeder/arbejde2.jpeg',             alt: 'Arbejde på båd' },
  { src: '/billeder/hundestedhavn4.webp',       alt: 'Havn og kran' },
  { src: '/billeder/bådoptagning1.jpeg',        alt: 'Båd på stativer' },
  { src: '/billeder/kontakt1.jpg',              alt: 'Bådeværftets kontor' },
]

export default function NautiskHome() {
  return (
    <div>

      {/* ── HERO ── */}
      <section className="relative text-white overflow-hidden" style={{ minHeight: '580px' }}>
        <Image
          src="/billeder/hundestedbaadevaerft1.webp"
          alt="Hundested Baadeværft"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-navy/70" />
        <div className="relative max-w-6xl mx-auto px-6 flex flex-col justify-center" style={{ minHeight: '580px' }}>
          <p className="text-sand-light text-xs font-bold tracking-widest uppercase mb-5">Sæson 2026/2027</p>
          <h1 className="text-5xl md:text-6xl font-bold mb-5 leading-tight max-w-xl">
            Din båd i gode hænder hele vinteren
          </h1>
          <p className="text-white/70 text-lg max-w-lg mb-10 leading-relaxed">
            Hundested Baadeværft tilbyder sikre stativpladser, professionelt kranløft og alt hvad din båd behøver.
          </p>
          <div className="flex flex-wrap gap-4">
            <button type="button" className="bg-sand hover:bg-sand-light text-white font-bold px-8 py-3.5 rounded-lg transition-colors">
              Book kranløft
            </button>
            <button type="button" className="border border-white/40 hover:border-white text-white font-bold px-8 py-3.5 rounded-lg transition-colors">
              Se priser
            </button>
          </div>
        </div>
      </section>

      {/* ── INFO-BÅND ── */}
      <section className="bg-navy text-white py-4">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap gap-8 text-sm text-white/70">
          <span><strong className="text-white">Kranløft</strong> · Næste ledige: 20. maj kl. 12:00</span>
          <span><strong className="text-white">Stativpladser</strong> · Ledige pladser til sæson 2026/2027</span>
          <span><strong className="text-white">Tel. 71 99 70 02</strong> · Man/ons/fre kl. 8–11</span>
        </div>
      </section>

      {/* ── YDELSER ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-sand mb-3">Ydelser</p>
          <h2 className="text-3xl font-bold text-navy mb-2">Alt til din båd på ét sted</h2>
          <p className="text-gray-400 mb-12 max-w-lg">Fra kranen går i båden til den er klar til vandet igen — vi klarer det hele.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map(s => (
              <div key={s.title} className="rounded-xl overflow-hidden border border-sand/20 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="relative h-52">
                  <Image src={s.img} alt={s.title} fill className="object-cover" />
                  <div className="absolute inset-0 bg-navy/30" />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-navy mb-2">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">{s.text}</p>
                  <button type="button" className="text-xs font-bold uppercase tracking-widest text-sand hover:text-sand-light transition-colors">
                    Book {s.title.toLowerCase()} →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BILLEDER ── */}
      <section className="py-20 px-6 bg-cream border-t border-sand/20">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-sand mb-3">Faciliteter</p>
          <h2 className="text-3xl font-bold text-navy mb-12">To store bådhaller og alt derimellem</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {facilityImages.map(({ src, alt }) => (
              <div key={src} className="relative rounded-xl overflow-hidden" style={{ height: '200px' }}>
                <Image src={src} alt={alt} fill className="object-cover hover:scale-105 transition-transform duration-700" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRISER ── */}
      <section className="py-20 px-6 bg-white border-t border-sand/20">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-sand mb-3">Priser</p>
          <h2 className="text-3xl font-bold text-navy mb-2">Kranløft</h2>
          <p className="text-gray-400 mb-10 text-sm">Alle priser inkl. moms · Sæson 2026/2027</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: '0 – 3 ton',   price: '893 kr.' },
              { label: '3 – 6 ton',   price: '1.260 kr.' },
              { label: '6 – 12 ton',  price: '1.890 kr.' },
              { label: '12 – 20 ton', price: '2.520 kr.' },
            ].map(({ label, price }) => (
              <div key={label} className="border border-sand/20 rounded-xl p-5 bg-cream">
                <p className="text-xs text-gray-400 mb-1 font-medium">{label}</p>
                <p className="text-2xl font-bold text-navy">{price}</p>
                <p className="text-xs text-gray-400 mt-1">per løft</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400">Tillæg for løft med mast monteret: 158–315 kr.</p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative text-white overflow-hidden" style={{ minHeight: '320px' }}>
        <Image
          src="/billeder/hundestedbaadevaerft1.webp"
          alt="Hundested Baadeværft"
          fill
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-navy/80" />
        <div className="relative max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8" style={{ minHeight: '320px' }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-sand mb-3">Klar til at booke?</p>
            <h2 className="text-3xl font-bold leading-tight">Det tager under 5 minutter</h2>
            <p className="text-white/60 mt-2 text-sm">Tel. 71 99 70 02 · Man, ons, fre kl. 8–11</p>
          </div>
          <button type="button" className="bg-sand hover:bg-sand-light text-white font-bold px-10 py-4 rounded-lg transition-colors whitespace-nowrap text-sm uppercase tracking-widest">
            Start booking
          </button>
        </div>
      </section>

    </div>
  )
}
