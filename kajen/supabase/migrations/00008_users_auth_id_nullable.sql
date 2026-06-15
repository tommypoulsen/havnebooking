-- Allow guest bookings: customers can book without a Supabase Auth account.
-- auth_id is populated when the customer later creates an account.
ALTER TABLE users ALTER COLUMN auth_id DROP NOT NULL;
