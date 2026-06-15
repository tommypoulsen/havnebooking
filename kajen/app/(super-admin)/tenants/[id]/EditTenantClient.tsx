'use client'

import { TenantForm } from '../TenantForm'
import type { Tenant } from '@/lib/types/domain'

type Action = (prev: string | null | undefined, formData: FormData) => Promise<string | null>

export function EditTenantClient({ tenant, updateTenant }: { tenant: Tenant; updateTenant: Action }) {
  return <TenantForm action={updateTenant} tenant={tenant} />
}
