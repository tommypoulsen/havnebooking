-- Grant the Data API roles table access so RLS can do its job.
--
-- Under the new Supabase default (auto_expose_new_tables unset), tables created by `postgres`
-- in `public` grant only Dxtm (no SELECT/INSERT/UPDATE/DELETE) to anon/authenticated/service_role.
-- That means a fresh database (local, or a newly-created hosted project) returns "permission
-- denied" for every public read, admin write, and booking write — before RLS is even evaluated.
--
-- Restore the privileges these roles need; RLS remains the row-level lock (per CLAUDE.md rule 1):
--   anon          — SELECT only (public pages read services/tenants/slots; RLS limits rows)
--   authenticated — full DML (admin panel + customer flows; RLS limits rows)
--   service_role  — full DML (server-side booking via the service client)
--
-- Functions are intentionally NOT blanket-granted here: existing functions already carry the
-- correct EXECUTE grants, and a blanket GRANT would re-expose the locked-down config RPCs
-- (merge_tenant_config / remove_tenant_config_key / set_service_addon_rules) to anon.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Existing tables
GRANT SELECT                         ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated, service_role;

-- Existing sequences (writers need them for any serial/identity columns)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- Future tables/sequences created by postgres (later migrations) inherit the same grants
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated, service_role;
