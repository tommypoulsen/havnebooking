'use client'

import { useState, useTransition } from 'react'
import { saveAddOnRules } from './actions'
import type { AddOnRule, Service, SizeCategory, DurationType } from '@/lib/types/domain'

const DURATION_OPTIONS: { value: DurationType; label: string }[] = [
  { value: 'per_lift', label: 'Per løft' },
  { value: 'per_season', label: 'Per sæson' },
  { value: 'per_day', label: 'Per dag' },
]

type PricingMode = 'fixed' | 'sizeTable' | 'service'

type RuleDraft = {
  id: string
  label: string
  conditions: Array<{ field: string; value: string }>
  pricingMode: PricingMode
  fixedKr: string
  sizeKr: Record<string, string>
  linkedServiceId: string
  durationType: DurationType | ''
}

const toKr = (oere: number) => (oere / 100).toString()
const toOere = (kr: string) => {
  const n = parseFloat(kr.replace(',', '.'))
  return isNaN(n) ? 0 : Math.round(n * 100)
}

function toDraft(rule: AddOnRule): RuleDraft {
  const pricingMode: PricingMode =
    rule.fixedPriceOere !== undefined ? 'fixed'
    : rule.sizeTableOere ? 'sizeTable'
    : 'service'
  return {
    id: rule.id,
    label: rule.label,
    conditions: rule.conditions.map(c => ({ ...c })),
    pricingMode,
    fixedKr: rule.fixedPriceOere !== undefined ? toKr(rule.fixedPriceOere) : '',
    sizeKr: rule.sizeTableOere
      ? Object.fromEntries(Object.entries(rule.sizeTableOere).map(([k, v]) => [k, toKr(v)]))
      : {},
    linkedServiceId: rule.serviceId ?? '',
    durationType: rule.durationType ?? '',
  }
}

function toRule(draft: RuleDraft): AddOnRule {
  const rule: AddOnRule = { id: draft.id, label: draft.label, conditions: draft.conditions }
  if (draft.pricingMode === 'fixed') {
    rule.fixedPriceOere = toOere(draft.fixedKr)
  } else if (draft.pricingMode === 'sizeTable') {
    rule.sizeTableOere = Object.fromEntries(
      Object.entries(draft.sizeKr).map(([k, v]) => [k, toOere(v)])
    )
  } else {
    rule.serviceId = draft.linkedServiceId
    rule.durationType = draft.durationType as DurationType
  }
  return rule
}

function emptyDraft(): RuleDraft {
  return {
    id: crypto.randomUUID(),
    label: '',
    conditions: [],
    pricingMode: 'fixed',
    fixedKr: '',
    sizeKr: {},
    linkedServiceId: '',
    durationType: '',
  }
}

