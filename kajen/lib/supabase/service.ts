'server-only'

import { createClient } from '@supabase/supabase-js'

// Service-role client — bypasses RLS. Server-side only.
// Only use when the operation cannot be performed with the user's JWT
// (e.g. unauthenticated guest checkout, admin auth operations).
// Always enforce tenant isolation manually in the calling code.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
