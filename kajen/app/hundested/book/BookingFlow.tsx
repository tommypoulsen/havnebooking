'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { timeSlots } from '@/lib/mock-data'
import type { TimeSlot } from '@/lib/types'

// ── TYPER ──────────────────────────────────────────────────────────────────

type LiftType   = 'kun-kranløft' | 'vinteropbevaring' | 'bedding'
type BoatType   = 'sejlbåd' | 'motorbåd'
type MastChoice = 'med-mast' | 'uden-mast'
type WeightId   = '0-3t' | '3-6t' | '6-12t' | '12-20t'
type Step = 'boat' | 'lifttype' | 'timeslot' | 'info' | 'summary' | 'payment' | 'confirmed'

interface State {
  liftType:           LiftType | null
  boatType:           BoatType | null
  mast:               MastChoice | null
  wantsStormstøtter:  boolean | null
  weight:             WeightId | null
  timeSlot:           TimeSlot | null
  boatName:           string
  boatWidth:          string
  ownerName:          string
  email:              string
  phone:              string
  payCardNumber:      string
  payExpiry:          string
  payCVV:             string
  payName:            string
}

const EMPTY: State = {
  liftType: null, boatType: null, mast: null, wantsStormstøtter: null,
  weight: null, timeSlot: null, boatName: '', boatWidth: '', ownerName: '', email: '', phone: '',
  payCardNumber: '', payExpiry: '', payCVV: '', payName: '',
}

// ── PRISER ─────────────────────────────────────────────────────────────────

const WEIGHTS: { id: WeightId; label: string; sub: string }[] = [
  { id: '0-3t',   label: 'Op til 3 ton',  sub: 'Lette både'   },
  { id: '3-6t',   label: '3 – 6 ton',     sub: 'Mellemstore'  },
  { id: '6-12t',  label: '6 – 12 ton',    sub: 'Tunge'        },
  { id: '12-20t', label: '12 – 20 ton',   sub: 'Meget tunge'  },
]

const TRANSPORT = 473  // 472,50 kr. pr. retning — flad pris uanset vægt

const P: Record<string, Record<WeightId, number>> = {
  kranløft:     { '0-3t': 893,  '3-6t': 1260, '6-12t': 1890,  '12-20t': 2520 },
  mastetillæg:  { '0-3t': 158,  '3-6t': 210,  '6-12t': 263,   '12-20t': 315  },
  stativ_sejl:  { '0-3t': 1575, '3-6t': 2100, '6-12t': 2363,  '12-20t': 2625 },
  stativ_motor: { '0-3t': 1838, '3-6t': 2494, '6-12t': 2835,  '12-20t': 3150 },
  stormstøtter: { '0-3t': 263,  '3-6t': 315,  '6-12t': 420,   '12-20t': 525  },
}

function calcTotal(s: State) {
  if (!s.weight) return { lines: [] as { label: string; price: number }[], total: 0 }
  const lines: { label: string; price: number }[] = []
  lines.push({ label: 'Kranløft', price: P.kranløft[s.weight] })
  if (s.boatType === 'sejlbåd' && s.mast === 'med-mast')
    lines.push({ label: 'Mastetillæg', price: P.mastetillæg[s.weight] })
  if (s.liftType === 'vinteropbevaring') {
    lines.push({ label: 'Stativleje (sæson)', price: P[s.boatType === 'motorbåd' ? 'stativ_motor' : 'stativ_sejl'][s.weight] })
    lines.push({ label: 'Transport til opbevaringsplads', price: TRANSPORT })
    if (s.boatType === 'sejlbåd' && s.mast === 'med-mast')
      lines.push({ label: 'Mastetillæg transport', price: P.mastetillæg[s.weight] })
  }
  const includeStorm = s.boatType === 'sejlbåd' && needsStorage(s) && (s.mast === 'med-mast' || s.wantsStormstøtter)
  if (includeStorm)
    lines.push({ label: 'Stormstøtter', price: P.stormstøtter[s.weight] })
  return { lines, total: lines.reduce((sum, l) => sum + l.price, 0) }
}

// ── STEP NAVIGATION ────────────────────────────────────────────────────────

