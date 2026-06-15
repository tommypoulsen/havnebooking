-- Custom access token hook: injects tenant_id and role from the users table
-- into every JWT so RLS policies (current_tenant_id / current_user_role) work.
--
-- After applying this migration, enable the hook in Supabase dashboard:
-- Authentication → Hooks → Custom Access Token Hook → select
-- "public.custom_access_token_hook"

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  user_role      TEXT;
  user_tenant_id UUID;
  claims         JSONB;
BEGIN
  SELECT role, tenant_id
  INTO user_role, user_tenant_id
  FROM public.users
  WHERE auth_id = (event->>'user_id')::UUID;

  claims := event->'claims';

  IF user_role IS NOT NULL THEN
    claims := jsonb_set(
      claims,
      '{app_metadata}',
      COALESCE(claims->'app_metadata', '{}'::JSONB) ||
        jsonb_build_object(
          'role',      user_role,
          'tenant_id', user_tenant_id::TEXT
        )
    );
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Supabase's auth system calls the hook as supabase_auth_admin
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM PUBLIC, anon, authenticated;
