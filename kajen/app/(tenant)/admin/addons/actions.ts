'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getTenant } from '@/lib/utils/tenant'
import type { ServiceConfig } from '@/lib/types/domain'

const ConditionSchema = z.object({
  field: z.string().min(1),
  value: z.string().min(1),
})

const AddOnRuleSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(200),
  conditions: z.array(ConditionSchema),
  serviceId: z.string().uuid().optional(),
  durationType: z.enum(['per_lift', 'per_season', 'per_day']).optional(),
  sizeTableOere: z.record(z.string().uuid(), z.number().int().nonnegative()).optional(),
  fixedPriceOere: z.number().int().nonnegative().optional(),
  quantity: z.number().int().positive().optional(),
})

export async function saveAddOnRules(serviceId: string, rules: unknown): Promise<string | null> {
  const supabase = await createClient()
  const tenant = await getTenant()
  if (!tenant) return 'Tenant ikke fundet'

  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.app_metadata?.role as string | undefined
  if (role !== 'admin' && role !== 'super_admin') return 'Ikke autoriseret'

  const idParsed = z.string().uuid().safeParse(serviceId)
  if (!idParsed.success) return 'Ugyldig ydelse'

  const rulesParsed = z.array(AddOnRuleSchema).safeParse(rules)
  if (!rulesParsed.success) return 'Ugyldige regler — tjek alle felter'

  const { data: service } = await supabase
    .from('services')
    .select('config')
    .eq('id', idParsed.data)
    .eq('tenant_id', tenant.id)
    .single()

  if (!service) return 'Ydelse ikke fundet'

  const updatedConfig: ServiceConfig = {
    ...(service.config as unknown as ServiceConfig),
    addOnRules: rulesParsed.data,
  }

  const { error } = await supabase
    .from('services')
    .update({ config: updatedConfig })
    .eq('id', idParsed.data)
    .eq('tenant_id', tenant.id)

  if (error) return 'Kunne ikke gemme — prøv igen'

  revalidatePath('/admin/addons')
  return null
}
