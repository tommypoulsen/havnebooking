-- Corrects 00014. SECURITY INVOKER (00014) is not viable for these RPCs: migration-created
-- tables are owned by `postgres`, whose default ACL grants only Dxtm (no SELECT/INSERT/UPDATE)
-- to anon/authenticated/service_role — so an INVOKER call fails with "permission denied" and the
-- admin settings/addons saves break. (00014 is left untouched per the never-edit-migrations rule.)
--
-- Keep SECURITY DEFINER (runs as the postgres owner, so table access works) but add an explicit
-- authorization guard in the WHERE clause that mirrors the table's RLS policies, using the
-- caller's JWT claims. current_tenant_id() / current_user_role() still resolve to the CALLER
-- inside a DEFINER function (they read the request GUC, not the function's security context).
-- An unauthorized call matches no rows and is a silent no-op — it can never touch another tenant.
-- Also covers set_service_addon_rules (created INVOKER in 00013, same permission problem).

-- ---- tenants.config: mirror super_admin_all + admin_update_own (00001 / 00009) ----

CREATE OR REPLACE FUNCTION merge_tenant_config(p_tenant_id UUID, patch JSONB)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE tenants SET config = config || patch
  WHERE id = p_tenant_id
    AND (
      current_user_role() = 'super_admin'
      OR (id = current_tenant_id() AND current_user_role() IN ('admin', 'staff'))
    );
$$;

CREATE OR REPLACE FUNCTION remove_tenant_config_key(p_tenant_id UUID, key TEXT)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE tenants SET config = config - key
  WHERE id = p_tenant_id
    AND (
      current_user_role() = 'super_admin'
      OR (id = current_tenant_id() AND current_user_role() IN ('admin', 'staff'))
    );
$$;

-- ---- services.config addOnRules: mirror super_admin_all + admin/staff write (00001) ----

CREATE OR REPLACE FUNCTION set_service_addon_rules(p_service_id UUID, p_rules JSONB)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE services
  SET config = jsonb_set(config::jsonb, '{addOnRules}', p_rules, true)
  WHERE id = p_service_id
    AND (
      current_user_role() = 'super_admin'
      OR (tenant_id = current_tenant_id() AND current_user_role() IN ('admin', 'staff'))
    );
$$;

REVOKE ALL ON FUNCTION merge_tenant_config(UUID, JSONB)      FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION remove_tenant_config_key(UUID, TEXT)  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION set_service_addon_rules(UUID, JSONB)   FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION merge_tenant_config(UUID, JSONB)      TO authenticated;
GRANT EXECUTE ON FUNCTION remove_tenant_config_key(UUID, TEXT)  TO authenticated;
GRANT EXECUTE ON FUNCTION set_service_addon_rules(UUID, JSONB)   TO authenticated;
