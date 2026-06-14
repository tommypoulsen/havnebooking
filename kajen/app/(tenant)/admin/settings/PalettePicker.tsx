'use client'

import { useActionState, useState } from 'react'
import { updateTheme } from './actions'
import { PALETTES } from '@/lib/utils/palettes'

function applyPaletteToDOM(key: string) {
  const vars = PALETTES[key]?.vars
  if (!vars) return
  const root = document.getElementById('theme-root')
  if (!root) return
  for (const [cssVar, value] of Object.entries(vars)) {
    root.style.setProperty(cssVar, value)
  }
}

export function PalettePicker({ currentTheme }: { currentTheme: string }) {
  const [state, formAction, isPending] = useActionState(updateTheme, undefined)
  const [activeTheme, setActiveTheme] = useState(currentTheme || 'default')

  return (
    <form action={formAction}>
      <div className="flex flex-wrap gap-4 mb-4">
        {Object.entries(PALETTES).map(([key, palette]) => {
          const active = activeTheme === key
          const { vars } = palette
          return (
            <label key={key} className="flex flex-col items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="theme"
                value={key}
                checked={active}
                className="sr-only"
                onChange={e => {
                  if (!e.target.checked) return
                  setActiveTheme(key)
                  applyPaletteToDOM(key)
                  e.target.form?.requestSubmit()
                }}
              />
              <div
                className={`w-12 h-12 rounded-xl border-2 transition-all overflow-hidden ${
                  active ? 'border-charcoal scale-110' : 'border-transparent hover:border-charcoal/30'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${vars['--color-charcoal']} 50%, ${vars['--color-rust']} 50%)`,
                }}
              />
              <span className="text-xs text-charcoal/50">{palette.label}</span>
            </label>
          )
        })}
      </div>

      {isPending && <p className="text-xs text-charcoal/40">Gemmer…</p>}
      {state === null && <p className="text-xs text-success">Gemt</p>}
      {typeof state === 'string' && <p className="text-xs text-rust">{state}</p>}
    </form>
  )
}
