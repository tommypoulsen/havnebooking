-- Atomic JSONB patch helpers for tenant config — eliminates read-modify-write race conditions.
-- merge_tenant_config: merges a partial JSONB patch into tenants.config
-- remove_tenant_config_key: removes a single key from tenants.config

CREATE OR REPLACE FUNCTION merge_tenant_config(p_tenant_id UUID, patch JSONB)
RETURNS VOID LANGUAGE SQL SECURITY DEFINER AS $$
  UPDATE tenants SET config = config || patch WHERE id = p_tenant_id;
$$;

CREATE OR REPLACE FUNCTION remove_tenant_config_key(p_tenant_id UUID, key TEXT)
RETURNS VOID LANGUAGE SQL SECURITY DEFINER AS $$
  UPDATE tenants SET config = config - key WHERE id = p_tenant_id;
$$;
