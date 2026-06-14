// Domain types — hand-maintained business layer on top of the generated DB types.
// Keep in sync with docs/database-schema.md.

export type UserRole = 'admin' | 'staff' | 'customer'
export type ServiceType = 'capacity' | 'timeslot' | 'stock'
export type OrderStatus = 'pending' | 'confirmed' | 'cancelled' | 'refunded'
export type PaymentStatus = 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded'
export type DurationType = 'per_lift' | 'per_season' | 'per_day'

// ---- Tenant ----

export type TenantConfig = {
  displayName: string
  contactEmail: string
  theme: string
  cancellationPolicy: string
}

export type Tenant = {
  id: string
  name: string
  subdomain: string
  config: TenantConfig
  active: boolean
  created_at: string
}

// ---- Service config (services.config JSONB) ----

export type FormFieldOption = {
  value: string
  label: string
}

export type FormField = {
  id: string
  label: string
  type: 'select' | 'text' | 'number' | 'date' | 'boolean'
  required: boolean
  options?: FormFieldOption[]
  dependsOn?: { field: string; value: string }
}

export type ServiceConfig = {
  requiresSizeCategory: boolean
  formFields: FormField[]
}

export type Service = {
  id: string
  tenant_id: string
  name: string
  type: ServiceType
  description: string | null
  config: ServiceConfig
  active: boolean
  sort_order: number
}

export type SizeCategory = {
  id: string
  service_id: string
  label: string
  description: string | null
  sort_order: number
}

export type PricingRule = {
  id: string
  service_id: string
  size_category_id: string | null
  duration_type: DurationType
  price_oere: number
  valid_from: string | null
  valid_to: string | null
}

// ---- Orders ----

export type OrderLineAttributes = Record<string, string | number | boolean>

export type OrderLine = {
  id: string
  order_id: string
  service_id: string
  size_category_id: string | null
  time_slot_id: string | null
  starts_at: string | null
  ends_at: string | null
  quantity: number
  unit_price_oere: number
  line_total_oere: number
  attributes: OrderLineAttributes
}

export type TimeSlot = {
  id: string
  service_id: string
  starts_at: string
  capacity: number
  booked_count: number
}

export type Order = {
  id: string
  tenant_id: string
  user_id: string
  status: OrderStatus
  total_oere: number
  created_at: string
  updated_at: string | null
}

// ---- Server Action result type ----

export type Result<T> =
  | { data: T; error?: never }
  | { data?: never; error: string }
