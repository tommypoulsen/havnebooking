-- services.public_read_active used current_tenant_id() which requires a JWT.
-- Booking pages are public (no auth) so this blocked anonymous visitors.
-- Services contain no sensitive data — active services can be read publicly.

DROP POLICY IF EXISTS "public_read_active" ON services;

CREATE POLICY "public_read_active" ON services FOR SELECT
  USING (active = true);
