'use client'

import { useState, useMemo, useTransition } from 'react'
import type { Service, SizeCategory, PricingRule, TimeSlot, DurationType } from '@/lib/types/domain'
import { calculatePrice, formatPrice, daysBetween } from '@/lib/utils/pricing'
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

type Step = 'size' | 'slot' | 'dates' | 'fields' | 'info' | 'summary'

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
  timeSlots,
  contactEmail,
}: {
  service: Service
  sizeCategories: SizeCategory[]
  pricingRules: PricingRule[]
  timeSlots: TimeSlot[]
  contactEmail: string
}) {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [stepIndex, setStepIndex] = useState(0)
  const [isPaying, startPayTransition] = useTransition()
  const [payError, setPayError] = useState<string | null>(null)

  const steps = useMemo<Step[]>(() => {
    const s: Step[] = []
    if (service.config.requiresSizeCategory) s.push('size')
    if (service.type === 'timeslot') s.push('slot')
    if (service.type === 'capacity' || service.type === 'stock') s.push('dates')
    if (service.config.formFields?.length > 0) s.push('fields')
    s.push('info')
    s.push('summary')
    return s
  }, [service])

  const currentStep = steps[stepIndex]

  const visibleFields = useMemo(
    () =>
      (service.config.formFields ?? []).filter(field => {
        if (!field.dependsOn) return true
        return draft.formAnswers[field.dependsOn.field] === field.dependsOn.value
      }),
    [service.config.formFields, draft.formAnswers]
  )

  const canAdvance = useMemo(() => {
    if (currentStep === 'size') return !!draft.sizeCategoryId
    if (currentStep === 'slot') return !!draft.timeSlotId
    if (currentStep === 'dates') return !!draft.startDate && !!draft.endDate
    if (currentStep === 'fields')
      return visibleFields.every(f => !f.required || !!draft.formAnswers[f.id])
    if (currentStep === 'info')
      return !!draft.fullName && !!draft.email && !!draft.phone
    return true
  }, [currentStep, draft, visibleFields])

  const price = useMemo(() => {
    const durationType = durationTypeForService(service.type)
    const days =
      draft.startDate && draft.endDate
        ? daysBetween(draft.startDate, draft.endDate)
        : 1
    return calculatePrice(
      pricingRules,
      draft.sizeCategoryId || null,
      durationType,
      { days }
    )
  }, [pricingRules, draft.sizeCategoryId, draft.startDate, draft.endDate, service.type])

  const selectedCategory = sizeCategories.find(c => c.id === draft.sizeCategoryId)
  const selectedSlot = timeSlots.find(s => s.id === draft.timeSlotId)

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
        form_answers:     draft.formAnswers,
        full_name:        draft.fullName,
        email:            draft.email,
        phone:            draft.phone,
      })
      if (result.error) {
        setPayError(result.error)
        return
      }
      // result.error was checked above — data is defined
      window.location.href = result.data!.paymentUrl
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-charcoal/50 mb-1">
          Trin {stepIndex + 1} af {steps.length}
        </p>
        <h1 className="text-2xl font-bold text-charcoal">{service.name}</h1>
      </div>

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

      {/* Step: Form fields */}
      {currentStep === 'fields' && (
        <div>
          <h2 className="text-lg font-semibold text-charcoal mb-4">Om din båd</h2>
          <div className="flex flex-col gap-4">
            {visibleFields.map(field => (
              <label key={field.id} className="flex flex-col gap-1">
                <span className="text-sm font-medium text-charcoal">
                  {field.label}
                  {field.required && <span className="text-rust ml-1">*</span>}
                </span>
                {field.type === 'select' && field.options ? (
                  <select
                    value={draft.formAnswers[field.id] ?? ''}
                    onChange={e =>
                      update({ formAnswers: { ...draft.formAnswers, [field.id]: e.target.value } })
                    }
                    className="border border-warm-gray rounded-lg px-3 py-2 text-charcoal focus:outline-none focus:border-rust bg-white"
                  >
                    <option value="">Vælg...</option>
                    {field.options.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : 'text'}
                    value={draft.formAnswers[field.id] ?? ''}
                    onChange={e =>
                      update({ formAnswers: { ...draft.formAnswers, [field.id]: e.target.value } })
                    }
                    className="border border-warm-gray rounded-lg px-3 py-2 text-charcoal focus:outline-none focus:border-rust"
                  />
                )}
              </label>
            ))}
          </div>
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
            {draft.startDate && (
              <Row label="Startdato" value={formatDate(draft.startDate)} />
            )}
            {draft.endDate && (
              <Row label="Slutdato" value={formatDate(draft.endDate)} />
            )}
            {visibleFields.map(field => {
              const raw = draft.formAnswers[field.id]
              if (!raw) return null
              const label = field.options?.find(o => o.value === raw)?.label ?? raw
              return <Row key={field.id} label={field.label} value={label} />
            })}
            <Row label="Navn" value={draft.fullName} />
            <Row label="E-mail" value={draft.email} />
            <Row label="Telefon" value={draft.phone} />
            {price !== null && (
              <div className="flex justify-between items-center px-4 py-3 bg-offwhite rounded-b-xl">
                <span className="font-semibold text-charcoal">Total</span>
                <span className="font-bold text-xl text-rust">{formatPrice(price)}</span>
              </div>
            )}
          </div>
          {payError && (
            <p className="text-sm text-danger mb-4">{payError}</p>
          )}
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
