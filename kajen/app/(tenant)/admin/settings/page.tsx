import { notFound } from 'next/navigation'
import { getTenant } from '@/lib/utils/tenant'
import { LogoUpload } from './LogoUpload'
import { PalettePicker } from './PalettePicker'

export default async function SettingsPage() {
  const tenant = await getTenant()
  if (!tenant) notFound()

  return (
    <div className="max-w-2xl space-y-10">
      <h1 className="text-2xl font-bold text-charcoal">Indstillinger</h1>

      {/* Logo */}
      <section>
        <h2 className="text-xs font-black uppercase tracking-widest text-charcoal/40 mb-4">Logo</h2>
        <p className="text-sm text-charcoal/50 mb-4">
          Vises i header og footer på din bookingside. Anbefalet format: SVG eller PNG med transparent baggrund.
        </p>
        <LogoUpload tenantId={tenant.id} currentLogoUrl={tenant.config.logoUrl} />
      </section>

      {/* Palette */}
      <section className="border-t border-warm-gray pt-8">
        <h2 className="text-xs font-black uppercase tracking-widest text-charcoal/40 mb-4">Farveskema</h2>
        <p className="text-sm text-charcoal/50 mb-4">
          Accentfarven bruges på knapper, links og fremhævninger på din bookingside.
        </p>
        <PalettePicker currentTheme={tenant.config.theme ?? 'default'} />
      </section>
    </div>
  )
}
