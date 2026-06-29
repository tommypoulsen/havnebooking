-- Security fix: merge_tenant_config / remove_tenant_config_key (00010) were created
-- SECURITY DEFINER with no internal tenant check and no REVOKE, so they bypassed RLS
-- and were callable by PUBLIC — letting any caller overwrite ANY tenant's config by
-- passing an arbitrary p_tenant_id (cross-tenant write).
--
-- Recreate them as SECURITY INVOKER so the existing RLS policies on `tenants`
-- (admin_update_own in 00009: id = current_tenant_id() AND role IN ('admin','staff');
-- super_admin_all in 00001) enforce ownership — RLS stays the single lock.
-- Also lock down EXECUTE to the authenticated role only.

CREATE OR REPLACE FUNCTION merge_tenant_config(p_tenant_id UUID, patch JSONB)
RETURNS VOID
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public
AS $$
  UPDATE tenants SET config = config || patch WHERE id = p_tenant_id;
$$;

CREATE OR REPLACE FUNCTION remove_tenant_config_key(p_tenant_id UUID, key TEXT)
RETURNS VOID
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public
AS $$
  UPDATE tenants SET config = config - key WHERE id = p_tenant_id;
$$;

REVOKE ALL ON FUNCTION merge_tenant_config(UUID, JSONB)      FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION remove_tenant_config_key(UUID, TEXT)  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION merge_tenant_config(UUID, JSONB)     TO authenticated;
GRANT EXECUTE ON FUNCTION remove_tenant_config_key(UUID, TEXT) TO authenticated;