export function AddOnRulesEditor({
  service,
  sizeCategories,
  allServices,
}: {
  service: Service
  sizeCategories: SizeCategory[]
  allServices: Pick<Service, 'id' | 'name'>[]
}) {
  const [drafts, setDrafts] = useState<RuleDraft[]>(
    (service.config.addOnRules ?? []).map(toDraft)
  )
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const formFields = service.config.formFields ?? []
  const otherServices = allServices.filter(s => s.id !== service.id)

  function update(id: string, patch: Partial<RuleDraft>) {
    setSaved(false)
    setDrafts(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d))
  }

  function updateCondition(ruleId: string, index: number, patch: Partial<{ field: string; value: string }>) {
    const draft = drafts.find(d => d.id === ruleId)!
    update(ruleId, {
      conditions: draft.conditions.map((c, i) => i === index ? { ...c, ...patch } : c),
    })
  }

  function removeCondition(ruleId: string, index: number) {
    const draft = drafts.find(d => d.id === ruleId)!
    update(ruleId, { conditions: draft.conditions.filter((_, i) => i !== index) })
  }

  function validate(): string | null {
    for (const d of drafts) {
      if (!d.label.trim()) return 'Alle regler skal have et navn'
      if (d.pricingMode === 'service' && !d.linkedServiceId) return 'Vælg en ydelse for alle "Via ydelse"-regler'
      if (d.pricingMode === 'service' && !d.durationType) return 'Vælg varighed for alle "Via ydelse"-regler'
    }
    return null
  }

  function save() {
    const validationError = validate()
    if (validationError) { setError(validationError); return }
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await saveAddOnRules(service.id, drafts.map(toRule))
      if (result) setError(result)
      else setSaved(true)
    })
  }

  return (
    <div>
      {drafts.length === 0 && (
        <p className="text-sm text-charcoal/40 mb-4">Ingen tillægsregler konfigureret.</p>
      )}

      <div className="space-y-4 mb-4">
        {drafts.map(draft => {
          const condField = (fieldId: string) => formFields.find(f => f.id === fieldId)

          return (
            <div key={draft.id} className="bg-white rounded-xl border border-warm-gray p-5">
              {/* Label */}
              <div className="mb-5">
                <label className="block text-xs text-charcoal/50 mb-1">Navn</label>
                <input
                  type="text"
                  value={draft.label}
                  onChange={e => update(draft.id, { label: e.target.value })}
                  placeholder="fx Mastetillæg"
                  className="w-full border border-warm-gray rounded-lg px-3 py-2 text-sm text-charcoal focus:outline-none focus:border-rust"
                />
              </div>

              {/* Conditions */}
              <div className="mb-5">
                <p className="text-xs text-charcoal/50 mb-2">Betingelser — alle skal matche</p>
                <div className="space-y-2">
                  {draft.conditions.map((cond, ci) => {
                    const f = condField(cond.field)
                    return (
                      <div key={ci} className="flex items-center gap-2 flex-wrap">
                        <select
                          value={cond.field}
                          onChange={e => updateCondition(draft.id, ci, { field: e.target.value, value: '' })}
                          className="border border-warm-gray rounded px-2 py-1.5 text-sm text-charcoal focus:outline-none focus:border-rust"
                        >
                          <option value="">Vælg felt…</option>
                          {formFields.map(ff => (
                            <option key={ff.id} value={ff.id}>{ff.label}</option>
                          ))}
                        </select>
                        <span className="text-charcoal/30 text-sm">=</span>
                        {f?.type === 'select' && f.options ? (
                          <select
                            value={cond.value}
                            onChange={e => updateCondition(draft.id, ci, { value: e.target.value })}
                            className="border border-warm-gray rounded px-2 py-1.5 text-sm text-charcoal focus:outline-none focus:border-rust"
                          >
                            <option value="">Vælg værdi…</option>
                            {f.options.map(o => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={cond.value}
                            onChange={e => updateCondition(draft.id, ci, { value: e.target.value })}
                            placeholder="Værdi"
                            className="border border-warm-gray rounded px-2 py-1.5 text-sm text-charcoal focus:outline-none focus:border-rust w-36"
                          />
                        )}
                        <button
                          onClick={() => removeCondition(draft.id, ci)}
                          className="text-charcoal/30 hover:text-rust transition-colors leading-none"
                          title="Fjern betingelse"
                        >
                          ×
                        </button>
                      </div>
                    )
                  })}
                </div>
                <button
                  onClick={() => {
                    const d = drafts.find(r => r.id === draft.id)!
                    update(draft.id, { conditions: [...d.conditions, { field: '', value: '' }] })
                  }}
                  className="mt-2 text-xs text-charcoal/40 hover:text-charcoal transition-colors"
                >
                  + Tilføj betingelse
                </button>
              </div>

              {/* Pricing mode */}
              <div className="mb-5">
                <p className="text-xs text-charcoal/50 mb-2">Pristype</p>
                <div className="flex gap-1 mb-3 bg-offwhite border border-warm-gray rounded-lg p-0.5 w-fit">
                  {(['fixed', 'sizeTable', 'service'] as PricingMode[]).map(mode => {
                    const labels: Record<PricingMode, string> = {
                      fixed: 'Fast pris',
                      sizeTable: 'Størrelsestabel',
                      service: 'Via ydelse',
                    }
                    return (
                      <button
                        key={mode}
                        onClick={() => update(draft.id, { pricingMode: mode })}
                        className={`px-3 py-1 text-xs rounded transition-colors ${
                          draft.pricingMode === mode
                            ? 'bg-charcoal text-offwhite'
                            : 'text-charcoal/50 hover:text-charcoal'
                        }`}
                      >
                        {labels[mode]}
                      </button>
                    )
                  })}
                </div>

                {draft.pricingMode === 'fixed' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={draft.fixedKr}
                      onChange={e => update(draft.id, { fixedKr: e.target.value })}
                      placeholder="0"
                      className="w-32 border border-warm-gray rounded-lg px-3 py-2 text-sm text-right text-charcoal focus:outline-none focus:border-rust"
                    />
                    <span className="text-sm text-charcoal/50">kr</span>
                  </div>
                )}

                {draft.pricingMode === 'sizeTable' && (
                  <div className="space-y-2">
                    {sizeCategories.length === 0 && (
                      <p className="text-xs text-charcoal/40">Ingen størrelseskategorier for denne ydelse.</p>
                    )}
                    {sizeCategories.map(cat => (
                      <div key={cat.id} className="flex items-center gap-3">
                        <span className="text-sm text-charcoal/70 w-28 shrink-0">{cat.label}</span>
                        <input
                          type="number"
                          min="0"
                          value={draft.sizeKr[cat.id] ?? ''}
                          onChange={e => update(draft.id, {
                            sizeKr: { ...draft.sizeKr, [cat.id]: e.target.value },
                          })}
                          placeholder="0"
                          className="w-28 border border-warm-gray rounded-lg px-3 py-2 text-sm text-right text-charcoal focus:outline-none focus:border-rust"
                        />
                        <span className="text-sm text-charcoal/50">kr</span>
                      </div>
                    ))}
                  </div>
                )}

                {draft.pricingMode === 'service' && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <select
                      value={draft.linkedServiceId}
                      onChange={e => update(draft.id, { linkedServiceId: e.target.value })}
                      className="border border-warm-gray rounded-lg px-3 py-2 text-sm text-charcoal focus:outline-none focus:border-rust"
                    >
                      <option value="">Vælg ydelse…</option>
                      {otherServices.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <select
                      value={draft.durationType}
                      onChange={e => update(draft.id, { durationType: e.target.value as DurationType })}
                      className="border border-warm-gray rounded-lg px-3 py-2 text-sm text-charcoal focus:outline-none focus:border-rust"
                    >
                      <option value="">Vælg varighed…</option>
                      {DURATION_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Delete */}
              <div className="pt-3 border-t border-warm-gray flex justify-end">
                <button
                  onClick={() => {
                    setSaved(false)
                    setDrafts(prev => prev.filter(d => d.id !== draft.id))
                  }}
                  className="text-xs text-charcoal/30 hover:text-rust transition-colors"
                >
                  Slet regel
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => { setSaved(false); setDrafts(prev => [...prev, emptyDraft()]) }}
          className="text-xs text-charcoal/50 hover:text-charcoal transition-colors"
        >
          + Tilføj regel
        </button>
        <button
          onClick={save}
          disabled={isPending}
          className="text-xs bg-rust hover:bg-rust-dark text-offwhite px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {isPending ? 'Gemmer…' : 'Gem regler'}
        </button>
        {error && <p className="text-xs text-rust">{error}</p>}
        {saved && !isPending && <p className="text-xs text-success">Gemt</p>}
      </div>
    </div>
  )
}
