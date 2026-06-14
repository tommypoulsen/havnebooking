-- Prevent duplicate time slots for the same service at the same start time.
-- Required for batch upsert semantics (ignoreDuplicates) in admin actions.
ALTER TABLE time_slots
  ADD CONSTRAINT time_slots_service_starts_unique UNIQUE (service_id, starts_at);
