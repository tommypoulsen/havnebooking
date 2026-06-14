'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const TenantSchema = z.object({
  name:           z.string().min(2).max(100),
  subdomain:      z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Kun små bogstaver, tal og bindestreg'),
  displayName:    z.string().min(2).max(100),
  contactEmail:   z.string().email('Ugyldig e-mail'),
  contactPhone:   z.string().optional(),
  contactAddress: z.string().optional(),
  contactHours:   z.string().optional(),
})

function buildConfig(data: z.infer<typeof TenantSchema>) {
  return {
    displayName:  data.displayName,
    contactEmail: data.contactEmail,
    theme:        'default',
    cancellationPolicy: 'standard',
    ...(data.contactPhone   ? { contactPhone:   data.contactPhone }   : {}),
    ...(data.contactAddress ? {
      contactAddress: data.contactAddress.split('\n').map(s => s.trim()).filter(Boolean),
    } : {}),
    ...(data.contactHours   ? { contactHours:   data.contactHours }   : {}),
  }
}

export async function createTenant(
  _prev: string | null | undefined,
  formData: FormData
): Promise<string | null> {
  const parsed = TenantSchema.safeParse({
    name:           formData.get('name'),
    subdomain:      formData.get('subdomain'),
    displayName:    formData.get('displayName'),
    contactEmail:   formData.get('contactEmail'),
    contactPhone:   formData.get('contactPhone') || undefined,
    contactAddress: formData.get('contactAddress') || undefined,
    contactHours:   formData.get('contactHours')  || undefined,
  })
  if (!parsed.success) return parsed.error.issues[0].message

  const supabase = await createClient()

  const { error } = await supabase
    .from('tenants')
    .insert({ name: parsed.data.name, subdomain: parsed.data.subdomain, config: buildConfig(parsed.data) })

  if (error) {
    if (error.code === '23505') return 'Subdomænet er allerede i brug'
    return 'Kunne ikke oprette tenant'
  }

  revalidatePath('/tenants')
  return null
}

export async function updateTenant(
  _prev: string | null | undefined,
  formData: FormData
): Promise<string | null> {
  const id = formData.get('id') as string

  const parsed = TenantSchema.safeParse({
    name:           formData.get('name'),
    subdomain:      formData.get('subdomain'),
    displayName:    formData.get('displayName'),
    contactEmail:   formData.get('contactEmail'),
    contactPhone:   formData.get('contactPhone') || undefined,
    contactAddress: formData.get('contactAddress') || undefined,
    contactHours:   formData.get('contactHours')  || undefined,
  })
  if (!parsed.success) return parsed.error.issues[0].message

  const supabase = await createClient()

  const { error } = await supabase
    .from('tenants')
    .update({ name: parsed.data.name, subdomain: parsed.data.subdomain, config: buildConfig(parsed.data) })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') return 'Subdomænet er allerede i brug'
    return 'Kunne ikke gemme'
  }

  revalidatePath('/tenants')
  return null
}

export async function toggleTenantActive(formData: FormData): Promise<void> {
  const id     = formData.get('id') as string
  const active = formData.get('active') === 'true'

  const supabase = await createClient()
  await supabase.from('tenants').update({ active: !active }).eq('id', id)

  revalidatePath('/tenants')
}