const needsStorage = (s: State) => s.liftType === 'vinteropbevaring' || s.liftType === 'bedding'

function nextStep(s: State, current: Step): Step {
  switch (current) {
    case 'lifttype':  return 'boat'
    case 'boat':      return 'timeslot'
    case 'timeslot':  return 'info'
    case 'info':      return 'summary'
    case 'summary':   return 'payment'
    default:          return 'confirmed'
  }
}

function prevStep(s: State, current: Step): Step {
  switch (current) {
    case 'boat':     return 'lifttype'
    case 'timeslot': return 'boat'
    case 'info':     return 'timeslot'
    case 'summary':  return 'info'
    case 'payment':  return 'summary'
    default:         return 'lifttype'
  }
}

// ── HJÆLPER: felthak ──────────────────────────────────────────────────────

function FieldCheck() {
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-rust shrink-0">
      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
        <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  )
}

// ── HJÆLPER: selektionskort ────────────────────────────────────────────────

function ChoiceCard({ label, sub, note, selected, onClick }: {
  label: string; sub?: string; note?: string; selected: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 border rounded-xl transition-all duration-150
        ${selected
          ? 'border-rust bg-rust/5 shadow-sm'
          : 'border-warm-gray bg-white hover:border-gray-300 hover:shadow-sm'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={`font-semibold text-sm ${selected ? 'text-rust' : 'text-charcoal'}`}>{label}</p>
          {sub  && <p className={`text-xs mt-0.5 ${selected ? 'text-rust/60' : 'text-gray-400'}`}>{sub}</p>}
          {note && <p className="text-xs mt-1.5 font-medium text-rust">{note}</p>}
        </div>
        {selected && (
          <div className="w-4 h-4 rounded-full bg-rust flex items-center justify-center shrink-0 mt-0.5">
            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
              <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>
    </button>
  )
}

// ── SELEKTIONS-TRAIL ───────────────────────────────────────────────────────

const LABELS: Record<string, string> = {
  'kun-kranløft': 'Kun kranløft', 'vinteropbevaring': 'Til vinteropbevaring', 'bedding': 'Til bedding',
  'sejlbåd': 'Sejlbåd', 'motorbåd': 'Motorbåd',
  'med-mast': 'Med mast', 'uden-mast': 'Uden mast',
}

function Trail({ s }: { s: State }) {
  const pills = [
    s.liftType  && LABELS[s.liftType],
    s.boatType  && LABELS[s.boatType],
    s.mast      && LABELS[s.mast],
    s.weight    && WEIGHTS.find(w => w.id === s.weight)?.label,
    s.wantsStormstøtter === true  && 'Stormstøtter: ja',
    s.wantsStormstøtter === false && 'Stormstøtter: nej',
    s.timeSlot  && `${s.timeSlot.date} kl. ${s.timeSlot.time}`,
  ].filter(Boolean) as string[]

  if (!pills.length) return null
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {pills.map(p => (
        <span key={p} className="text-xs bg-charcoal text-white px-3 py-1 rounded-full">{p}</span>
      ))}
    </div>
  )
}

// ── PRIS-PANEL ─────────────────────────────────────────────────────────────

type PanelAction = { label?: string; onClick?: () => void; disabled?: boolean; back?: () => void; isRust?: boolean } | null

function PricePanel({ s }: { s: State }) {
  const { lines, total } = calcTotal(s)
  return (
    <div className="bg-white border border-warm-gray rounded-xl p-5 sticky top-6">
      <p className="text-xs font-black uppercase tracking-widest text-charcoal mb-4">Din ordre</p>
      {lines.length === 0
        ? <p className="text-sm text-gray-400">Prisen beregnes efterhånden som du vælger.</p>
        : (
          <div className="space-y-2">
            {lines.map(l => (
              <div key={l.label} className="flex justify-between text-sm">
                <span className="text-gray-500">{l.label}</span>
                <span className="font-medium text-charcoal">{l.price.toLocaleString('da-DK')} kr.</span>
              </div>
            ))}
            <div className="border-t border-warm-gray pt-3 mt-3 flex justify-between">
              <span className="font-black text-charcoal text-sm">Total</span>
              <span className="font-black text-rust text-lg">{total.toLocaleString('da-DK')} kr.</span>
            </div>
            {s.liftType === 'bedding' && (
              <p className="text-xs text-gray-400 mt-2">Beddingpris aftales særskilt.</p>
            )}
          </div>
        )
      }
      {s.boatType === 'sejlbåd' && s.mast === 'med-mast' && needsStorage(s) && (
        <p className="text-xs text-rust mt-3 border-t border-warm-gray pt-3">✓ Stormstøtter inkluderet ved mast</p>
      )}
    </div>
  )
}

// ── DATO-FORMATTERING ──────────────────────────────────────────────────────

function formatDate(d: string) {
  const days = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør']
  const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
  const dt = new Date(d)
  return `${days[dt.getDay()]} ${dt.getDate()}. ${months[dt.getMonth()]}`
}

// ── HOVED-KOMPONENT ────────────────────────────────────────────────────────

export default function BookingFlow() {
  const [step, setStep]   = useState<Step>('lifttype')
  const [s, setS]         = useState<State>(EMPTY)
  const [paying, setPaying] = useState(false)

  const update = useCallback((patch: Partial<State>) => setS(prev => ({ ...prev, ...patch })), [])

  const advance = useCallback((patch: Partial<State>) => {
    const next = { ...s, ...patch }
    setS(next)
    setTimeout(() => setStep(cur => nextStep(next, cur)), 250)
  }, [s])

  const back = () => setStep(cur => prevStep(s, cur))

  if (step === 'confirmed') {
    const bookingId = `HB-2026-${Math.floor(Math.random() * 90000) + 10000}`
    const { lines, total } = calcTotal(s)
    return (
      <div className="max-w-lg mx-auto py-16">

        {/* Ikon + titel */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-rust/10 flex items-center justify-center shrink-0">
            <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
              <path d="M2 9l6 6L20 2" stroke="#b34a2a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-charcoal leading-none">Booking bekræftet</h2>
            <p className="text-sm text-gray-400 mt-1">Kvittering sendes til <span className="text-charcoal font-medium">{s.email}</span></p>
          </div>
        </div>

        {/* Bookingnummer */}
        <div className="bg-white border border-warm-gray rounded-xl px-6 py-4 mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-0.5">Bookingnummer</p>
            <p className="text-xl font-black text-charcoal tracking-wide">{bookingId}</p>
          </div>
          <div className="w-0.5 h-10 bg-warm-gray mx-2" />
          <div className="text-right">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-0.5">Båd</p>
            <p className="text-sm font-semibold text-charcoal">{s.boatName || '—'}</p>
          </div>
        </div>

        {/* Prislinjer */}
        <div className="bg-white border border-warm-gray rounded-xl divide-y divide-warm-gray mb-6">
          {lines.map(l => (
            <div key={l.label} className="flex justify-between px-6 py-3 text-sm">
              <span className="text-gray-500">{l.label}</span>
              <span className="font-medium text-charcoal">{l.price.toLocaleString('da-DK')} kr.</span>
            </div>
          ))}
          <div className="flex justify-between px-6 py-4 bg-offwhite rounded-b-xl">
            <span className="text-sm font-black text-charcoal">Betalt i alt</span>
            <span className="text-xl font-black text-rust">{total.toLocaleString('da-DK')} kr.</span>
          </div>
        </div>

        {/* Næste skridt */}
        <div className="border-l-2 border-rust pl-4 mb-8 space-y-1">
          <p className="text-xs font-black uppercase tracking-widest text-rust">Hvad sker der nu?</p>
          <p className="text-sm text-gray-500 leading-relaxed">Vi sender en bekræftelse og kvittering til din e-mail. Vi kontakter dig inden kranløftet for at koordinere det praktiske.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/hundested" className="bg-charcoal hover:bg-charcoal-mid text-white font-black uppercase tracking-widest text-xs px-8 py-3 transition-colors rounded-lg">
            Tilbage til forsiden
          </Link>
          <Link href="/hundested/kontakt" className="border border-warm-gray hover:border-charcoal text-charcoal font-bold uppercase tracking-widest text-xs px-8 py-3 transition-colors rounded-lg">
            Kontakt os
          </Link>
        </div>

        <p className="text-xs text-gray-300 mt-8">Prototype · ingen rigtig betaling gennemført</p>
      </div>
    )
  }

  const boatReady = !!s.boatName && !!s.boatWidth && !!s.boatType && !!s.weight && (
    s.boatType !== 'sejlbåd' || (!!s.mast && (s.mast !== 'uden-mast' || s.wantsStormstøtter !== null))
  )
  const infoReady  = !!s.ownerName && !!s.email && !!s.phone
  const payReady   = s.payCardNumber.replace(/\s/g, '').length === 16 && s.payExpiry.length === 5 && s.payCVV.length === 3 && s.payName.length > 1

  const handlePay = () => {
    setPaying(true)
    setTimeout(() => { setPaying(false); setStep('confirmed') }, 2200)
  }
  const { lines, total } = calcTotal(s)

  const panelAction: PanelAction =
    step === 'boat'     ? { label: 'Fortsæt', onClick: () => setStep(nextStep(s, 'boat')), disabled: !boatReady, back } :
    step === 'timeslot' ? { back } :
    step === 'info'     ? { label: 'Se opsummering', onClick: () => setStep('summary'), disabled: !infoReady, back } :
    step === 'summary'  ? { label: 'Gå til betaling', onClick: () => setStep('payment'), back, isRust: true } :
    step === 'payment'  ? { label: `Betal ${total.toLocaleString('da-DK')} kr.`, onClick: handlePay, disabled: !payReady, back, isRust: true } :
    null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">

      {/* ── VENSTRE: spørgsmål ── */}
      <div className="lg:col-span-2">
        {step !== 'lifttype' && (
          <button onClick={back} className="text-xs text-gray-400 hover:text-charcoal mb-4 transition-colors">← Tilbage</button>
        )}
        <Trail s={s} />

        {/* TRIN 1: Båd */}
        {step === 'boat' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-charcoal mb-1">Din båd</h2>
              <p className="text-gray-400 text-sm">Udfyld oplysningerne for at komme videre</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-charcoal mb-1.5">
                  Bådens navn
                  {s.boatName && <FieldCheck />}
                </label>
                <input type="text" placeholder="fx Solveig" value={s.boatName}
                  onChange={e => update({ boatName: e.target.value })}
                  className="w-full border border-warm-gray px-3 py-2 text-sm focus:outline-none focus:border-charcoal rounded-lg" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-charcoal mb-1.5">
                  Bredde
                  {s.boatWidth && <FieldCheck />}
                </label>
                <div className="relative">
                  <input type="text" placeholder="fx 3,5" value={s.boatWidth}
                    onChange={e => update({ boatWidth: e.target.value })}
                    className="w-full border border-warm-gray px-3 py-2 text-sm focus:outline-none focus:border-charcoal rounded-lg pr-10" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">m</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-widest text-charcoal mb-1.5">
                Vægt
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {WEIGHTS.map(w => {
                  const sel = s.weight === w.id
                  return (
                    <button key={w.id} onClick={() => update({ weight: w.id })}
                      className={`relative text-center py-2.5 px-2 border rounded-xl transition-all
                        ${sel ? 'border-rust bg-rust/5 shadow-sm' : 'border-warm-gray bg-white hover:border-gray-300 hover:shadow-sm'}`}>
                      {sel && <span className="absolute top-1.5 right-1.5"><FieldCheck /></span>}
                      <p className={`text-xs font-semibold leading-tight ${sel ? 'text-rust' : 'text-charcoal'}`}>{w.label}</p>
                      <p className={`text-xs mt-0.5 ${sel ? 'text-rust/60' : 'text-gray-400'}`}>{P.kranløft[w.id].toLocaleString('da-DK')} kr.</p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-widest text-charcoal mb-1.5">Type</p>
              <div className="grid grid-cols-2 gap-2">
                <ChoiceCard label="Sejlbåd" sub="Inkl. keelboat og cat"
                  selected={s.boatType === 'sejlbåd'} onClick={() => update({ boatType: 'sejlbåd', mast: null, wantsStormstøtter: null })} />
                <ChoiceCard label="Motorbåd" sub="Inkl. speedbåd og cabin"
                  selected={s.boatType === 'motorbåd'} onClick={() => update({ boatType: 'motorbåd', mast: null, wantsStormstøtter: null })} />
              </div>
            </div>

            {s.boatType === 'sejlbåd' && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-charcoal mb-1.5">Er masten monteret?</p>
                  <div className="grid grid-cols-2 gap-2">
                    <ChoiceCard label="Med mast" sub="Stormstøtter inkluderet"
                      selected={s.mast === 'med-mast'} onClick={() => update({ mast: 'med-mast', wantsStormstøtter: null })} />
                    <ChoiceCard label="Uden mast" sub="Afmonteret inden løft"
                      selected={s.mast === 'uden-mast'} onClick={() => update({ mast: 'uden-mast', wantsStormstøtter: null })} />
                  </div>
                </div>
                {s.mast === 'uden-mast' && (
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-charcoal mb-1.5">Stormstøtter ved opbevaring?</p>
                    <div className="grid grid-cols-2 gap-2">
                      <ChoiceCard label="Ja tak"
                        sub={s.weight ? `4 stormstøtter · ${P.stormstøtter[s.weight].toLocaleString('da-DK')} kr.` : '4 stormstøtter · 263–525 kr.'}
                        selected={s.wantsStormstøtter === true} onClick={() => update({ wantsStormstøtter: true })} />
                      <ChoiceCard label="Nej tak" sub="Ingen stormstøtter"
                        selected={s.wantsStormstøtter === false} onClick={() => update({ wantsStormstøtter: false })} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {!boatReady && (
              <div className="text-xs text-gray-400 border-l-2 border-warm-gray pl-3 space-y-1">
                <p className="font-semibold text-gray-500 mb-1">Udfyld disse felter for at komme videre:</p>
                {([
                  !s.boatName                  && 'Bådens navn',
                  !s.boatWidth                 && 'Bredde',
                  !s.boatType                  && 'Båd-type',
                  !s.weight                    && 'Vægt',
                  s.boatType === 'sejlbåd' && !s.mast && 'Er masten monteret?',
                  s.boatType === 'sejlbåd' && s.mast === 'uden-mast' && s.wantsStormstøtter === null && 'Stormstøtter',
                ].filter(Boolean) as string[]).map(item => (
                  <p key={item}>· {item}</p>
                ))}
              </div>
            )}

          </div>
        )}

        {/* TRIN 2: Kranløft-type */}
        {step === 'lifttype' && (
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-charcoal mb-1">Hvad skal kranen bruges til?</h2>
            <p className="text-gray-400 text-sm mb-5">Vælg én type for at fortsætte</p>
            <div className="space-y-2">
              <ChoiceCard label="Kranløft til vinteropbevaring" sub="Båden tages op og sættes på stativer til foråret"
                selected={s.liftType === 'vinteropbevaring'} onClick={() => advance({ liftType: 'vinteropbevaring' })} />
              <ChoiceCard label="Kranløft til bedding" sub="Løft til beddingen til vedligehold og reparation"
                selected={s.liftType === 'bedding'} onClick={() => advance({ liftType: 'bedding' })} />
              <ChoiceCard label="Kun kranløft" sub="Isætning eller optagning — ingen vinteropbevaring"
                selected={s.liftType === 'kun-kranløft'} onClick={() => advance({ liftType: 'kun-kranløft' })} />
            </div>
          </div>
        )}

        {/* TRIN 3: Tidspunkt */}
        {step === 'timeslot' && (
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-charcoal mb-1">Vælg tidspunkt</h2>
            <p className="text-gray-400 text-sm mb-5">Klik på et ledigt tidspunkt</p>
            {Object.entries(
              timeSlots.reduce((acc, sl) => ({ ...acc, [sl.date]: [...(acc[sl.date] ?? []), sl] }), {} as Record<string, TimeSlot[]>)
            ).map(([date, slots]) => (
              <div key={date} className="mb-4">
                <p className="text-xs font-black uppercase tracking-widest text-charcoal mb-2">{formatDate(date)}</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slots.map(sl => {
                    const full = sl.booked >= sl.capacity
                    const sel  = s.timeSlot?.id === sl.id
                    return (
                      <button key={sl.id} disabled={full} onClick={() => advance({ timeSlot: sl })}
                        className={`py-2.5 text-center text-sm font-semibold rounded-xl border transition-all
                          ${full ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                            : sel  ? 'border-rust bg-rust/5 shadow-sm'
                            : 'border-warm-gray bg-white hover:border-gray-300 hover:shadow-sm'}`}>
                        <span className={sel ? 'text-rust' : ''}>{sl.time}</span>
                        {!full && <span className={`block text-xs font-normal ${sel ? 'text-rust/60' : 'text-gray-400'}`}>{sl.capacity - sl.booked} ledig</span>}
                        {full  && <span className="block text-xs font-normal">Optaget</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TRIN 4: Oplysninger */}
        {step === 'info' && (
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-charcoal mb-1">Dine kontaktoplysninger</h2>
            <p className="text-gray-400 text-sm mb-5">Vi sender en bekræftelse til din e-mail</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {([
                { label: 'Dit navn', key: 'ownerName', ph: 'For- og efternavn' },
                { label: 'Telefon',  key: 'phone',     ph: 'xx xx xx xx' },
                { label: 'E-mail',   key: 'email',     ph: 'din@email.dk', full: true },
              ] as {label:string;key:keyof State;ph:string;full?:boolean}[]).map(f => (
                <div key={f.key} className={f.full ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs font-black uppercase tracking-widest text-charcoal mb-1.5">{f.label}</label>
                  <input type="text" placeholder={f.ph} value={s[f.key] as string}
                    onChange={e => update({ [f.key]: e.target.value })}
                    className="w-full border border-warm-gray px-3 py-2 text-sm focus:outline-none focus:border-charcoal rounded-lg" />
                </div>
              ))}
            </div>
            {!infoReady && (
              <div className="text-xs text-gray-400 border-l-2 border-warm-gray pl-3 space-y-1">
                <p className="font-semibold text-gray-500 mb-1">Udfyld disse felter for at komme videre:</p>
                {([
                  !s.ownerName && 'Dit navn',
                  !s.email     && 'E-mail',
                  !s.phone     && 'Telefon',
                ].filter(Boolean) as string[]).map(item => (
                  <p key={item}>· {item}</p>
                ))}
              </div>
            )}

          </div>
        )}

        {/* TRIN 5: Opsummering */}
        {step === 'summary' && (
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-charcoal mb-1">Bekræft booking</h2>
            <p className="text-gray-400 text-sm mb-5">Gennemse og bekræft</p>
            <div className="bg-white border border-warm-gray rounded-xl divide-y divide-warm-gray mb-5">
              {[
                { label: 'Ydelse',    val: { 'kun-kranløft': 'Kun kranløft', 'vinteropbevaring': 'Kranløft til vinteropbevaring', 'bedding': 'Kranløft til bedding' }[s.liftType!] },
                { label: 'Båd',       val: s.boatType === 'sejlbåd' ? `Sejlbåd · ${s.mast === 'med-mast' ? 'med mast' : 'uden mast'}` : 'Motorbåd' },
                s.wantsStormstøtter !== null && { label: 'Stormstøtter', val: s.mast === 'med-mast' ? 'Inkluderet' : s.wantsStormstøtter ? 'Tilvalgt' : 'Fravalgt' },
                s.weight && { label: 'Vægt', val: WEIGHTS.find(w => w.id === s.weight)?.label },
                s.timeSlot && { label: 'Tidspunkt', val: `${formatDate(s.timeSlot.date)} kl. ${s.timeSlot.time}` },
                { label: 'Bådens navn', val: s.boatName || '—' },
                s.boatWidth && { label: 'Bredde', val: `${s.boatWidth} m` },
                { label: 'Ejer', val: s.ownerName },
                { label: 'E-mail', val: s.email },
                { label: 'Telefon', val: s.phone },
              ].filter(Boolean).map((row: any) => (
                <div key={row.label} className="flex px-4 py-2.5">
                  <span className="text-xs text-gray-400 w-28 shrink-0 pt-0.5">{row.label}</span>
                  <span className="text-sm font-medium text-charcoal">{row.val}</span>
                </div>
              ))}
              <div className="flex px-4 py-3.5 bg-offwhite rounded-b-xl">
                <span className="text-sm font-black text-charcoal w-28 shrink-0">Total</span>
                <span className="text-xl font-black text-rust">{total.toLocaleString('da-DK')} kr.</span>
              </div>
            </div>
          </div>
        )}

        {/* TRIN 6: Betaling */}
        {step === 'payment' && (
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-charcoal mb-1">Betaling</h2>
            <p className="text-gray-400 text-sm mb-5">Prototype · ingen rigtig betaling gennemføres</p>

            {paying ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-8 h-8 border-2 border-rust border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Behandler betaling...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white border border-warm-gray rounded-xl p-5 space-y-4">

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-charcoal mb-1.5">Kortnummer</label>
                    <input
                      type="text" inputMode="numeric" placeholder="•••• •••• •••• ••••"
                      value={s.payCardNumber} maxLength={19}
                      onChange={e => {
                        const d = e.target.value.replace(/\D/g, '').slice(0, 16)
                        update({ payCardNumber: d.replace(/(.{4})/g, '$1 ').trim() })
                      }}
                      className="w-full border border-warm-gray px-3 py-2 text-sm focus:outline-none focus:border-charcoal rounded-lg font-mono tracking-widest"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-charcoal mb-1.5">Udløbsdato</label>
                      <input
                        type="text" inputMode="numeric" placeholder="MM/ÅÅ"
                        value={s.payExpiry} maxLength={5}
                        onChange={e => {
                          const d = e.target.value.replace(/\D/g, '').slice(0, 4)
                          update({ payExpiry: d.length >= 2 ? d.slice(0,2) + '/' + d.slice(2) : d })
                        }}
                        className="w-full border border-warm-gray px-3 py-2 text-sm focus:outline-none focus:border-charcoal rounded-lg font-mono tracking-widest"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-charcoal mb-1.5">CVV</label>
                      <input
                        type="text" inputMode="numeric" placeholder="•••"
                        value={s.payCVV} maxLength={3}
                        onChange={e => update({ payCVV: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                        className="w-full border border-warm-gray px-3 py-2 text-sm focus:outline-none focus:border-charcoal rounded-lg font-mono tracking-widest"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-charcoal mb-1.5">Navn på kort</label>
                    <input
                      type="text" placeholder="Som det står på kortet"
                      value={s.payName}
                      onChange={e => update({ payName: e.target.value })}
                      className="w-full border border-warm-gray px-3 py-2 text-sm focus:outline-none focus:border-charcoal rounded-lg"
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <svg width="12" height="14" viewBox="0 0 12 14" fill="none" className="shrink-0">
                    <rect x="1" y="5" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M4 5V3.5a2 2 0 0 1 4 0V5" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                  Dine kortoplysninger transmitteres sikkert og gemmes ikke
                </p>

                {!payReady && (
                  <div className="text-xs text-gray-400 border-l-2 border-warm-gray pl-3 space-y-1">
                    <p className="font-semibold text-gray-500 mb-1">Udfyld disse felter for at betale:</p>
                    {([
                      s.payCardNumber.replace(/\s/g, '').length < 16 && 'Kortnummer (16 cifre)',
                      s.payExpiry.length < 5                          && 'Udløbsdato (MM/ÅÅ)',
                      s.payCVV.length < 3                             && 'CVV (3 cifre)',
                      s.payName.length <= 1                           && 'Navn på kort',
                    ].filter(Boolean) as string[]).map(item => (
                      <p key={item}>· {item}</p>
                    ))}
                  </div>
                )}

              </div>
            )}
          </div>
        )}
      </div>

      {/* ── HØJRE: pris-panel + action-boks ── */}
      <div className="flex flex-col gap-3 mt-8 lg:mt-0">
        <PricePanel s={s} />
        {panelAction?.label && !panelAction.disabled && !paying && (
          <button onClick={panelAction.onClick}
            className="w-full bg-rust hover:bg-rust-dark text-white font-black uppercase tracking-widest text-xs py-3 px-6 rounded-lg transition-colors">
            {panelAction.label} →
          </button>
        )}
      </div>

    </div>
  )
}
