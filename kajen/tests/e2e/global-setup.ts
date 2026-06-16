import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// .env.test.local (or .env.local fallback) is loaded by playwright.config.ts before this runs.
const TENANT_ID      = '00000000-0000-0000-0000-000000000001'
const ADMIN_EMAIL    = process.env.E2E_ADMIN_EMAIL    ?? 'e2e-admin@hundested-test.dk'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'e2e-testpass-123'
const SUPER_EMAIL    = process.env.E2E_SUPER_EMAIL    ?? 'e2e-super@test.dk'
const SUPER_PASSWORD = process.env.E2E_SUPER_PASSWORD ?? 'e2e-superpass-123'

export default async function globalSetup() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Clean up any data left from a previous run so each run starts fresh.
  await cleanupE2eData(supabase, ADMIN_EMAIL, SUPER_EMAIL)

  // Create e2e admin user (tenant admin for Hundested)
  const { data: adminData } = await supabase.auth.admin.createUser({
    email:         ADMIN_EMAIL,
    password:      ADMIN_PASSWORD,
    email_confirm: true,
    app_metadata:  { role: 'admin', tenant_id: TENANT_ID },
  })
  if (adminData?.user) {
    await supabase.from('users').upsert(
      { tenant_id: TENANT_ID, auth_id: adminData.user.id, email: ADMIN_EMAIL, role: 'admin', full_name: 'E2E Testadmin' },
      { onConflict: 'tenant_id,email' },
    )
  }

  // Create e2e super-admin user
  const { data: superData } = await supabase.auth.admin.createUser({
    email:         SUPER_EMAIL,
    password:      SUPER_PASSWORD,
    email_confirm: true,
    app_metadata:  { role: 'super_admin' },
  })
  if (superData?.user) {
    // super_admin has no tenant_id — insert into users without tenant scope if your schema allows,
    // otherwise skip (super-admin may only exist in auth.users).
    console.log('global-setup: super-admin auth user created:', SUPER_EMAIL)
  }

  console.log('global-setup: test users ready')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function cleanupE2eData(
  supabase: SupabaseClient<any>,
  adminEmail: string,
  superEmail: string,
) {
  // 1. Remove orders created by e2e booking tests (user email: e2e-booking@example.com)
  const { data: bookingUsers } = await supabase
    .from('users')
    .select('id')
    .eq('email', 'e2e-booking@example.com')

  const bookingUserIds = (bookingUsers ?? []).map(u => u.id)
  if (bookingUserIds.length > 0) {
    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .in('user_id', bookingUserIds)
    const orderIds = (orders ?? []).map(o => o.id)
    if (orderIds.length > 0) {
      await supabase.from('order_lines').delete().in('order_id', orderIds)
      await supabase.from('orders').delete().in('id', orderIds)
    }
    await supabase.from('users').delete().in('id', bookingUserIds)
  }

  // 2. Remove staff users created by super-admin e2e tests (email pattern: e2e-staff-%@hundested-test.dk)
  const { data: staffUsers } = await supabase
    .from('users')
    .select('id, auth_id')
    .like('email', 'e2e-staff-%')

  for (const u of staffUsers ?? []) {
    if (u.auth_id) await supabase.auth.admin.deleteUser(u.auth_id)
    await supabase.from('users').delete().eq('id', u.id)
  }

  // 3. Remove e2e admin and super-admin auth users
  for (const email of [adminEmail, superEmail]) {
    const { data: rows } = await supabase
      .from('users')
      .select('id, auth_id')
      .eq('email', email)

    for (const u of rows ?? []) {
      if (u.auth_id) await supabase.auth.admin.deleteUser(u.auth_id)
      await supabase.from('users').delete().eq('id', u.id)
    }

    // Also check auth.users directly in case the users table row is missing
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers()
    const authUser = authUsers.find(u => u.email === email)
    if (authUser) await supabase.auth.admin.deleteUser(authUser.id)
  }
}
