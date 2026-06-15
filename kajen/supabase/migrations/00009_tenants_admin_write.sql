-- Allow tenant admins and staff to update their own tenant row.
-- Previously only super_admin could write to tenants, so logo/theme/settings
-- changes from the admin panel were silently blocked by RLS.
CREATE POLICY "admin_update_own" ON tenants
  FOR UPDATE
  USING (id = current_tenant_id() AND current_user_role() IN ('admin', 'staff'));
