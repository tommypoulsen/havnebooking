import { createClient } from '@supabase/supabase-js'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { cleanupE2eData } from './global-setup'

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'e2e-admin@hundested-test.dk'
const SUPER_EMAIL = process.env.E2E_SUPER_EMAIL ?? 'e2e-super@test.dk'

export default async function globalTeardown() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  await cleanupE2eData(supabase, ADMIN_EMAIL, SUPER_EMAIL)
  console.log('global-teardown: test data removed')
}
