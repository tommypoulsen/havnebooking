import type { TenantConfig } from '@/lib/types/domain'

export function SiteFooter({ name, config }: { name: string; config: TenantConfig }) {
  return (
    <footer className="bg-charcoal text-white">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div>
          {config.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={config.logoUrl} alt={name} className="h-10 w-auto object-contain brightness-0 invert" />
          ) : (
            <div className="flex flex-col leading-tight border-l-2 border-rust pl-3">
              {name.split(' ').map((part, i) => (
                <span key={i} className="text-xs font-black uppercase tracking-widest text-white">{part}</span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-6 md:gap-12 text-xs text-white/50 leading-relaxed">
          {config.contactAddress && (
            <div>
              <p className="text-white/90 font-semibold mb-1">Adresse</p>
              {config.contactAddress.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          )}
          <div>
            <p className="text-white/90 font-semibold mb-1">Kontakt</p>
            {config.contactPhone && <p>Tel. {config.contactPhone}</p>}
            <p>{config.contactEmail}</p>
          </div>
          {config.contactHours && (
            <div>
              <p className="text-white/90 font-semibold mb-1">Telefontider</p>
              <p>{config.contactHours}</p>
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-white/10 text-center py-3 text-xs text-white/20">
        Kajen · Booking
      </div>
    </footer>
  )
}
