'use client'

import { useState } from 'react'
import { mockBookings, inventoryStatus, timeSlots } from '@/lib/mock-data'
import type { Booking, TimeSlot, InventoryItem } from '@/lib/types'

type Tab = 'bookinger' | 'lager' | 'tidsvinduer'

// ── BOOKINGER ──────────────────────────────────────────────────────────────

function BookingerTab() {
  const [bookings, setBookings] = useState<Booking[]>(mockBookings)
  const [filter, setFilter] = useState('alle')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const filtered = filter === 'alle'
    ? bookings
    : bookings.filter(b => b.service.toLowerCase().includes(filter))

  const updateStatus = (id: string, status: Booking['status']) =>
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b))

  const deleteBooking = (id: string) => {
    setBookings(prev => prev.filter(b => b.id !== id))
    setConfirmDelete(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{filtered.length} bookinger</p>
        <div className="flex gap-2">
          {['alle', 'stativleje', 'kranløft', 'stormstøtter'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors capitalize
                ${filter === f ? 'bg-charcoal text-white border-charcoal' : 'border-warm-gray text-gray-500 hover:border-charcoal'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-warm-gray">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-warm-gray text-charcoal text-left">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Båd</th>
              <th className="px-4 py-3 font-medium">Ejer</th>
              <th className="px-4 py-3 font-medium">Ydelse</th>
              <th className="px-4 py-3 font-medium">Dato</th>
              <th className="px-4 py-3 font-medium">Pris</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b, i) => (
              <tr key={b.id} className={`border-b border-warm-gray ${i % 2 === 0 ? 'bg-white' : 'bg-offwhite'}`}>
                <td className="px-4 py-3 font-mono text-xs text-gray-400">{b.id}</td>
                <td className="px-4 py-3 font-medium text-charcoal">{b.boatName}</td>
                <td className="px-4 py-3 text-gray-600">{b.ownerName}</td>
                <td className="px-4 py-3 text-gray-600">{b.service}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{b.date}{b.time ? ` kl. ${b.time}` : ''}</td>
                <td className="px-4 py-3 font-medium text-rust whitespace-nowrap">{b.price.toLocaleString('da-DK')} kr.</td>
                <td className="px-4 py-3">
                  <select value={b.status}
                    onChange={e => updateStatus(b.id, e.target.value as Booking['status'])}
                    className="text-xs border border-warm-gray rounded px-2 py-1 bg-white focus:outline-none focus:border-charcoal">
                    <option value="bekræftet">Bekræftet</option>
                    <option value="afventer">Afventer</option>
                    <option value="annulleret">Annulleret</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {confirmDelete === b.id ? (
                    <span className="flex items-center gap-2 justify-end">
                      <span className="text-xs text-gray-500">Slet?</span>
                      <button onClick={() => deleteBooking(b.id)} className="text-xs text-red-600 font-medium hover:text-red-800">Ja</button>
                      <button onClick={() => setConfirmDelete(null)} className="text-xs text-gray-400 hover:text-gray-600">Nej</button>
                    </span>
                  ) : (
                    <button onClick={() => setConfirmDelete(b.id)} className="text-xs text-gray-400 hover:text-red-600 transition-colors">Slet</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── LAGER ──────────────────────────────────────────────────────────────────

function LagerTab() {
  const [items, setItems] = useState<InventoryItem[]>(inventoryStatus)
  const [editingLabel, setEditingLabel] = useState<string | null>(null)
  const [editData, setEditData] = useState<InventoryItem>({ sizeLabel: '', total: 0, booked: 0 })
  const [adding, setAdding] = useState(false)
  const [newItem, setNewItem] = useState<InventoryItem>({ sizeLabel: '', total: 0, booked: 0 })
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const startEdit = (item: InventoryItem) => { setEditingLabel(item.sizeLabel); setEditData({ ...item }) }
  const saveEdit = () => { setItems(prev => prev.map(it => it.sizeLabel === editingLabel ? editData : it)); setEditingLabel(null) }
  const deleteItem = (label: string) => { setItems(prev => prev.filter(it => it.sizeLabel !== label)); setConfirmDelete(null) }
  const addItem = () => {
    if (!newItem.sizeLabel) return
    setItems(prev => [...prev, newItem])
    setNewItem({ sizeLabel: '', total: 0, booked: 0 })
    setAdding(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">Stativpladser · Sæson 2026/2027</p>
        <button onClick={() => setAdding(true)}
          className="text-xs bg-charcoal hover:bg-charcoal-mid text-white px-3 py-1.5 rounded transition-colors">
          + Nyt stativ
        </button>
      </div>

      <div className="space-y-3">
        {items.map(item => {
          const ledige = item.total - item.booked
          const pct = Math.round((item.booked / item.total) * 100)
          const barColor = pct > 80 ? 'bg-rust' : pct > 50 ? 'bg-rust-light' : 'bg-sand'
          const isEditing = editingLabel === item.sizeLabel

          return (
            <div key={item.sizeLabel} className="bg-white border border-warm-gray rounded-lg p-4">
              {isEditing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Betegnelse</label>
                      <input value={editData.sizeLabel}
                        onChange={e => setEditData(d => ({ ...d, sizeLabel: e.target.value }))}
                        className="w-full border border-warm-gray px-2 py-1.5 text-sm rounded focus:outline-none focus:border-charcoal" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Total pladser</label>
                      <input type="number" value={editData.total}
                        onChange={e => setEditData(d => ({ ...d, total: +e.target.value }))}
                        className="w-full border border-warm-gray px-2 py-1.5 text-sm rounded focus:outline-none focus:border-charcoal" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Booket</label>
                      <input type="number" value={editData.booked}
                        onChange={e => setEditData(d => ({ ...d, booked: +e.target.value }))}
                        className="w-full border border-warm-gray px-2 py-1.5 text-sm rounded focus:outline-none focus:border-charcoal" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="text-xs bg-rust hover:bg-rust-dark text-white px-3 py-1.5 rounded transition-colors">Gem</button>
                    <button onClick={() => setEditingLabel(null)} className="text-xs text-gray-400 hover:text-charcoal">Annuller</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-charcoal text-sm">{item.sizeLabel}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-2xl font-bold text-rust">{ledige}</span>
                        <span className="text-xs text-gray-400">/ {item.total} ledige</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="flex gap-3 shrink-0">
                    <button onClick={() => startEdit(item)} className="text-xs text-gray-400 hover:text-charcoal transition-colors">Rediger</button>
                    {confirmDelete === item.sizeLabel ? (
                      <span className="flex items-center gap-1.5">
                        <button onClick={() => deleteItem(item.sizeLabel)} className="text-xs text-red-600 font-medium">Ja, slet</button>
                        <button onClick={() => setConfirmDelete(null)} className="text-xs text-gray-400">Nej</button>
                      </span>
                    ) : (
                      <button onClick={() => setConfirmDelete(item.sizeLabel)} className="text-xs text-gray-400 hover:text-red-600 transition-colors">Slet</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {adding && (
          <div className="bg-offwhite border-2 border-dashed border-warm-gray rounded-lg p-4">
            <p className="text-xs font-black uppercase tracking-widest text-charcoal mb-3">Nyt stativ</p>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Betegnelse</label>
                <input placeholder="fx Sejlbåde · 6–12 t" value={newItem.sizeLabel}
                  onChange={e => setNewItem(d => ({ ...d, sizeLabel: e.target.value }))}
                  className="w-full border border-warm-gray px-2 py-1.5 text-sm rounded focus:outline-none focus:border-charcoal" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Total pladser</label>
                <input type="number" value={newItem.total || ''}
                  onChange={e => setNewItem(d => ({ ...d, total: +e.target.value }))}
                  className="w-full border border-warm-gray px-2 py-1.5 text-sm rounded focus:outline-none focus:border-charcoal" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Booket</label>
                <input type="number" value={newItem.booked || ''}
                  onChange={e => setNewItem(d => ({ ...d, booked: +e.target.value }))}
                  className="w-full border border-warm-gray px-2 py-1.5 text-sm rounded focus:outline-none focus:border-charcoal" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={addItem} disabled={!newItem.sizeLabel}
                className="text-xs bg-rust hover:bg-rust-dark text-white px-3 py-1.5 rounded transition-colors disabled:opacity-40">
                Opret
              </button>
              <button onClick={() => setAdding(false)} className="text-xs text-gray-400 hover:text-charcoal">Annuller</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── TIDSVINDUER ────────────────────────────────────────────────────────────

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
  const [fy, fm, fd] = from.split('-').map(Number)
  const [ty, tm, td] = to.split('-').map(Number)
  const end = new Date(ty, tm - 1, td)
  const cur = new Date(fy, fm - 1, fd)
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

const DAYS = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag']
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
function fmtDate(d: string) {
  const [y, mo, day] = d.split('-').map(Number)
  const dt = new Date(y, mo - 1, day)
  return `${DAYS[dt.getDay()]} ${dt.getDate()}. ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`
}

type SlotForm = { date: string; time: string; capacity: number }

function TidsvinduTab() {
  const [slots, setSlots] = useState<TimeSlot[]>(timeSlots)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<SlotForm>({ date: '', time: '', capacity: 3 })
  const [adding, setAdding] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // Batch/skabelon state
  const [batchDays, setBatchDays] = useState<Set<number>>(new Set())
  const [batchTimes, setBatchTimes] = useState<string[]>([''])
  const [batchFrom, setBatchFrom] = useState('')
  const [batchTo, setBatchTo] = useState('')
  const [batchCapacity, setBatchCapacity] = useState(3)
  const [batchMode, setBatchMode] = useState<'dag' | 'uge'>('dag')

  const validTimes = batchTimes.filter(t => t.trim())
  const batchDates = (batchFrom && batchTo && batchDays.size > 0) ? genDates(batchFrom, batchTo, batchDays) : []
  const potentialCount = batchDates.length * validTimes.length
  const skipCount = batchDates.flatMap(date =>
    validTimes.filter(time => slots.some(s => s.date === date && s.time === time))
  ).length
  const batchCount = potentialCount - skipCount
  const dagCount = batchFrom
    ? validTimes.filter(t => !slots.some(s => s.date === batchFrom && s.time === t)).length
    : 0

  const resetBatch = () => {
    setBatchDays(new Set()); setBatchTimes(['']); setBatchFrom(''); setBatchTo(''); setBatchCapacity(3); setAdding(false)
  }

  const addSingleDay = () => {
    if (dagCount === 0) return
    const newSlots = validTimes
      .filter(t => !slots.some(s => s.date === batchFrom && s.time === t))
      .map(time => ({ id: `ts${Date.now()}-${batchFrom}-${time}`, date: batchFrom, time, capacity: batchCapacity, booked: 0 }))
    setSlots(prev => [...prev, ...newSlots])
    resetBatch()
  }

  const addBatch = () => {
    if (batchCount === 0) return
    const newSlots: TimeSlot[] = []
    for (const date of batchDates)
      for (const time of validTimes)
        if (!slots.some(s => s.date === date && s.time === time))
          newSlots.push({ id: `ts${Date.now()}-${date}-${time}`, date, time, capacity: batchCapacity, booked: 0 })
    setSlots(prev => [...prev, ...newSlots])
    resetBatch()
  }

  const byDate: Record<string, TimeSlot[]> = {}
  for (const s of slots) {
    if (!byDate[s.date]) byDate[s.date] = []
    byDate[s.date].push(s)
  }

  const startEdit = (slot: TimeSlot) => { setEditingId(slot.id); setEditData({ date: slot.date, time: slot.time, capacity: slot.capacity }) }
  const saveEdit = () => { setSlots(prev => prev.map(s => s.id === editingId ? { ...s, ...editData } : s)); setEditingId(null) }
  const deleteSlot = (id: string) => { setSlots(prev => prev.filter(s => s.id !== id)); setConfirmDelete(null) }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">Kranløft · Tilgængelige tidsvinduer</p>
        <button onClick={() => setAdding(v => !v)}
          className="text-xs bg-charcoal hover:bg-charcoal-mid text-white px-3 py-1.5 rounded transition-colors">
          + Nyt tidsvindue
        </button>
      </div>

      {adding && (
        <div className="bg-offwhite border-2 border-dashed border-warm-gray rounded-lg p-5 mb-6">
          {/* Mode toggle */}
          <div className="flex gap-1 mb-5 bg-white border border-warm-gray rounded p-0.5 w-fit">
            {(['dag', 'uge'] as const).map(mode => (
              <button key={mode} onClick={() => setBatchMode(mode)}
                className={`text-xs px-4 py-1.5 rounded transition-colors font-medium
                  ${batchMode === mode ? 'bg-charcoal text-white' : 'text-gray-500 hover:text-charcoal'}`}>
                {mode === 'dag' ? 'Enkelt dag' : 'Uge-skabelon'}
              </button>
            ))}
          </div>

          {/* Ugedage — kun ved uge-mode */}
          {batchMode === 'uge' && (
            <div className="mb-4">
              <label className="text-xs text-gray-500 block mb-2">Ugedage</label>
              <div className="flex gap-2">
                {WEEKDAYS.map(d => (
                  <button key={d.idx}
                    onClick={() => setBatchDays(prev => {
                      const next = new Set(prev)
                      next.has(d.idx) ? next.delete(d.idx) : next.add(d.idx)
                      return next
                    })}
                    className={`text-xs px-3 py-1.5 rounded border transition-colors
                      ${batchDays.has(d.idx) ? 'bg-charcoal text-white border-charcoal' : 'bg-white border-warm-gray text-gray-600 hover:border-charcoal'}`}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tidspunkter — begge modes */}
          <div className="mb-4">
            <label className="text-xs text-gray-500 block mb-2">Tidspunkter</label>
            <div className="flex flex-wrap gap-2 items-center">
              {batchTimes.map((t, i) => (
                <div key={i} className="flex items-center gap-1">
                  <input type="time" value={t}
                    onChange={e => setBatchTimes(prev => prev.map((v, j) => j === i ? e.target.value : v))}
                    className="border border-warm-gray px-2 py-1.5 text-sm rounded focus:outline-none focus:border-charcoal" />
                  {batchTimes.length > 1 && (
                    <button onClick={() => setBatchTimes(prev => prev.filter((_, j) => j !== i))}
                      className="text-gray-300 hover:text-red-500 text-lg leading-none px-1">×</button>
                  )}
                </div>
              ))}
              <button onClick={() => setBatchTimes(prev => [...prev, ''])}
                className="text-xs border border-dashed border-warm-gray px-3 py-1.5 rounded text-gray-400 hover:border-charcoal hover:text-charcoal transition-colors">
                + Tilføj tidspunkt
              </button>
            </div>
          </div>

          {/* Dato-felter */}
          <div className={`grid gap-3 mb-4 ${batchMode === 'dag' ? 'grid-cols-2' : 'grid-cols-3'}`}>
            <div>
              <label className="text-xs text-gray-500 block mb-1">{batchMode === 'dag' ? 'Dato' : 'Fra dato'}</label>
              <input type="date" value={batchFrom} onChange={e => setBatchFrom(e.target.value)}
                className="w-full border border-warm-gray px-2 py-1.5 text-sm rounded focus:outline-none focus:border-charcoal" />
            </div>
            {batchMode === 'uge' && (
              <div>
                <label className="text-xs text-gray-500 block mb-1">Til dato</label>
                <input type="date" value={batchTo} onChange={e => setBatchTo(e.target.value)}
                  className="w-full border border-warm-gray px-2 py-1.5 text-sm rounded focus:outline-none focus:border-charcoal" />
              </div>
            )}
            <div>
              <label className="text-xs text-gray-500 block mb-1">Kapacitet pr. tidspunkt</label>
              <input type="number" min={1} value={batchCapacity} onChange={e => setBatchCapacity(+e.target.value)}
                className="w-full border border-warm-gray px-2 py-1.5 text-sm rounded focus:outline-none focus:border-charcoal" />
            </div>
          </div>

          {/* Preview */}
          {batchMode === 'dag' && dagCount > 0 && (
            <p className="text-xs text-gray-500 mb-3">→ Opretter <strong className="text-charcoal">{dagCount}</strong> tidsvinduer</p>
          )}
          {batchMode === 'uge' && potentialCount > 0 && (
            <p className="text-xs text-gray-500 mb-3">
              → Opretter <strong className="text-charcoal">{batchCount}</strong> tidsvinduer
              {skipCount > 0 && <span className="text-gray-400"> ({skipCount} springer over — allerede oprettet)</span>}
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={batchMode === 'dag' ? addSingleDay : addBatch}
              disabled={batchMode === 'dag' ? dagCount === 0 : batchCount === 0}
              className="text-xs bg-rust hover:bg-rust-dark text-white px-4 py-1.5 rounded transition-colors disabled:opacity-40">
              Opret {batchMode === 'dag' ? (dagCount > 0 ? dagCount : '') : (batchCount > 0 ? batchCount : '')} tidsvinduer
            </button>
            <button onClick={resetBatch} className="text-xs text-gray-400 hover:text-charcoal">Annuller</button>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, dateSlots]) => {
          const totalCapacity = dateSlots.reduce((s, sl) => s + sl.capacity, 0)
          const totalBooked = dateSlots.reduce((s, sl) => s + sl.booked, 0)
          return (
            <div key={date} className="bg-white border border-warm-gray rounded-lg overflow-hidden">
              <div className="bg-warm-gray text-charcoal px-4 py-2.5 flex items-center justify-between">
                <span className="font-medium text-sm">{fmtDate(date)}</span>
                <span className="text-xs opacity-60">{totalBooked}/{totalCapacity} booket</span>
              </div>
              <div className="divide-y divide-warm-gray">
                {dateSlots.map(slot => {
                  const full = slot.booked >= slot.capacity
                  const isEditing = editingId === slot.id
                  return (
                    <div key={slot.id} className={`px-4 py-3 ${full ? 'bg-red-50' : ''}`}>
                      {isEditing ? (
                        <div className="flex flex-wrap items-end gap-3">
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Dato</label>
                            <input type="date" value={editData.date}
                              onChange={e => setEditData(d => ({ ...d, date: e.target.value }))}
                              className="border border-warm-gray px-2 py-1 text-sm rounded focus:outline-none focus:border-charcoal" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Klokkeslæt</label>
                            <input type="time" value={editData.time}
                              onChange={e => setEditData(d => ({ ...d, time: e.target.value }))}
                              className="border border-warm-gray px-2 py-1 text-sm rounded focus:outline-none focus:border-charcoal" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Kapacitet</label>
                            <input type="number" min={1} value={editData.capacity}
                              onChange={e => setEditData(d => ({ ...d, capacity: +e.target.value }))}
                              className="w-20 border border-warm-gray px-2 py-1 text-sm rounded focus:outline-none focus:border-charcoal" />
                          </div>
                          <button onClick={saveEdit} className="text-xs bg-rust hover:bg-rust-dark text-white px-3 py-1.5 rounded transition-colors">Gem</button>
                          <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 hover:text-charcoal">Annuller</button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-charcoal text-base w-14">{slot.time}</span>
                            <div className="flex items-center gap-1.5">
                              <div className={`w-2 h-2 rounded-full ${full ? 'bg-rust' : 'bg-warm-gray border border-gray-300'}`} />
                              <span className="text-xs text-gray-500">
                                {full ? 'Fuldt booket' : `${slot.capacity - slot.booked} ledig`}
                              </span>
                              <span className="text-xs text-gray-400">({slot.booked}/{slot.capacity})</span>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <button onClick={() => startEdit(slot)} className="text-xs text-gray-400 hover:text-charcoal transition-colors">Rediger</button>
                            {confirmDelete === slot.id ? (
                              <span className="flex items-center gap-1.5">
                                <button onClick={() => deleteSlot(slot.id)} className="text-xs text-red-600 font-medium">Ja, slet</button>
                                <button onClick={() => setConfirmDelete(null)} className="text-xs text-gray-400">Nej</button>
                              </span>
                            ) : (
                              <button onClick={() => setConfirmDelete(slot.id)} className="text-xs text-gray-400 hover:text-red-600 transition-colors">Slet</button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── HOVED-KOMPONENT ────────────────────────────────────────────────────────

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('bookinger')

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'bookinger', label: 'Bookinger', count: mockBookings.length },
    { id: 'lager', label: 'Lager' },
    { id: 'tidsvinduer', label: 'Kranløft-tidsvinduer' },
  ]

  return (
    <div>
      <div className="border-b border-warm-gray mb-6">
        <div className="flex">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === tab.id ? 'border-charcoal text-charcoal' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 bg-warm-gray text-charcoal text-xs px-1.5 py-0.5 rounded-full">{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'bookinger'   && <BookingerTab />}
      {activeTab === 'lager'       && <LagerTab />}
      {activeTab === 'tidsvinduer' && <TidsvinduTab />}
    </div>
  )
}
