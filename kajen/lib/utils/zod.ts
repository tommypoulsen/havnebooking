import { z } from 'zod'

// Zod v4's z.string().uuid() enforces RFC 4122 version/variant bits,
// which our deterministic seed UUIDs (version nibble = 0) don't satisfy.
// Use zUuid everywhere we validate a DB-sourced UUID.
export const zUuid = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  'Invalid UUID',
)
