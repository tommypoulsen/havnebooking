'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { zUuid } from '@/lib/utils/zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'super_admin') return 'Ikke autoriseret'

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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'super_admin') return 'Ikke autoriseret'

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

const CreateUserSchema = z.object({
  tenant_id: zUuid,
  full_name: z.string().min(2).max(200).trim(),
  email:     z.string().email('Ugyldig e-mail').trim().toLowerCase(),
  password:  z.string().min(8, 'Adgangskode skal være mindst 8 tegn'),
  role:      z.enum(['admin', 'staff']),
})

export async function createTenantUser(
  _prev: string | null | undefined,
  formData: FormData
): Promise<string | null> {
  const parsed = CreateUserSchema.safeParse({
    tenant_id: formData.get('tenant_id'),
    full_name: formData.get('full_name'),
    email:     formData.get('email'),
    password:  formData.get('password'),
    role:      formData.get('role'),
  })
  if (!parsed.success) return parsed.error.issues[0].message

  const supabase = createServiceClient()

  // Create auth user with role in app_metadata so JWT claims are set on first login
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email:         parsed.data.email,
    password:      parsed.data.password,
    email_confirm: true,
    app_metadata:  { role: parsed.data.role, tenant_id: parsed.data.tenant_id },
  })

  if (authError || !authData.user) {
    if (authError?.message?.includes('already been registered'))
      return 'E-mailadressen er allerede registreret'
    return 'Kunne ikke oprette auth-bruger'
  }

  const { error: userError } = await supabase.from('users').insert({
    tenant_id: parsed.data.tenant_id,
    auth_id:   authData.user.id,
    email:     parsed.data.email,
    role:      parsed.data.role,
    full_name: parsed.data.full_name,
  })

  if (userError) {
    await supabase.auth.admin.deleteUser(authData.user.id)
    return 'Kunne ikke gemme bruger — auth-bruger slettet igen'
  }

  revalidatePath(`/tenants/${parsed.data.tenant_id}`)
  return null
}

const UpdateUserSchema = z.object({
  user_id:   zUuid,
  tenant_id: zUuid,
  full_name: z.string().min(2).max(200).trim(),
  email:     z.string().email('Ugyldig e-mail').trim().toLowerCase(),
  role:      z.enum(['admin', 'staff']),
})

export async function updateTenantUser(
  _prev: string | null | undefined,
  formData: FormData,
): Promise<string | null> {
  const parsed = UpdateUserSchema.safeParse({
    user_id:   formData.get('user_id'),
    tenant_id: formData.get('tenant_id'),
    full_name: formData.get('full_name'),
    email:     formData.get('email'),
    role:      formData.get('role'),
  })
  if (!parsed.success) return parsed.error.issues[0].message

  const supabase = createServiceClient()

  const { data: existing } = await supabase
    .from('users')
    .select('auth_id')
    .eq('id', parsed.data.user_id)
    .eq('tenant_id', parsed.data.tenant_id)
    .single()

  if (!existing) return 'Bruger ikke fundet'

  const { error: dbError } = await supabase
    .from('users')
    .update({ full_name: parsed.data.full_name, email: parsed.data.email, role: parsed.data.role })
    .eq('id', parsed.data.user_id)
    .eq('tenant_id', parsed.data.tenant_id)

  if (dbError) return 'Kunne ikke opdatere bruger'

  if (existing.auth_id) {
    await supabase.auth.admin.updateUserById(existing.auth_id, {
      email:        parsed.data.email,
      app_metadata: { role: parsed.data.role, tenant_id: parsed.data.tenant_id },
    })
  }

  revalidatePath(`/tenants/${parsed.data.tenant_id}`)
  return null
}

export async function deleteTenantUser(formData: FormData): Promise<void> {
  const userId   = zUuid.safeParse(formData.get('user_id'))
  const tenantId = zUuid.safeParse(formData.get('tenant_id'))
  if (!userId.success || !tenantId.success) return

  const supabase = createServiceClient()

  const { data: user } = await supabase
    .from('users')
    .select('auth_id')
    .eq('id', userId.data)
    .eq('tenant_id', tenantId.data)
    .single()

  if (!user) return

  await supabase.from('users').delete()
    .eq('id', userId.data)
    .eq('tenant_id', tenantId.data)

  if (user.auth_id) await supabase.auth.admin.deleteUser(user.auth_id)

  revalidatePath(`/tenants/${tenantId.data}`)
}

const ResetPasswordSchema = z.object({
  user_id:      zUuid,
  tenant_id:    zUuid,
  new_password: z.string().min(8, 'Adgangskode skal være mindst 8 tegn'),
})

export async function resetTenantUserPassword(
  _prev: string | null | undefined,
  formData: FormData,
): Promise<string | null> {
  const parsed = ResetPasswordSchema.safeParse({
    user_id:      formData.get('user_id'),
    tenant_id:    formData.get('tenant_id'),
    new_password: formData.get('new_password'),
  })
  if (!parsed.success) return parsed.error.issues[0].message

  const supabase = createServiceClient()

  const { data: user } = await supabase
    .from('users')
    .select('auth_id')
    .eq('id', parsed.data.user_id)
    .eq('tenant_id', parsed.data.tenant_id)
    .single()

  if (!user?.auth_id) return 'Bruger ikke fundet'

  const { error } = await supabase.auth.admin.updateUserById(user.auth_id, {
    password: parsed.data.new_password,
  })

  if (error) return 'Kunne ikke nulstille adgangskode'
  return null
}

export async function toggleTenantActive(formData: FormData): Promise<void> {
  const id     = formData.get('id') as string
  const active = formData.get('active') === 'true'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.role !== 'super_admin') return

  await supabase.from('tenants').update({ active: !active }).eq('id', id)

  revalidatePath('/tenants')
}
