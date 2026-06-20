-- Migration 00013: Atomic order creation + atomic service config update

-- 1. Atomic order + order_lines creation in a single transaction.
--    Called server-side with service_role — SECURITY DEFINER so it can insert across tables.
CREATE OR REPLACE FUNCTION create_order_with_lines(
  p_tenant_id    UUID,
  p_user_id      UUID,
  p_total_oere   INTEGER,
  p_primary_line JSONB,
  p_addon_lines  JSONB DEFAULT '[]'::JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
BEGIN
  INSERT INTO orders (tenant_id, user_id, status, total_oere)
  VALUES (p_tenant_id, p_user_id, 'pending', p_total_oere)
  RETURNING id INTO v_order_id;

  INSERT INTO order_lines (
    order_id,
    service_id,
    size_category_id,
    time_slot_id,
    starts_at,
    ends_at,
    quantity,
    unit_price_oere,
    line_total_oere,
    label,
    attributes
  ) VALUES (
    v_order_id,
    (p_primary_line->>'service_id')::UUID,
    (p_primary_line->>'size_category_id')::UUID,
    (p_primary_line->>'time_slot_id')::UUID,
    (p_primary_line->>'starts_at')::TIMESTAMPTZ,
    (p_primary_line->>'ends_at')::TIMESTAMPTZ,
    1,
    (p_primary_line->>'unit_price_oere')::INTEGER,
    (p_primary_line->>'unit_price_oere')::INTEGER,
    p_primary_line->>'label',
    COALESCE(p_primary_line->'attributes', '{}'::JSONB)
  );

  IF jsonb_array_length(p_addon_lines) > 0 THEN
    INSERT INTO order_lines (
      order_id,
      service_id,
      size_category_id,
      quantity,
      unit_price_oere,
      line_total_oere,
      label,
      attributes
    )
    SELECT
      v_order_id,
      (ln->>'service_id')::UUID,
      (ln->>'size_category_id')::UUID,
      COALESCE((ln->>'quantity')::INTEGER, 1),
      (ln->>'unit_price_oere')::INTEGER,
      (ln->>'line_total_oere')::INTEGER,
      ln->>'label',
      COALESCE(ln->'attributes', '{}'::JSONB)
    FROM jsonb_array_elements(p_addon_lines) AS ln;
  END IF;

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION create_order_with_lines(UUID, UUID, INTEGER, JSONB, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_order_with_lines(UUID, UUID, INTEGER, JSONB, JSONB) TO service_role;

-- 2. Atomic add-on rules update using jsonb_set — avoids the read-modify-write race.
--    SECURITY INVOKER so RLS (tenant_isolation on services) enforces ownership.
CREATE OR REPLACE FUNCTION set_service_addon_rules(
  p_service_id UUID,
  p_rules      JSONB
) RETURNS VOID
LANGUAGE SQL
SECURITY INVOKER
AS $$
  UPDATE services
  SET config = jsonb_set(config::jsonb, '{addOnRules}', p_rules, true)
  WHERE id = p_service_id;
$$;

GRANT EXECUTE ON FUNCTION set_service_addon_rules(UUID, JSONB) TO authenticated;
