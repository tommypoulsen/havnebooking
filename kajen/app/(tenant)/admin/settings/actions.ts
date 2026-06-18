'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getTenant } from '@/lib/utils/tenant'
import { PALETTES } from '@/lib/utils/palettes'

export async function updateTheme(
  _prev: string | null | undefined,
  formData: FormData
): Promise<string | null> {
  const theme = formData.get('theme') as string
  if (!PALETTES[theme]) return 'Ugyldigt farveskema'

  const supabase = await createClient()
  const tenant = await getTenant()
  if (!tenant) return 'Tenant ikke fundet'

  const { error } = await supabase.rpc('merge_tenant_config', {
    p_tenant_id: tenant.id,
    patch: { theme },
  })

  if (error) return 'Kunne ikke gemme'

  revalidatePath('/', 'layout')
  return null
}

export async function updateLogoUrl(logoUrl: string): Promise<string | null> {
  const parsed = z.string().url().safeParse(logoUrl)
  if (!parsed.success) return 'Ugyldig URL'

  const supabase = await createClient()
  const tenant = await getTenant()
  if (!tenant) return 'Tenant ikke fundet'

  const { error } = await supabase.rpc('merge_tenant_config', {
    p_tenant_id: tenant.id,
    patch: { logoUrl: parsed.data },
  })

  if (error) return 'Kunne ikke gemme logo-URL'

  revalidatePath('/', 'layout')
  return null
}

export async function removeLogo(): Promise<string | null> {
  const supabase = await createClient()
  const tenant = await getTenant()
  if (!tenant) return 'Tenant ikke fundet'

  const { error } = await supabase.rpc('remove_tenant_config_key', {
    p_tenant_id: tenant.id,
    key: 'logoUrl',
  })

  if (error) return 'Kunne ikke fjerne logo'

  revalidatePath('/', 'layout')
  return null
}
