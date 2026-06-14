import Image from 'next/image'

export default function KontaktPage() {
  return (
    <div>

      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-10">
        <h1 className="text-3xl font-black uppercase tracking-tight text-charcoal">Kontakt</h1>
        <p className="text-sm text-gray-500 mt-1">Hundested Baadeværft ApS</p>
      </div>

      {/* Split: billede + kontaktinfo */}
      <section className="max-w-6xl mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ minHeight: '400px' }}>

        {/* Billede */}
        <div className="relative min-h-64 md:min-h-0">
          <Image
            src="/billeder/kontakt1.jpg"
            alt="Hundested Baadeværft kontor"
            fill
            className="object-cover object-center"
          />
        </div>

        {/* Kontaktinfo */}
        <div className="bg-offwhite px-12 py-16 flex flex-col justify-center gap-10">

          <div>
            <p className="text-xs font-black uppercase tracking-widest text-rust mb-3">Adresse</p>
            <p className="text-charcoal leading-relaxed">
              Hundested Baadeværft ApS<br />
              Nordre Beddingsvej 47<br />
              DK-3390 Hundested
            </p>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-widest text-rust mb-3">Kontakt</p>
            <p className="text-charcoal leading-relaxed">
              Tel.{' '}
              <a href="tel:+4571997002" className="hover:text-rust transition-colors">
                71 99 70 02
              </a>
              <br />
              <a href="mailto:hundested@baadevaerft.com" className="hover:text-rust transition-colors">
                hundested@baadevaerft.com
              </a>
            </p>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-widest text-rust mb-3">Telefontider</p>
            <p className="text-charcoal leading-relaxed">
              Mandag, onsdag og fredag<br />
              kl. 8–11
            </p>
            <p className="text-sm text-gray-400 mt-3">
              Du kan altid sende en mail til<br />
              hundested@baadevaerft.com
            </p>
          </div>

        </div>
      </div>
      </section>

      {/* Bånd i offwhite som på priser-siden */}
      <div className="py-8" />

    </div>
  )
}
