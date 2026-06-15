'use client'

import { useState, useTransition } from 'react'
import { createTimeSlotsFromSchedule } from './actions'
import type { Service } from '@/lib/types/domain'

const WEEKDAYS = [
  { label: 'Man', idx: 1 },
  { label: 'Tir', idx: 2 },
  { label: 'Ons', idx: 3 },
  { label: 'Tor', idx: 4 },
  { label: 'Fre', idx: 5 },
  { label: 'Lør', idx: 6 },
  { label: 'Søn', idx: 0 },
]

function genDates(from: string, to: string, days: Set<number>): string[] {
  const result: string[] = []
  const end = new Date(to)
  const cur = new Date(from)
  while (cur <= end) {
    if (days.has(cur.getDay())) {
      const y = cur.getFullYear()
      const m = String(cur.getMonth() + 1).padStart(2, '0')
      const d = String(cur.getDate()).padStart(2, '0')
      result.push(`${y}-${m}-${d}`)
    }
    cur.setDate(cur.getDate() + 1)
  }
  return result
}

type Mode = 'dag' | 'uge'

export function CreateTimeSlotForm({ services }: { services: Pick<Service, 'id' | 'name'>[] }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('dag')
  const [serviceId, setServiceId] = useState(services[0]?.id ?? '')
  const [times, setTimes] = useState(['08:00'])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [capacity, setCapacity] = useState(3)
  const [weekdays, setWeekdays] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const validTimes = times.filter(t => t.trim())
  const dates = mode === 'dag' && from
    ? [from]
    : (from && to && weekdays.size > 0 ? genDates(from, to, weekdays) : [])
  const count = dates.length * validTimes.length

  function toggleDay(idx: number) {
    setWeekdays(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  function reset() {
    setOpen(false)
    setMode('dag')
    setTimes(['08:00'])
    setFrom('')
    setTo('')
    setCapacity(3)
    setWeekdays(new Set())
    setError(null)
  }

  function submit() {
    if (count === 0 || validTimes.length === 0) return
    const slots = dates.flatMap(date =>
      validTimes.map(time => ({
        starts_at: new Date(`${date}T${time}:00`).toISOString(),
        capacity,
      }))
    )
    startTransition(async () => {
      const err = await createTimeSlotsFromSchedule(serviceId, slots)
      if (err) { setError(err); return }
      reset()
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs bg-charcoal hover:bg-charcoal-mid text-white px-4 py-2 rounded transition-colors"
      >
        + Nyt tidsvindue
      </button>
    )
  }

  return (
    <div className="bg-offwhite border-2 border-dashed border-warm-gray rounded-xl p-5 mb-6">
      {/* Service selector */}
      {services.length > 1 && (
        <div className="mb-4">
          <label className="text-xs text-charcoal/50 block mb-1">Service</label>
          <select
            value={serviceId}
            onChange={e => setServiceId(e.target.value)}
            className="border border-warm-gray rounded px-3 py-2 text-sm focus:outline-none focus:border-charcoal bg-white"
          >
            {services.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Mode toggle */}
      <div className="flex gap-1 mb-5 bg-white border border-warm-gray rounded p-0.5 w-fit">
        {(['dag', 'uge'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`text-xs px-4 py-1.5 rounded transition-colors font-medium
              ${mode === m ? 'bg-charcoal text-white' : 'text-charcoal/50 hover:text-charcoal'}`}
          >
            {m === 'dag' ? 'Enkelt dag' : 'Uge-skabelon'}
          </button>
        ))}
      </div>

      {/* Weekday selector — uge only */}
      {mode === 'uge' && (
        <div className="mb-4">
          <label className="text-xs text-charcoal/50 block mb-2">Ugedage</label>
          <div className="flex gap-2 flex-wrap">
            {WEEKDAYS.map(d => (
              <button
                key={d.idx}
                onClick={() => toggleDay(d.idx)}
                className={`text-xs px-3 py-1.5 rounded border transition-colors
                  ${weekdays.has(d.idx)
                    ? 'bg-charcoal text-white border-charcoal'
                    : 'bg-white border-warm-gray text-charcoal/60 hover:border-charcoal'}`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Time inputs */}
      <div className="mb-4">
        <label className="text-xs text-charcoal/50 block mb-2">Tidspunkter</label>
        <div className="flex flex-wrap gap-2 items-center">
          {times.map((t, i) => (
            <div key={i} className="flex items-center gap-1">
              <input
                type="time"
                value={t}
                onChange={e => setTimes(prev => prev.map((v, j) => j === i ? e.target.value : v))}
                className="border border-warm-gray px-2 py-1.5 text-sm rounded focus:outline-none focus:border-charcoal"
              />
              {times.length > 1 && (
                <button
                  onClick={() => setTimes(prev => prev.filter((_, j) => j !== i))}
                  className="text-charcoal/20 hover:text-rust text-lg leading-none px-1"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setTimes(prev => [...prev, ''])}
            className="text-xs border border-dashed border-warm-gray px-3 py-1.5 rounded text-charcoal/40 hover:border-charcoal hover:text-charcoal transition-colors"
          >
            + Tidspunkt
          </button>
        </div>
      </div>

      {/* Date fields */}
      <div className={`grid gap-3 mb-4 ${mode === 'dag' ? 'grid-cols-2' : 'grid-cols-3'}`}>
        <div>
          <label className="text-xs text-charcoal/50 block mb-1">
            {mode === 'dag' ? 'Dato' : 'Fra dato'}
          </label>
          <input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            className="w-full border border-warm-gray px-2 py-1.5 text-sm rounded focus:outline-none focus:border-charcoal"
          />
        </div>
        {mode === 'uge' && (
          <div>
            <label className="text-xs text-charcoal/50 block mb-1">Til dato</label>
            <input
              type="date"
              value={to}
              onChange={e => setTo(e.target.value)}
              className="w-full border border-warm-gray px-2 py-1.5 text-sm rounded focus:outline-none focus:border-charcoal"
            />
          </div>
        )}
        <div>
          <label className="text-xs text-charcoal/50 block mb-1">Kapacitet pr. tidspunkt</label>
          <input
            type="number"
            min={1}
            max={100}
            value={capacity}
            onChange={e => setCapacity(Number(e.target.value))}
            className="w-full border border-warm-gray px-2 py-1.5 text-sm rounded focus:outline-none focus:border-charcoal"
          />
        </div>
      </div>

      {count > 0 && (
        <p className="text-xs text-charcoal/50 mb-3">
          → Opretter <strong className="text-charcoal">{count}</strong> tidsvinduer
        </p>
      )}

      {error && <p className="text-xs text-rust mb-3">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={submit}
          disabled={count === 0 || isPending}
          className="text-xs bg-rust hover:bg-rust-dark text-white px-4 py-2 rounded transition-colors disabled:opacity-40"
        >
          {isPending ? 'Opretter…' : `Opret ${count > 0 ? count : ''} tidsvinduer`}
        </button>
        <button
          onClick={reset}
          className="text-xs text-charcoal/40 hover:text-charcoal transition-colors"
        >
          Annuller
        </button>
      </div>
    </div>
  )
}
