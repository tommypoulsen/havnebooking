import { createClient } from '@supabase/supabase-js'

// .env.local is loaded by playwright.config.ts before this runs
const TENANT_ID      = '00000000-0000-0000-0000-000000000001'
const ADMIN_EMAIL    = process.env.E2E_ADMIN_EMAIL    ?? 'e2e-admin@hundested-test.dk'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'e2e-testpass-123'

export default async function globalSetup() {

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data, error } = await supabase.auth.admin.createUser({
    email:         ADMIN_EMAIL,
    password:      ADMIN_PASSWORD,
    email_confirm: true,
    app_metadata:  { role: 'admin', tenant_id: TENANT_ID },
  })

  if (error && !error.message.toLowerCase().includes('already')) {
    console.error('global-setup: failed to create test admin:', error.message)
    process.exit(1)
  }

  if (data?.user) {
    await supabase.from('users').upsert(
      { tenant_id: TENANT_ID, auth_id: data.user.id, email: ADMIN_EMAIL, role: 'admin', full_name: 'E2E Testadmin' },
      { onConflict: 'tenant_id,email' },
    )
  }

  console.log('global-setup: test users ready')
}
