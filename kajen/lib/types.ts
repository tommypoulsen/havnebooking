export type ServiceType = 'stativleje' | 'kranløft' | 'stormstøtter'

export interface Service {
  id: string
  name: string
  type: ServiceType
  description: string
  icon: string
  priceFrom: number
}

export interface SizeCategory {
  id: string
  label: string
  description: string
  price: number
  priceUnit: string
}

export interface TimeSlot {
  id: string
  date: string
  time: string
  capacity: number
  booked: number
}

export interface Booking {
  id: string
  service: string
  boatName: string
  boatLength: number
  ownerName: string
  ownerEmail: string
  ownerPhone: string
  date: string
  time?: string
  sizeCategory: string
  price: number
  status: 'bekræftet' | 'afventer' | 'annulleret'
  createdAt: string
}

export interface InventoryItem {
  sizeLabel: string
  total: number
  booked: number
}
