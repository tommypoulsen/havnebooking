-- Atomic decrement of time_slot.booked_count — used when an order is cancelled
-- Runs SECURITY INVOKER, so RLS on time_slots still applies (only admin/staff of the owning tenant)
CREATE OR REPLACE FUNCTION decrement_booked_count(slot_id UUID)
RETURNS void AS $$
  UPDATE time_slots
  SET booked_count = GREATEST(0, booked_count - 1)
  WHERE id = slot_id;
$$ LANGUAGE SQL;
