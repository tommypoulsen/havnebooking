'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getTenant } from '@/lib/utils/tenant'

const UpdateSchema = z.object({
  id:          z.string().uuid(),
  price_oere:  z.coerce.number().int().min(1),
})

export async function updatePricingRule(
  _prev: string | null,
  formData: FormData
): Promise<string | null> {
  const parsed = UpdateSchema.safeParse({
    id:         formData.get('id'),
    price_oere: formData.get('price_oere'),
  })
  if (!parsed.success) return 'Ugyldig pris'

  const supabase = await createClient()
  const tenant = await getTenant()
  if (!tenant) return 'Tenant ikke fundet'

  // Verify rule belongs to this tenant's service
  const { data: rule } = await supabase
    .from('pricing_rules')
    .select('id, services(tenant_id)')
    .eq('id', parsed.data.id)
    .single()

  if (!rule || (rule.services as any)?.tenant_id !== tenant.id)
    return 'Ikke autoriseret'

  const { error } = await supabase
    .from('pricing_rules')
    .update({ price_oere: parsed.data.price_oere })
    .eq('id', parsed.data.id)

  if (error) return 'Kunne ikke gemme'

  revalidatePath('/admin/pricing')
  return null
}
