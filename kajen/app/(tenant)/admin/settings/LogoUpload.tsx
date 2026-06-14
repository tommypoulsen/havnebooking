'use client'

import { useRef, useState, useTransition } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { updateLogoUrl, removeLogo } from './actions'

export function LogoUpload({ tenantId, currentLogoUrl }: { tenantId: string; currentLogoUrl?: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentLogoUrl ?? null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Kun billedfiler tilladt')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Filen må max være 2 MB')
      return
    }

    setError(null)
    const ext  = file.name.split('.').pop()
    const path = `${tenantId}/logo.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setError('Upload fejlede — ' + uploadError.message)
      return
    }

    const { data } = supabase.storage.from('logos').getPublicUrl(path)

    startTransition(async () => {
      const err = await updateLogoUrl(data.publicUrl)
      if (err) { setError(err); return }
      setPreview(data.publicUrl)
    })
  }

  function handleRemove() {
    startTransition(async () => {
      const err = await removeLogo()
      if (!err) setPreview(null)
      else setError(err)
    })
  }

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="flex items-center gap-4">
          <div className="w-32 h-16 border border-warm-gray rounded-lg bg-offwhite flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Logo" className="max-h-full max-w-full object-contain p-2" />
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              disabled={isPending}
              className="text-xs text-charcoal/50 hover:text-charcoal transition-colors"
            >
              Erstat logo
            </button>
            <button
              onClick={handleRemove}
              disabled={isPending}
              className="text-xs text-charcoal/30 hover:text-rust transition-colors"
            >
              Fjern logo
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="flex items-center justify-center w-40 h-20 border-2 border-dashed border-warm-gray rounded-lg text-charcoal/30 hover:border-charcoal hover:text-charcoal transition-colors text-sm"
        >
          {isPending ? 'Uploader…' : '+ Upload logo'}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />

      {error && <p className="text-xs text-rust">{error}</p>}
      <p className="text-xs text-charcoal/30">PNG, SVG eller WebP · Max 2 MB</p>
    </div>
  )
}
