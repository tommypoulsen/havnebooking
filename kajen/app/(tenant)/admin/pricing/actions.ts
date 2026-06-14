'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getTenant } from '@/lib/utils/tenant'

const UpdateSchema = z.object({
  id:       z.string().uuid(),
  price_kr: z.coerce.number().int().min(1),
})

export async function updatePricingRule(
  _prev: string | null,
  formData: FormData
): Promise<string | null> {
  const parsed = UpdateSchema.safeParse({
    id:       formData.get('id'),
    price_kr: formData.get('price_kr'),
  })
  if (!parsed.success) return 'Ugyldig pris'

  const supabase = await createClient()
  const tenant = await getTenant()
  if (!tenant) return 'Tenant ikke fundet'

  // Verify rule belongs to this tenant's service
  const { data: rule } = await supabase
    .from('pricing_rules')
    .select('id, service_id')
    .eq('id', parsed.data.id)
    .single()

  if (!rule) return 'Ikke autoriseret'

  const { data: service } = await supabase
    .from('services')
    .select('id')
    .eq('id', rule.service_id)
    .eq('tenant_id', tenant.id)
    .single()

  if (!service) return 'Ikke autoriseret'

  const { error } = await supabase
    .from('pricing_rules')
    .update({ price_oere: parsed.data.price_kr * 100 })
    .eq('id', parsed.data.id)

  if (error) return 'Kunne ikke gemme'

  revalidatePath('/admin/pricing')
  return null
}
