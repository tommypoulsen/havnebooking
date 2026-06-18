'use client'

export default function AdminError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-6">
      <div className="text-center max-w-md">
        <p className="text-xs font-bold uppercase tracking-widest text-charcoal/40 mb-3">Admin — Fejl</p>
        <h1 className="text-xl font-black uppercase tracking-tight text-charcoal mb-3">
          Noget gik galt
        </h1>
        <p className="text-charcoal/60 mb-6 text-sm">
          {error.message || 'Der opstod en uventet fejl.'}
        </p>
        <button
          onClick={reset}
          className="bg-rust text-offwhite font-semibold px-5 py-2.5 rounded-xl hover:bg-rust-dark transition-colors text-sm"
        >
          Prøv igen
        </button>
      </div>
    </div>
  )
}
