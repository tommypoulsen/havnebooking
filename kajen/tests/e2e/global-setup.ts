import { createClient } from '@supabase/supabase-js'
import * as path from 'path'
import * as fs from 'fs'

// Load .env.local manually — Playwright global setup runs outside Next.js
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim()
    }
  }
}

const TENANT_ID  = '00000000-0000-0000-0000-000000000001'
const ADMIN_EMAIL    = process.env.E2E_ADMIN_EMAIL    ?? 'e2e-admin@hundested-test.dk'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'e2e-testpass-123'

export default async function globalSetup() {
  loadEnv()

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
