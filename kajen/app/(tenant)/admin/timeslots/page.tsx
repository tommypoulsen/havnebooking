import { notFound } from 'next/navigation'
import { getTenant } from '@/lib/utils/tenant'
import { createClient } from '@/lib/supabase/server'
import { CreateTimeSlotForm } from './CreateTimeSlotForm'
import { deleteTimeSlot } from './actions'
import type { Service, TimeSlot } from '@/lib/types/domain'

const DAYS = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag']
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

function formatDate(startsAt: string) {
  const d = new Date(startsAt)
  return `${DAYS[d.getDay()]} ${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function formatTime(startsAt: string) {
  const d = new Date(startsAt)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function dateKey(startsAt: string) {
  const d = new Date(startsAt)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type SlotWithService = TimeSlot & { services: { name: string } | null }

export default async function TimeSlotsPage() {
  const tenant = await getTenant()
  if (!tenant) notFound()

  const supabase = await createClient()

  const [{ data: timeslotServices }, { data: slots }] = await Promise.all([
    supabase
      .from('services')
      .select('id, name')
      .eq('tenant_id', tenant.id)
      .eq('type', 'timeslot')
      .eq('active', true)
      .order('sort_order'),
    supabase
      .from('time_slots')
      .select('id, service_id, starts_at, capacity, booked_count, services(name)')
      .in(
        'service_id',
        (
          await supabase
            .from('services')
            .select('id')
            .eq('tenant_id', tenant.id)
            .eq('type', 'timeslot')
        ).data?.map(s => s.id) ?? []
      )
      .gte('starts_at', new Date().toISOString())
      .order('starts_at')
      .limit(200),
  ])

  const services = (timeslotServices as Pick<Service, 'id' | 'name'>[]) ?? []
  const timeSlots = ((slots as unknown) as SlotWithService[]) ?? []

  // Group slots by date
  const byDate: Record<string, SlotWithService[]> = {}
  for (const slot of timeSlots) {
    const key = dateKey(slot.starts_at)
    if (!byDate[key]) byDate[key] = []
    byDate[key].push(slot)
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-charcoal">Tidspunkter</h1>
      </div>

      {services.length > 0 && <CreateTimeSlotForm services={services} />}

      <div className="mt-8 space-y-5">
        {Object.keys(byDate).length === 0 ? (
          <p className="text-charcoal/50 text-sm">Ingen kommende tidspunkter oprettet endnu.</p>
        ) : (
          Object.entries(byDate)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, dateSlots]) => {
              const totalCapacity = dateSlots.reduce((s, sl) => s + sl.capacity, 0)
              const totalBooked   = dateSlots.reduce((s, sl) => s + sl.booked_count, 0)
              return (
                <div key={date} className="bg-white border border-warm-gray rounded-xl overflow-hidden">
                  <div className="bg-warm-gray text-charcoal px-4 py-2.5 flex items-center justify-between">
                    <span className="font-medium text-sm">{formatDate(dateSlots[0].starts_at)}</span>
                    <span className="text-xs text-charcoal/50">{totalBooked}/{totalCapacity} booket</span>
                  </div>
                  <div className="divide-y divide-warm-gray">
                    {dateSlots.map(slot => {
                      const full = slot.booked_count >= slot.capacity
                      return (
                        <div key={slot.id} className={`px-4 py-3 flex items-center justify-between ${full ? 'bg-red-50' : ''}`}>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-charcoal text-base w-14">
                              {formatTime(slot.starts_at)}
                            </span>
                            {services.length > 1 && (
                              <span className="text-xs text-charcoal/50">{slot.services?.name}</span>
                            )}
                            <div className="flex items-center gap-1.5">
                              <div className={`w-2 h-2 rounded-full ${full ? 'bg-rust' : 'bg-warm-gray border border-charcoal/20'}`} />
                              <span className="text-xs text-charcoal/50">
                                {full ? 'Fuldt booket' : `${slot.capacity - slot.booked_count} ledig`}
                              </span>
                              <span className="text-xs text-charcoal/30">({slot.booked_count}/{slot.capacity})</span>
                            </div>
                          </div>
                          {slot.booked_count === 0 && (
                            <form action={deleteTimeSlot}>
                              <input type="hidden" name="id" value={slot.id} />
                              <button
                                type="submit"
                                className="text-xs text-charcoal/30 hover:text-rust transition-colors"
                              >
                                Slet
                              </button>
                            </form>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
        )}
      </div>
    </div>
  )
}
