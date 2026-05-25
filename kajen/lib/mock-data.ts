import type { Service, SizeCategory, TimeSlot, Booking, InventoryItem } from './types'

export const services: Service[] = [
  {
    id: 'stativleje',
    name: 'Stativleje',
    type: 'stativleje',
    description: 'Vi tager din båd på land. Sætter den i vandet igen. Og kan lave alt derimellem.',
    icon: '⚓',
    priceFrom: 1575,
  },
  {
    id: 'kranløft',
    name: 'Kranløft',
    type: 'kranløft',
    description: 'Professionelt kranløft til isætning og optagning. Vores kran løfter op til 20 tons.',
    icon: '🏗',
    priceFrom: 893,
  },
  {
    id: 'stormstøtter',
    name: 'Stormstøtter',
    type: 'stormstøtter',
    description: 'Stormstøtter til sikring af din båd på stativen hele vinterperioden.',
    icon: '🔩',
    priceFrom: 263,
  },
]

export const sizeCategories: Record<string, SizeCategory[]> = {
  stativleje: [
    { id: 'sejl-let',   label: 'Sejlbåd · op til 3 t',   description: 'Sejlbåd, let',        price: 1575,  priceUnit: '/sæson' },
    { id: 'sejl-mid',   label: 'Sejlbåd · 3–6 t',        description: 'Sejlbåd, mellem',     price: 2100,  priceUnit: '/sæson' },
    { id: 'sejl-tung',  label: 'Sejlbåd · 6–12 t',       description: 'Sejlbåd, tung',       price: 2625,  priceUnit: '/sæson' },
    { id: 'motor-let',  label: 'Motorbåd · op til 3 t',  description: 'Motorbåd, let',       price: 1838,  priceUnit: '/sæson' },
    { id: 'motor-mid',  label: 'Motorbåd · 3–6 t',       description: 'Motorbåd, mellem',    price: 2625,  priceUnit: '/sæson' },
    { id: 'motor-tung', label: 'Motorbåd · 6–12 t',      description: 'Motorbåd, tung',      price: 3150,  priceUnit: '/sæson' },
  ],
  kranløft: [
    { id: '0-3t',   label: '0 – 3 ton',   description: 'Op til 3 tons',   price: 893,  priceUnit: '/løft' },
    { id: '3-6t',   label: '3 – 6 ton',   description: 'Op til 6 tons',   price: 1260, priceUnit: '/løft' },
    { id: '6-12t',  label: '6 – 12 ton',  description: 'Op til 12 tons',  price: 1890, priceUnit: '/løft' },
    { id: '12-20t', label: '12 – 20 ton', description: 'Op til 20 tons',  price: 2520, priceUnit: '/løft' },
  ],
  stormstøtter: [
    { id: 'let',  label: 'Op til 3 ton',  description: 'Standard sæt (4 stk)', price: 263, priceUnit: '/sæson' },
    { id: 'tung', label: '3 ton og over', description: 'Forstærket sæt (4 stk)', price: 525, priceUnit: '/sæson' },
  ],
}

export const timeSlots: TimeSlot[] = [
  { id: 'ts1',  date: '2026-05-20', time: '08:00', capacity: 3, booked: 1 },
  { id: 'ts2',  date: '2026-05-20', time: '10:00', capacity: 3, booked: 3 },
  { id: 'ts3',  date: '2026-05-20', time: '12:00', capacity: 3, booked: 0 },
  { id: 'ts4',  date: '2026-05-20', time: '14:00', capacity: 3, booked: 2 },
  { id: 'ts5',  date: '2026-05-21', time: '08:00', capacity: 3, booked: 0 },
  { id: 'ts6',  date: '2026-05-21', time: '10:00', capacity: 3, booked: 1 },
  { id: 'ts7',  date: '2026-05-21', time: '12:00', capacity: 3, booked: 0 },
  { id: 'ts8',  date: '2026-05-21', time: '14:00', capacity: 3, booked: 3 },
  { id: 'ts9',  date: '2026-05-22', time: '08:00', capacity: 3, booked: 0 },
  { id: 'ts10', date: '2026-05-22', time: '10:00', capacity: 3, booked: 2 },
  { id: 'ts11', date: '2026-05-22', time: '12:00', capacity: 3, booked: 1 },
  { id: 'ts12', date: '2026-05-22', time: '14:00', capacity: 3, booked: 0 },
]

