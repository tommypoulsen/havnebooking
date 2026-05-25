import Link from 'next/link'
import Image from 'next/image'

const infoBoxes = [
  {
    title: 'Services',
    text: 'Vi tager din båd på land. Sætter den i vandet igen. Og kan lave alt derimellem.',
    href: '/hundested/book',
  },
  {
    title: 'Faciliteter',
    text: 'To store bådhaller med lakrum, fiberrum, smedje. Og alt andet et bådelskende hjerte kan begære.',
    href: '/hundested/book',
  },
  {
    title: 'Reservedele',
    text: 'Fra nyt dæk til ny motor, vi leverer alle dele til din båd. Og kan montere det hele.',
    href: '/hundested/book',
  },
  {
    title: 'Historie',
    text: 'Vi er det forhenværende Molichs Bådebyggeri. Det er en arv, der forpligter...',
    href: '/hundested',
  },
]

export default function HundestedHome() {
  return (
    <div className="bg-charcoal">
      {/* Hero */}
      <section className="relative bg-charcoal text-white" style={{ minHeight: '540px' }}>
        <Image
          src="/billeder/hundestedbaadevaerft1.webp"
          alt="Hundested Baadeværft set fra havnen"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-charcoal/80" />
        <div className="relative max-w-6xl mx-auto px-6 flex flex-col justify-center" style={{ minHeight: '540px' }}>
          <div className="w-10 h-0.5 bg-rust mb-8" />
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tight mb-4 leading-none">
            Vi er Hundested<br />Baadeværft
          </h1>
          <p className="text-rust-light text-sm font-bold uppercase tracking-widest mb-6">
            Opbevaring · Vedligehold · Klargøring
          </p>
          <p className="text-white/55 text-base mb-10 max-w-md leading-relaxed">
            A-Z løsninger til den kritiske bådejer.<br />
            Totalløsninger og rådgivning. Alle reservedele.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/hundested/book?service=kranløft" className="bg-rust hover:bg-rust-dark text-white text-xs font-black uppercase tracking-widest px-8 py-4 transition-colors">
              Book kranløft
            </Link>
            <a href="mailto:hundested@baadevaerft.com" className="border border-white/30 hover:border-white text-white text-xs font-black uppercase tracking-widest px-8 py-4 transition-colors">
              Kontakt os
            </a>
          </div>
        </div>
      </section>

      {/* Info-bokse */}
      <section className="bg-charcoal-mid text-white border-t border-white/10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/10">
          {infoBoxes.map((box) => (
            <Link key={box.title} href={box.href} className="group p-8 hover:bg-charcoal transition-colors">
              <p className="text-xs font-black uppercase tracking-widest text-rust-light mb-4 group-hover:text-white transition-colors">
                {box.title}
              </p>
              <p className="text-white/70 text-sm leading-relaxed">
                {box.text}
              </p>
            </Link>
          ))}
        </div>
      </section>

    </div>
  )
}
