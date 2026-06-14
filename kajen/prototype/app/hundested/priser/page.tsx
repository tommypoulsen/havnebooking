import Link from 'next/link'

const WEIGHTS = ['0–3 ton', '3–6 ton', '6–12 ton', '12–20 ton']

const SECTIONS = [
  {
    label: 'Kranløft',
    rows: [
      { label: 'Kranløft',        prices: [893,  1260, 1890, 2520] },
      { label: 'Tillæg med mast', prices: [158,   210,  263,  315], sub: true },
    ],
  },
  {
    label: 'Vinteropbevaring · sæsonleje',
    rows: [
      { label: 'Stativleje sejlbåd',  prices: [1575, 2100, 2363, 2625] },
      { label: 'Stativleje motorbåd', prices: [1838, 2494, 2835, 3150] },
      { label: 'Stormstøtter',        prices: [263,   315,  420,  525], sub: true },
    ],
  },
  {
    label: 'Vinteropbevaring · ugeleje',
    rows: [
      { label: 'Stativleje sejlbåd',  prices: [263, 394, 525, 656] },
      { label: 'Stativleje motorbåd', prices: [394, 525, 656, 788] },
    ],
  },
  {
    label: 'Transport',
    rows: [
      { label: 'Tillæg med mast', prices: [158, 210, 263, 315], sub: true },
    ],
    flat: { label: 'Transport til/fra opbevaringsplads', price: 473 },
  },
]

export default function PriserPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="flex items-baseline justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-charcoal">Priser</h1>
          <p className="text-sm text-gray-500 mt-1">Alle priser inkl. moms · Sæson 2026/2027</p>
        </div>
        <Link
          href="/hundested/book"
          className="bg-rust hover:bg-rust-dark text-white text-xs font-black uppercase tracking-widest px-6 py-3 transition-colors"
        >
          Book
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-charcoal">
              <th className="text-left py-2 pr-6 text-xs font-black uppercase tracking-widest text-charcoal w-1/2"></th>
              {WEIGHTS.map(h => (
                <th key={h} className="text-right py-2 px-3 text-xs font-black uppercase tracking-widest text-charcoal whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SECTIONS.map(section => (
              <>
                <tr key={section.label}>
                  <td colSpan={5} className="pt-6 pb-1">
                    <span className="text-xs font-black uppercase tracking-widest text-rust">{section.label}</span>
                  </td>
                </tr>

                {'flat' in section && section.flat && (
                  <tr key="flat" className="border-b border-warm-gray">
                    <td className="py-2.5 pr-6 font-medium text-charcoal">{section.flat.label}</td>
                    <td colSpan={4} className="py-2.5 px-3 text-right text-gray-600">
                      {section.flat.price.toLocaleString('da-DK')} kr. pr. retning
                    </td>
                  </tr>
                )}

                {section.rows.map(row => (
                  <tr key={row.label} className="border-b border-warm-gray">
                    <td className={`py-2.5 pr-6 ${row.sub ? 'text-gray-400 pl-4' : 'font-medium text-charcoal'}`}>
                      {row.label}
                    </td>
                    {row.prices.map((p, i) => (
                      <td key={i} className="py-2.5 px-3 text-right text-gray-600 whitespace-nowrap">
                        {p.toLocaleString('da-DK')} kr.
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-8">
        Spørgsmål? Ring på <strong>71 99 70 02</strong> · man, ons, fre kl. 8–11
      </p>
    </div>
  )
}
