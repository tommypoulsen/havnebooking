'use client'

export default function TenantError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-offwhite px-6">
      <div className="text-center max-w-md">
        <p className="text-xs font-bold uppercase tracking-widest text-charcoal/40 mb-3">Fejl</p>
        <h1 className="text-2xl font-black uppercase tracking-tight text-charcoal mb-3">
          Noget gik galt
        </h1>
        <p className="text-charcoal/60 mb-6 text-sm">
          {error.message || 'Der opstod en uventet fejl. Prøv igen eller kontakt os.'}
        </p>
        <button
          onClick={reset}
          className="bg-rust text-offwhite font-semibold px-6 py-3 rounded-xl hover:bg-rust-dark transition-colors text-sm"
        >
          Prøv igen
        </button>
      </div>
    </div>
  )
}