export const mockBookings: Booking[] = [
  { id: 'HB-2026-00142', service: 'Stativleje',   boatName: 'Solveig',            boatLength: 9.5,  ownerName: 'Lars Petersen',     ownerEmail: 'lars@example.dk',     ownerPhone: '22 33 44 55', date: '2026-10-15',             sizeCategory: 'Sejlbåd · 3–6 t',       price: 2100, status: 'bekræftet', createdAt: '2026-05-10' },
  { id: 'HB-2026-00143', service: 'Kranløft',      boatName: 'Maren af Hundested', boatLength: 11.2, ownerName: 'Hanne Christensen', ownerEmail: 'hanne@example.dk',    ownerPhone: '40 50 60 70', date: '2026-05-20', time: '08:00', sizeCategory: '6–12 ton',              price: 1890, status: 'bekræftet', createdAt: '2026-05-08' },
  { id: 'HB-2026-00144', service: 'Stativleje',   boatName: 'Nordvind',           boatLength: 6.8,  ownerName: 'Jens Møller',       ownerEmail: 'jens@example.dk',     ownerPhone: '51 62 73 84', date: '2026-10-20',             sizeCategory: 'Sejlbåd · op til 3 t',  price: 1575, status: 'afventer',  createdAt: '2026-05-12' },
  { id: 'HB-2026-00145', service: 'Kranløft',      boatName: 'Albatros',          boatLength: 7.5,  ownerName: 'Søren Andersen',    ownerEmail: 'soeren@example.dk',   ownerPhone: '28 39 40 51', date: '2026-05-21', time: '10:00', sizeCategory: '0–3 ton',               price: 893,  status: 'bekræftet', createdAt: '2026-05-11' },
  { id: 'HB-2026-00146', service: 'Stormstøtter', boatName: 'Fri Fugl',           boatLength: 8.2,  ownerName: 'Marianne Koch',     ownerEmail: 'marianne@example.dk', ownerPhone: '61 72 83 94', date: '2026-10-15',             sizeCategory: 'Op til 3 ton',           price: 263,  status: 'bekræftet', createdAt: '2026-05-09' },
  { id: 'HB-2026-00147', service: 'Stativleje',   boatName: 'Brise',             boatLength: 12.1, ownerName: 'Torben Nielsen',    ownerEmail: 'torben@example.dk',   ownerPhone: '33 44 55 66', date: '2026-10-18',             sizeCategory: 'Motorbåd · 3–6 t',      price: 2625, status: 'bekræftet', createdAt: '2026-05-13' },
  { id: 'HB-2026-00148', service: 'Kranløft',      boatName: 'Havørnen',          boatLength: 9.8,  ownerName: 'Anne Larsen',       ownerEmail: 'anne@example.dk',     ownerPhone: '44 55 66 77', date: '2026-05-22', time: '10:00', sizeCategory: '6–12 ton',              price: 1890, status: 'afventer',  createdAt: '2026-05-14' },
]

export const inventoryStatus: InventoryItem[] = [
  { sizeLabel: 'Sejlbåde · op til 3 t', total: 20, booked: 7  },
  { sizeLabel: 'Sejlbåde · 3–6 t',      total: 25, booked: 11 },
  { sizeLabel: 'Motorbåde · op til 3 t',total: 20, booked: 8  },
  { sizeLabel: 'Motorbåde · 3–6 t',     total: 15, booked: 6  },
]
