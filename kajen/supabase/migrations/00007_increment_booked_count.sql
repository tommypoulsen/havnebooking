-- Atomic increment of time_slot.booked_count.
-- Returns TRUE if successful, FALSE if the slot is already at capacity.
-- Called from the QuickPay webhook after payment confirmation.
CREATE OR REPLACE FUNCTION increment_booked_count(slot_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE time_slots
  SET booked_count = booked_count + 1
  WHERE id = slot_id AND booked_count < capacity;
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$ LANGUAGE plpgsql;
