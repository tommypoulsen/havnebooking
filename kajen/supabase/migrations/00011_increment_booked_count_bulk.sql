-- Atomic bulk slot increment — replaces the per-slot for-loop in the QuickPay webhook.
-- Returns TRUE if all slots were incremented (none were at capacity), FALSE otherwise.

CREATE OR REPLACE FUNCTION increment_booked_count_bulk(slot_ids UUID[])
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE
  updated INT;
BEGIN
  UPDATE time_slots
  SET booked_count = booked_count + 1
  WHERE id = ANY(slot_ids) AND booked_count < capacity;

  GET DIAGNOSTICS updated = ROW_COUNT;
  RETURN updated = array_length(slot_ids, 1);
END;
$$;
