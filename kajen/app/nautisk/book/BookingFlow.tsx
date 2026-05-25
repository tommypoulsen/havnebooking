'use client'

import { useState } from 'react'
import Link from 'next/link'
import { services, sizeCategories, timeSlots } from '@/lib/mock-data'
import type { Service, SizeCategory, TimeSlot } from '@/lib/types'

interface FormData {
  ownerName: string
  email: string
  phone: string
  boatName: string
  boatLength: string
}

type Step = 1 | 2 | 3 | 4

function StepIndicator({ step }: { step: Step }) {
  const steps = ['Vælg ydelse', 'Båd & ejer', 'Tidspunkt', 'Bekræft']
  return (
    <div className="flex items-center gap-0 mb-10">
      {steps.map((label, i) => {
        const n = (i + 1) as Step
        const active = step === n
        const done = step > n
        return (
          <div key={n} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                ${done ? 'bg-sand text-white' : active ? 'bg-navy text-white' : 'bg-gray-200 text-gray-400'}`}>
                {done ? '✓' : n}
              </div>
              <span className={`text-xs mt-1 ${active ? 'text-navy font-semibold' : 'text-gray-400'}`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 mb-5 ${done ? 'bg-sand' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function Step1({ onSelect }: { onSelect: (s: Service) => void }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-navy mb-1">Hvad ønsker du at booke?</h2>
      <p className="text-gray-500 text-sm mb-6">Vælg én ydelse for at fortsætte.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {services.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className="text-left bg-white border-2 border-sand-light hover:border-navy rounded-lg p-6 transition-colors group"
          >
            <span className="text-3xl">{s.icon}</span>
            <h3 className="text-lg font-bold text-navy mt-3 mb-2 group-hover:text-navy-mid">{s.name}</h3>
            <p className="text-sm text-gray-500 mb-3">{s.description}</p>
            <p className="text-sand font-semibold text-sm">Fra {s.priceFrom.toLocaleString('da-DK')} kr.</p>
          </button>
        ))}
      </div>
    </div>
  )
}

function Step2({
  service, form, setForm, selectedSize, setSelectedSize, onNext, onBack
}: {
  service: Service
  form: FormData
  setForm: (f: FormData) => void
  selectedSize: SizeCategory | null
  setSelectedSize: (s: SizeCategory) => void
  onNext: () => void
  onBack: () => void
}) {
  const sizes = sizeCategories[service.id] ?? []
  const canProceed = form.ownerName && form.email && form.phone && form.boatName && selectedSize

  return (
    <div>
      <h2 className="text-xl font-bold text-navy mb-1">Båd og ejer</h2>
      <p className="text-gray-500 text-sm mb-6">Du booker: <strong>{service.name}</strong></p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {[
          { label: 'Bådens navn', key: 'boatName', placeholder: 'fx Solveig' },
          { label: 'Bådens længde (m)', key: 'boatLength', placeholder: 'fx 9.5' },
          { label: 'Dit navn', key: 'ownerName', placeholder: 'For- og efternavn' },
          { label: 'Telefon', key: 'phone', placeholder: 'xx xx xx xx' },
        ].map(({ label, key, placeholder }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-navy mb-1">{label}</label>
            <input
              type="text"
              placeholder={placeholder}
              value={form[key as keyof FormData]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="w-full border border-sand-light rounded px-3 py-2 text-sm focus:outline-none focus:border-navy"
            />
          </div>
        ))}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-navy mb-1">Email</label>
          <input
            type="email"
            placeholder="din@email.dk"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-sand-light rounded px-3 py-2 text-sm focus:outline-none focus:border-navy"
          />
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-medium text-navy mb-3">Vælg størrelse</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {sizes.map((size) => (
            <button
              key={size.id}
              onClick={() => setSelectedSize(size)}
              className={`border-2 rounded-lg p-4 text-left transition-colors
                ${selectedSize?.id === size.id
                  ? 'border-navy bg-navy text-white'
                  : 'border-sand-light bg-white hover:border-navy'}`}
            >
              <p className="font-semibold text-sm">{size.label}</p>
              <p className={`text-xs mt-0.5 ${selectedSize?.id === size.id ? 'text-white/70' : 'text-gray-400'}`}>
                {size.description}
              </p>
              <p className={`text-sm font-bold mt-2 ${selectedSize?.id === size.id ? 'text-sand-light' : 'text-sand'}`}>
                {size.price.toLocaleString('da-DK')} kr{size.priceUnit}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="px-5 py-2 border border-navy text-navy rounded hover:bg-navy hover:text-white transition-colors text-sm">
          Tilbage
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="px-6 py-2 bg-navy text-white rounded text-sm font-medium hover:bg-navy-mid transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Fortsæt
        </button>
      </div>
    </div>
  )
}

function formatDate(dateStr: string) {
  const days = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag']
  const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
  const d = new Date(dateStr)
  return `${days[d.getDay()]} ${d.getDate()}. ${months[d.getMonth()]}`
}

function Step3({
  service, selectedSize, selectedSlot, setSelectedSlot, onNext, onBack
}: {
  service: Service
  selectedSize: SizeCategory
  selectedSlot: TimeSlot | null
  setSelectedSlot: (s: TimeSlot | null) => void
  onNext: () => void
  onBack: () => void
}) {
  if (service.type !== 'kranløft') {
    return (
      <div>
        <h2 className="text-xl font-bold text-navy mb-1">Periode</h2>
        <p className="text-gray-500 text-sm mb-6">Du booker: <strong>{service.name} · {selectedSize.label}</strong></p>
        <div className="bg-white border border-sand-light rounded-lg p-6 mb-8 max-w-md">
          <p className="text-sm text-gray-500 mb-1">Sæson</p>
          <p className="font-bold text-navy text-lg">Oktober 2026 – April 2027</p>
          <p className="text-sm text-gray-400 mt-1">Indlevering fra 1. oktober · Afhentning inden 30. april</p>
          <div className="mt-4 pt-4 border-t border-sand-light">
            <p className="text-sm text-gray-500">Pris</p>
            <p className="text-2xl font-bold text-sand">{selectedSize.price.toLocaleString('da-DK')} kr.</p>
            <p className="text-xs text-gray-400">{selectedSize.priceUnit}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onBack} className="px-5 py-2 border border-navy text-navy rounded hover:bg-navy hover:text-white transition-colors text-sm">Tilbage</button>
          <button onClick={onNext} className="px-6 py-2 bg-navy text-white rounded text-sm font-medium hover:bg-navy-mid transition-colors">Fortsæt</button>
        </div>
      </div>
    )
  }

  // Group slots by date
  const slotsByDate: Record<string, TimeSlot[]> = {}
  for (const slot of timeSlots) {
    if (!slotsByDate[slot.date]) slotsByDate[slot.date] = []
    slotsByDate[slot.date].push(slot)
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-navy mb-1">Vælg tidspunkt</h2>
      <p className="text-gray-500 text-sm mb-6">Du booker: <strong>Kranløft · {selectedSize.label}</strong> · {selectedSize.price.toLocaleString('da-DK')} kr/løft</p>

      {Object.entries(slotsByDate).map(([date, slots]) => (
        <div key={date} className="mb-6">
          <h3 className="text-sm font-semibold text-navy mb-3 uppercase tracking-wide">{formatDate(date)}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {slots.map((slot) => {
              const full = slot.booked >= slot.capacity
              const selected = selectedSlot?.id === slot.id
              return (
                <button
                  key={slot.id}
                  onClick={() => !full && setSelectedSlot(selected ? null : slot)}
                  disabled={full}
                  className={`border-2 rounded-lg p-3 text-center transition-colors
                    ${full ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                      : selected ? 'border-navy bg-navy text-white'
                      : 'border-sand-light bg-white hover:border-navy'}`}
                >
                  <p className="font-bold text-lg">{slot.time}</p>
                  <p className={`text-xs mt-1 ${full ? 'text-gray-300' : selected ? 'text-white/70' : 'text-gray-400'}`}>
                    {full ? 'Optaget' : `${slot.capacity - slot.booked} ledig`}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <div className="flex gap-3 mt-4">
        <button onClick={onBack} className="px-5 py-2 border border-navy text-navy rounded hover:bg-navy hover:text-white transition-colors text-sm">Tilbage</button>
        <button
          onClick={onNext}
          disabled={!selectedSlot}
          className="px-6 py-2 bg-navy text-white rounded text-sm font-medium hover:bg-navy-mid transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Fortsæt
        </button>
      </div>
    </div>
  )
}

function Step4({
  service, form, selectedSize, selectedSlot, onBack, onConfirm
}: {
  service: Service
  form: FormData
  selectedSize: SizeCategory
  selectedSlot: TimeSlot | null
  onBack: () => void
  onConfirm: () => void
}) {
  const rows = [
    { label: 'Ydelse', value: service.name },
    { label: 'Størrelse', value: `${selectedSize.label} · ${selectedSize.description}` },
    ...(selectedSlot ? [{ label: 'Tidspunkt', value: `${formatDate(selectedSlot.date)} kl. ${selectedSlot.time}` }] : [
      { label: 'Periode', value: 'Oktober 2026 – April 2027' }
    ]),
    { label: 'Båd', value: `${form.boatName}${form.boatLength ? ` (${form.boatLength} m)` : ''}` },
    { label: 'Ejer', value: form.ownerName },
    { label: 'Email', value: form.email },
    { label: 'Telefon', value: form.phone },
  ]

  return (
    <div>
      <h2 className="text-xl font-bold text-navy mb-1">Bekræft booking</h2>
      <p className="text-gray-500 text-sm mb-6">Gennemse detaljerne og klik Bekræft.</p>

      <div className="bg-white border border-sand-light rounded-lg overflow-hidden mb-6 max-w-lg">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex px-5 py-3 border-b border-sand-light last:border-0">
            <span className="text-sm text-gray-400 w-28 shrink-0">{label}</span>
            <span className="text-sm font-medium text-navy">{value}</span>
          </div>
        ))}
        <div className="flex px-5 py-4 bg-cream">
          <span className="text-sm font-bold text-navy w-28 shrink-0">Total</span>
          <span className="text-lg font-bold text-sand">{selectedSize.price.toLocaleString('da-DK')} kr.{selectedSize.priceUnit}</span>
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-6 max-w-lg">
        Dette er en prototype — ingen betaling gennemføres. I den færdige løsning ville du nu blive sendt videre til betaling via MobilePay eller kort.
      </p>

      <div className="flex gap-3">
        <button onClick={onBack} className="px-5 py-2 border border-navy text-navy rounded hover:bg-navy hover:text-white transition-colors text-sm">Tilbage</button>
        <button onClick={onConfirm} className="px-8 py-2 bg-sand hover:bg-sand-light text-white rounded text-sm font-bold transition-colors">
          Bekræft booking
        </button>
      </div>
    </div>
  )
}

function ConfirmationView({
  service, form, selectedSize, selectedSlot
}: {
  service: Service
  form: FormData
  selectedSize: SizeCategory
  selectedSlot: TimeSlot | null
}) {
  const bookingId = `HB-2026-${String(Math.floor(Math.random() * 90000) + 10000)}`

  return (
    <div className="text-center max-w-md mx-auto py-8">
      <div className="text-5xl mb-4">✅</div>
      <h2 className="text-2xl font-bold text-navy mb-2">Booking bekræftet!</h2>
      <p className="text-gray-500 mb-6">Vi har registreret din booking og sender en kvittering til <strong>{form.email}</strong>.</p>

      <div className="bg-white border border-sand-light rounded-lg p-6 text-left mb-6">
        <p className="text-xs text-gray-400 mb-1">Bookingnummer</p>
        <p className="font-bold text-navy text-lg mb-4">{bookingId}</p>
        <p className="text-sm"><span className="text-gray-400">Ydelse: </span>{service.name} · {selectedSize.label}</p>
        <p className="text-sm"><span className="text-gray-400">Båd: </span>{form.boatName}</p>
        {selectedSlot
          ? <p className="text-sm"><span className="text-gray-400">Tidspunkt: </span>{formatDate(selectedSlot.date)} kl. {selectedSlot.time}</p>
          : <p className="text-sm"><span className="text-gray-400">Periode: </span>Oktober 2026 – April 2027</p>
        }
        <p className="text-sm mt-3 font-bold text-sand">{selectedSize.price.toLocaleString('da-DK')} kr.{selectedSize.priceUnit}</p>
      </div>

      <Link href="/" className="inline-block bg-navy hover:bg-navy-mid text-white font-medium px-8 py-3 rounded transition-colors">
        Tilbage til forsiden
      </Link>
    </div>
  )
}

export default function BookingFlow({ initialService }: { initialService?: string }) {
  const [step, setStep] = useState<Step>(initialService ? 2 : 1)
  const [confirmed, setConfirmed] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(
    initialService ? services.find(s => s.id === initialService) ?? null : null
  )
  const [selectedSize, setSelectedSize] = useState<SizeCategory | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [form, setForm] = useState<FormData>({ ownerName: '', email: '', phone: '', boatName: '', boatLength: '' })

  if (confirmed && selectedService && selectedSize) {
    return <ConfirmationView service={selectedService} form={form} selectedSize={selectedSize} selectedSlot={selectedSlot} />
  }

  return (
    <div>
      <StepIndicator step={step} />
      {step === 1 && (
        <Step1 onSelect={(s) => { setSelectedService(s); setStep(2) }} />
      )}
      {step === 2 && selectedService && (
        <Step2
          service={selectedService}
          form={form}
          setForm={setForm}
          selectedSize={selectedSize}
          setSelectedSize={setSelectedSize}
          onNext={() => setStep(3)}
          onBack={() => { setStep(1); setSelectedSize(null) }}
        />
      )}
      {step === 3 && selectedService && selectedSize && (
        <Step3
          service={selectedService}
          selectedSize={selectedSize}
          selectedSlot={selectedSlot}
          setSelectedSlot={setSelectedSlot}
          onNext={() => setStep(4)}
          onBack={() => setStep(2)}
        />
      )}
      {step === 4 && selectedService && selectedSize && (
        <Step4
          service={selectedService}
          form={form}
          selectedSize={selectedSize}
          selectedSlot={selectedSlot}
          onBack={() => setStep(3)}
          onConfirm={() => setConfirmed(true)}
        />
      )}
    </div>
  )
}
