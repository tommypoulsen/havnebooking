import { notFound } from 'next/navigation'
import { getTenant } from '@/lib/utils/tenant'

export default async function KontaktPage() {
  const tenant = await getTenant()
  if (!tenant) notFound()

  const { config } = tenant

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-black uppercase tracking-tight text-charcoal mb-1">Kontakt</h1>
      <p className="text-sm text-charcoal/40 mb-12">{config.displayName}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {config.contactAddress && (
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-rust mb-3">Adresse</p>
            <p className="text-charcoal leading-relaxed">
              {config.displayName}
              {config.contactAddress.map((line, i) => (
                <span key={i}><br />{line}</span>
              ))}
            </p>
          </div>
        )}

        <div>
          <p className="text-xs font-black uppercase tracking-widest text-rust mb-3">Kontakt</p>
          <p className="text-charcoal leading-relaxed">
            {config.contactPhone && (
              <>
                Tel.{' '}
                <a
                  href={`tel:+45${config.contactPhone.replace(/\s/g, '')}`}
                  className="hover:text-rust transition-colors"
                >
                  {config.contactPhone}
                </a>
                <br />
              </>
            )}
            <a href={`mailto:${config.contactEmail}`} className="hover:text-rust transition-colors">
              {config.contactEmail}
            </a>
          </p>
        </div>

        {config.contactHours && (
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-rust mb-3">Telefontider</p>
            <p className="text-charcoal leading-relaxed">{config.contactHours}</p>
            <p className="text-sm text-charcoal/40 mt-3">
              Du kan altid sende en mail til{' '}
              <a href={`mailto:${config.contactEmail}`} className="hover:text-rust transition-colors">
                {config.contactEmail}
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
