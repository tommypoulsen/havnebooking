'use client'

import { useState, useMemo, useTransition } from 'react'
import type { Service, SizeCategory, PricingRule, TimeSlot, DurationType } from '@/lib/types/domain'
import { calculatePrice, formatPrice, daysBetween } from '@/lib/utils/pricing'
import { resolveAddOns } from '@/lib/utils/addons'
import type { ResolvedLine } from '@/lib/utils/addons'
import { filterVisibleFormAnswers } from '@/lib/utils/form'
import { PricePanel } from './PricePanel'
import { createOrder } from './actions'

type Draft = {
  sizeCategoryId: string
  timeSlotId: string
  startDate: string
  endDate: string
  formAnswers: Record<string, string>
  fullName: string
  email: string
  phone: string
}

type Step = 'pre-fields' | 'size' | 'slot' | 'dates' | 'post-fields' | 'info' | 'summary'

const EMPTY_DRAFT: Draft = {
  sizeCategoryId: '',
  timeSlotId: '',
  startDate: '',
  endDate: '',
  formAnswers: {},
  fullName: '',
  email: '',
  phone: '',
}

function formatSlot(startsAt: string) {
  return new Intl.DateTimeFormat('da-DK', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(startsAt))
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('da-DK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

function durationTypeForService(type: string): DurationType {
  if (type === 'timeslot') return 'per_lift'
  if (type === 'capacity') return 'per_season'
  return 'per_day'
}

export function BookingWizard({
  service,
  sizeCategories,
  pricingRules,
  addOnPricingRules,
  timeSlots,
  contactEmail,
}: {
  service: Service
  sizeCategories: SizeCategory[]
  pricingRules: PricingRule[]
  addOnPricingRules: PricingRule[]
  timeSlots: TimeSlot[]
  contactEmail: string
}) {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [stepIndex, setStepIndex] = useState(0)
  const [isPaying, startPayTransition] = useTransition()
  const [payError, setPayError] = useState<string | null>(null)

  const preFields = useMemo(
    () => (service.config.formFields ?? []).filter(f => f.step === 'pre'),
    [service.config.formFields]
  )
  const postFields = useMemo(
    () => (service.config.formFields ?? []).filter(f => f.step !== 'pre'),
    [service.config.formFields]
  )

  const steps = useMemo<Step[]>(() => {
    const s: Step[] = []
    if (preFields.length > 0) s.push('pre-fields')
    if (service.config.requiresSizeCategory) s.push('size')
    if (service.type === 'timeslot') s.push('slot')
    if (service.type === 'capacity' || service.type === 'stock') s.push('dates')
    if (postFields.length > 0) s.push('post-fields')
    s.push('info')
    s.push('summary')
    return s
  }, [service, preFields, postFields])

  const currentStep = steps[stepIndex]

  const preVisibleFields = useMemo(
    () => preFields.filter(f => !f.dependsOn || draft.formAnswers[f.dependsOn.field] === f.dependsOn.value),
    [preFields, draft.formAnswers]
  )
  const postVisibleFields = useMemo(
    () => postFields.filter(f => !f.dependsOn || draft.formAnswers[f.dependsOn.field] === f.dependsOn.value),
    [postFields, draft.formAnswers]
  )

  // Restrict formAnswers to visible fields only to avoid stale hidden-field values triggering add-on conditions
  const effectiveFormAnswers = useMemo(
    () => filterVisibleFormAnswers(service.config.formFields ?? [], draft.formAnswers),
    [service.config.formFields, draft.formAnswers]
  )

  const canAdvance = useMemo(() => {
    if (currentStep === 'pre-fields') return preVisibleFields.every(f => !f.required || !!draft.formAnswers[f.id])
    if (currentStep === 'size') return !!draft.sizeCategoryId
    if (currentStep === 'slot') return !!draft.timeSlotId
    if (currentStep === 'dates') return !!draft.startDate && !!draft.endDate
    if (currentStep === 'post-fields') return postVisibleFields.every(f => !f.required || !!draft.formAnswers[f.id])
    if (currentStep === 'info') return !!draft.fullName && !!draft.email && !!draft.phone
    return true
  }, [currentStep, draft, preVisibleFields, postVisibleFields])

  const price = useMemo(() => {
    const durationType = durationTypeForService(service.type)
    const days = draft.startDate && draft.endDate ? daysBetween(draft.startDate, draft.endDate) : 1
    return calculatePrice(pricingRules, draft.sizeCategoryId || null, durationType, { days })
  }, [pricingRules, draft.sizeCategoryId, draft.startDate, draft.endDate, service.type])

  const pricingRulesByServiceId = useMemo(() =>
    addOnPricingRules.reduce<Record<string, PricingRule[]>>((acc, r) => {
      ;(acc[r.service_id] ??= []).push(r)
      return acc
    }, {}),
    [addOnPricingRules]
  )

  const resolvedAddOns = useMemo<ResolvedLine[]>(() =>
    resolveAddOns(
      service.config.addOnRules ?? [],
      effectiveFormAnswers,
      draft.sizeCategoryId || null,
      pricingRulesByServiceId
    ),
    [service.config.addOnRules, effectiveFormAnswers, draft.sizeCategoryId, pricingRulesByServiceId]
  )

  const selectedCategory = sizeCategories.find(c => c.id === draft.sizeCategoryId)
  const selectedSlot = timeSlots.find(s => s.id === draft.timeSlotId)

  const primaryLabel = selectedCategory
    ? `${service.name} (${selectedCategory.label})`
    : service.name

  function update(patch: Partial<Draft>) {
    setDraft(prev => ({ ...prev, ...patch }))
  }

  function next() {
    if (canAdvance) setStepIndex(i => i + 1)
  }

  function back() {
    setStepIndex(i => i - 1)
  }

  function handlePay() {
    setPayError(null)
    startPayTransition(async () => {
      const result = await createOrder({
        service_id:       service.id,
        size_category_id: draft.sizeCategoryId || null,
        time_slot_id:     draft.timeSlotId || null,
        start_date:       draft.startDate || null,
        end_date:         draft.endDate || null,
        form_answers:     effectiveFormAnswers,
        full_name:        draft.fullName,
        email:            draft.email,
        phone:            draft.phone,
      })
      if (result.error) {
        setPayError(result.error)
        return
      }
      window.location.href = result.data!.paymentUrl
    })
  }

  function renderFieldSet(fields: typeof preVisibleFields) {
    return fields.map(field => (
      <label key={field.id} className="flex flex-col gap-1">
        <span className="text-sm font-medium text-charcoal">
          {field.label}
          {field.required && <span className="text-rust ml-1">*</span>}
        </span>
        {field.type === 'select' && field.options ? (
          <select
            value={draft.formAnswers[field.id] ?? ''}
            onChange={e => update({ formAnswers: { ...draft.formAnswers, [field.id]: e.target.value } })}
            className="border border-warm-gray rounded-lg px-3 py-2 text-charcoal focus:outline-none focus:border-rust bg-white"
          >
            <option value="">Vælg...</option>
            {field.options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          <input
            type={field.type === 'number' ? 'number' : 'text'}
            value={draft.formAnswers[field.id] ?? ''}
            onChange={e => update({ formAnswers: { ...draft.formAnswers, [field.id]: e.target.value } })}
            className="border border-warm-gray rounded-lg px-3 py-2 text-charcoal focus:outline-none focus:border-rust"
          />
        )}
      </label>
    ))
  }

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10 lg:items-start">
      {/* Main wizard */}
      <div className="max-w-xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm text-charcoal/50 mb-1">
            Trin {stepIndex + 1} af {steps.length}
          </p>
          <h1 className="text-2xl font-bold text-charcoal">{service.name}</h1>
        </div>

        {/* Step: Pre-fields */}
        {currentStep === 'pre-fields' && (
          <div>
            <h2 className="text-lg font-semibold text-charcoal mb-4">Oplysninger</h2>
            <div className="flex flex-col gap-4">{renderFieldSet(preVisibleFields)}</div>
          </div>
        )}

        {/* Step: Size category */}
        {currentStep === 'size' && (
          <div>
            <h2 className="text-lg font-semibold text-charcoal mb-4">Vælg størrelse</h2>
            <div className="flex flex-col gap-3">
              {sizeCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => update({ sizeCategoryId: cat.id })}
                  className={`text-left p-4 rounded-xl border-2 transition-colors ${
                    draft.sizeCategoryId === cat.id
                      ? 'border-rust bg-rust/5 text-rust'
                      : 'border-warm-gray bg-white text-charcoal hover:border-rust/40'
                  }`}
                >
                  <span className="font-medium">{cat.label}</span>
                  {cat.description && (
                    <span className="block text-sm opacity-60 mt-0.5">{cat.description}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Time slot */}
        {currentStep === 'slot' && (
          <div>
            <h2 className="text-lg font-semibold text-charcoal mb-4">Vælg tidspunkt</h2>
            {timeSlots.length === 0 ? (
              <p className="text-charcoal/60 bg-white rounded-xl p-6 border border-warm-gray">
                Ingen ledige tider tilgængelige. Kontakt os på{' '}
                <a href={`mailto:${contactEmail}`} className="text-rust underline">
                  {contactEmail}
                </a>
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {timeSlots.map(slot => (
                  <button
                    key={slot.id}
                    data-testid="time-slot"
                    onClick={() => update({ timeSlotId: slot.id })}
                    className={`text-left p-4 rounded-xl border-2 transition-colors ${
                      draft.timeSlotId === slot.id
                        ? 'border-rust bg-rust/5 text-rust'
                        : 'border-warm-gray bg-white text-charcoal hover:border-rust/40'
                    }`}
                  >
                    <span className="font-medium capitalize">{formatSlot(slot.starts_at)}</span>
                    <span className="block text-sm opacity-60 mt-0.5">
                      {slot.capacity - slot.booked_count} ledige pladser
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step: Date range */}
        {currentStep === 'dates' && (
          <div>
            <h2 className="text-lg font-semibold text-charcoal mb-4">Vælg periode</h2>
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-charcoal">Startdato</span>
                <input
                  type="date"
                  value={draft.startDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => update({ startDate: e.target.value })}
                  className="border border-warm-gray rounded-lg px-3 py-2 text-charcoal focus:outline-none focus:border-rust"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-charcoal">Slutdato</span>
                <input
                  type="date"
                  value={draft.endDate}
                  min={draft.startDate || new Date().toISOString().split('T')[0]}
                  onChange={e => update({ endDate: e.target.value })}
                  className="border border-warm-gray rounded-lg px-3 py-2 text-charcoal focus:outline-none focus:border-rust"
                />
              </label>
            </div>
          </div>
        )}

        {/* Step: Post-fields */}
        {currentStep === 'post-fields' && (
          <div>
            <h2 className="text-lg font-semibold text-charcoal mb-4">Om din båd</h2>
            <div className="flex flex-col gap-4">{renderFieldSet(postVisibleFields)}</div>
          </div>
        )}

        {/* Step: Personal info */}
        {currentStep === 'info' && (
          <div>
            <h2 className="text-lg font-semibold text-charcoal mb-4">Dine oplysninger</h2>
            <div className="flex flex-col gap-4">
              {(
                [
                  { key: 'fullName', label: 'Navn', type: 'text' },
                  { key: 'email', label: 'E-mail', type: 'email' },
                  { key: 'phone', label: 'Telefon', type: 'tel' },
                ] as const
              ).map(({ key, label, type }) => (
                <label key={key} className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-charcoal">
                    {label} <span className="text-rust">*</span>
                  </span>
                  <input
                    type={type}
                    value={draft[key]}
                    onChange={e => update({ [key]: e.target.value })}
                    className="border border-warm-gray rounded-lg px-3 py-2 text-charcoal focus:outline-none focus:border-rust"
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step: Summary */}
        {currentStep === 'summary' && (
          <div data-testid="booking-summary">
            <h2 className="text-lg font-semibold text-charcoal mb-4">Opsummering</h2>
            <div className="bg-white rounded-xl border border-warm-gray divide-y divide-warm-gray mb-6">
              <Row label="Ydelse" value={service.name} />
              {selectedCategory && <Row label="Størrelse" value={selectedCategory.label} />}
              {selectedSlot && (
                <Row label="Tidspunkt" value={formatSlot(selectedSlot.starts_at)} />
              )}
              {draft.startDate && <Row label="Startdato" value={formatDate(draft.startDate)} />}
              {draft.endDate && <Row label="Slutdato" value={formatDate(draft.endDate)} />}
              {[...preVisibleFields, ...postVisibleFields].map(field => {
                const raw = effectiveFormAnswers[field.id]
                if (!raw) return null
                const displayLabel = field.options?.find(o => o.value === raw)?.label ?? raw
                return <Row key={field.id} label={field.label} value={displayLabel} />
              })}
              <Row label="Navn" value={draft.fullName} />
              <Row label="E-mail" value={draft.email} />
              <Row label="Telefon" value={draft.phone} />
              {price !== null && (
                <div className="flex justify-between items-center px-4 py-3 bg-offwhite rounded-b-xl">
                  <span className="font-semibold text-charcoal">Total</span>
                  <span className="font-bold text-xl text-rust">
                    {formatPrice(price + resolvedAddOns.reduce((s, l) => s + l.amountOere * l.quantity, 0))}
                  </span>
                </div>
              )}
            </div>
            {payError && <p className="text-sm text-danger mb-4">{payError}</p>}
            <button
              className="w-full bg-rust text-offwhite font-semibold py-3 rounded-xl hover:bg-rust-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handlePay}
              disabled={isPaying}
            >
              {isPaying ? 'Opretter booking…' : 'Gå til betaling'}
            </button>
          </div>
        )}

        {/* Navigation */}
        {currentStep !== 'summary' && (
          <div className="flex gap-3 mt-8">
            {stepIndex > 0 && (
              <button
                onClick={back}
                className="flex-1 border border-warm-gray text-charcoal font-medium py-3 rounded-xl hover:bg-warm-gray transition-colors"
              >
                Tilbage
              </button>
            )}
            <button
              onClick={next}
              disabled={!canAdvance}
              className="flex-1 bg-rust text-offwhite font-semibold py-3 rounded-xl hover:bg-rust-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Næste
            </button>
          </div>
        )}
        {currentStep === 'summary' && stepIndex > 0 && (
          <button
            onClick={back}
            className="w-full mt-3 border border-warm-gray text-charcoal font-medium py-3 rounded-xl hover:bg-warm-gray transition-colors"
          >
            Tilbage
          </button>
        )}
      </div>

      {/* Price panel — desktop sidebar */}
      <div className="hidden lg:block lg:sticky lg:top-8">
        <PricePanel
          primaryLabel={primaryLabel}
          primaryAmountOere={price}
          addOnLines={resolvedAddOns}
        />
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start px-4 py-3 gap-4">
      <span className="text-sm text-charcoal/60 shrink-0">{label}</span>
      <span className="text-sm text-charcoal text-right">{value}</span>
    </div>
  )
}
