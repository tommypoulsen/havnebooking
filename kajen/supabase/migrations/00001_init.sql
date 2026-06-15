-- ============================================================
-- Helper functions
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- Supabase restricts the auth schema — helpers live in public instead.
-- Used in RLS policies throughout this file.
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_user_role() RETURNS TEXT AS $$
  SELECT auth.jwt() -> 'app_metadata' ->> 'role'
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================
-- tenants
-- ============================================================

CREATE TABLE tenants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  subdomain  TEXT NOT NULL UNIQUE,
  config     JSONB NOT NULL DEFAULT '{}',
  active     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_all"   ON tenants USING (current_user_role() = 'super_admin');
CREATE POLICY "tenant_read_own"   ON tenants FOR SELECT USING (id = current_tenant_id());
-- Public: booking pages need to read tenant config without a session
CREATE POLICY "public_read_active" ON tenants FOR SELECT USING (active = true);

CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);

-- ============================================================
-- users
-- ============================================================

CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  auth_id    UUID NOT NULL UNIQUE,
  email      TEXT NOT NULL,
  role       TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'customer')),
  full_name  TEXT,
  phone      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  UNIQUE(tenant_id, email)
);
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_all"  ON users USING (current_user_role() = 'super_admin');
CREATE POLICY "tenant_isolation" ON users USING (tenant_id = current_tenant_id());
CREATE POLICY "customer_own"     ON users FOR SELECT USING (auth_id = auth.uid());

CREATE INDEX idx_users_auth_id       ON users(auth_id);
CREATE INDEX idx_users_tenant_email  ON users(tenant_id, email);

-- ============================================================
-- services
-- ============================================================

CREATE TABLE services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('capacity', 'timeslot', 'stock')),
  description TEXT,
  config      JSONB NOT NULL DEFAULT '{}',
  active      BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ
);
CREATE TRIGGER services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_all"    ON services USING (current_user_role() = 'super_admin');
CREATE POLICY "public_read_active" ON services FOR SELECT
  USING (active = true AND tenant_id = current_tenant_id());
CREATE POLICY "admin_staff_write"  ON services
  USING (tenant_id = current_tenant_id()
    AND current_user_role() IN ('admin', 'staff'));

-- ============================================================
-- size_categories
-- ============================================================

CREATE TABLE size_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id  UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  description TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE size_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_all"   ON size_categories USING (current_user_role() = 'super_admin');
CREATE POLICY "public_read"       ON size_categories FOR SELECT USING (true);
CREATE POLICY "admin_staff_write" ON size_categories
  USING (service_id IN (
    SELECT id FROM services WHERE tenant_id = current_tenant_id()
  ) AND current_user_role() IN ('admin', 'staff'));

-- ============================================================
-- capacity_inventory
-- ============================================================

CREATE TABLE capacity_inventory (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id       UUID NOT NULL REFERENCES services(id),
  size_category_id UUID NOT NULL REFERENCES size_categories(id),
  total_units      INTEGER NOT NULL CHECK (total_units > 0),
  UNIQUE(service_id, size_category_id)
);

ALTER TABLE capacity_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_all"   ON capacity_inventory USING (current_user_role() = 'super_admin');
CREATE POLICY "public_read"       ON capacity_inventory FOR SELECT USING (true);
CREATE POLICY "admin_staff_write" ON capacity_inventory
  USING (service_id IN (
    SELECT id FROM services WHERE tenant_id = current_tenant_id()
  ) AND current_user_role() IN ('admin', 'staff'));

CREATE INDEX idx_capacity_inv_service_size ON capacity_inventory(service_id, size_category_id);

-- ============================================================
-- time_slots
-- ============================================================

CREATE TABLE time_slots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id   UUID NOT NULL REFERENCES services(id),
  starts_at    TIMESTAMPTZ NOT NULL,
  capacity     INTEGER NOT NULL CHECK (capacity > 0),
  booked_count INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT booked_not_exceed_capacity CHECK (booked_count <= capacity)
);

ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_all"   ON time_slots USING (current_user_role() = 'super_admin');
CREATE POLICY "public_read"       ON time_slots FOR SELECT USING (true);
CREATE POLICY "admin_staff_write" ON time_slots
  USING (service_id IN (
    SELECT id FROM services WHERE tenant_id = current_tenant_id()
  ) AND current_user_role() IN ('admin', 'staff'));

CREATE INDEX idx_time_slots_service_starts ON time_slots(service_id, starts_at);

-- ============================================================
-- pricing_rules
-- ============================================================

CREATE TABLE pricing_rules (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id       UUID NOT NULL REFERENCES services(id),
  size_category_id UUID REFERENCES size_categories(id),
  duration_type    TEXT NOT NULL CHECK (duration_type IN ('per_lift', 'per_season', 'per_day')),
  price_oere       INTEGER NOT NULL CHECK (price_oere > 0),
  valid_from       DATE,
  valid_to         DATE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_all" ON pricing_rules USING (current_user_role() = 'super_admin');
CREATE POLICY "public_read"     ON pricing_rules FOR SELECT USING (true);
CREATE POLICY "admin_write"     ON pricing_rules
  USING (service_id IN (
    SELECT id FROM services WHERE tenant_id = current_tenant_id()
  ) AND current_user_role() = 'admin');

-- ============================================================
-- cancellation_policies
-- ============================================================

CREATE TABLE cancellation_policies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  service_id  UUID REFERENCES services(id),
  days_before INTEGER NOT NULL CHECK (days_before >= 0),
  refund_pct  INTEGER NOT NULL CHECK (refund_pct BETWEEN 0 AND 100)
);
-- Two partial indexes to enforce uniqueness: one per (tenant, days_before) when
-- service_id is NULL, one per (tenant, service_id, days_before) when it is not.
CREATE UNIQUE INDEX cancellation_policies_tenant_days
  ON cancellation_policies(tenant_id, days_before)
  WHERE service_id IS NULL;
CREATE UNIQUE INDEX cancellation_policies_tenant_service_days
  ON cancellation_policies(tenant_id, service_id, days_before)
  WHERE service_id IS NOT NULL;

ALTER TABLE cancellation_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_all"  ON cancellation_policies USING (current_user_role() = 'super_admin');
CREATE POLICY "tenant_isolation" ON cancellation_policies USING (tenant_id = current_tenant_id());

-- ============================================================
-- orders
-- ============================================================

CREATE TABLE orders (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  user_id    UUID NOT NULL REFERENCES users(id),
  status     TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
  total_oere INTEGER NOT NULL CHECK (total_oere >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_all"  ON orders USING (current_user_role() = 'super_admin');
CREATE POLICY "tenant_isolation" ON orders USING (tenant_id = current_tenant_id());
CREATE POLICY "customer_own"     ON orders FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE INDEX idx_orders_tenant_status ON orders(tenant_id, status);
CREATE INDEX idx_orders_user          ON orders(user_id);

-- ============================================================
-- order_lines
-- ============================================================

CREATE TABLE order_lines (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID NOT NULL REFERENCES orders(id),
  service_id       UUID NOT NULL REFERENCES services(id),
  size_category_id UUID REFERENCES size_categories(id),
  time_slot_id     UUID REFERENCES time_slots(id),
  starts_at        DATE,
  ends_at          DATE,
  quantity         INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_oere  INTEGER NOT NULL CHECK (unit_price_oere >= 0),
  line_total_oere  INTEGER NOT NULL CHECK (line_total_oere >= 0),
  attributes       JSONB NOT NULL DEFAULT '{}'
);

ALTER TABLE order_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_all"    ON order_lines USING (current_user_role() = 'super_admin');
CREATE POLICY "inherit_from_order" ON order_lines
  USING (order_id IN (
    SELECT id FROM orders WHERE tenant_id = current_tenant_id()
  ));

-- ============================================================
-- payments
-- ============================================================

CREATE TABLE payments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id           UUID NOT NULL REFERENCES orders(id),
  provider           TEXT NOT NULL DEFAULT 'quickpay',
  provider_reference TEXT NOT NULL UNIQUE,
  amount_oere        INTEGER NOT NULL CHECK (amount_oere > 0),
  status             TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'authorized', 'captured', 'failed', 'refunded')),
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ
);
CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_all"  ON payments USING (current_user_role() = 'super_admin');
CREATE POLICY "tenant_isolation" ON payments
  USING (order_id IN (
    SELECT id FROM orders WHERE tenant_id = current_tenant_id()
  ));

CREATE UNIQUE INDEX idx_payments_provider_ref ON payments(provider_reference);

-- ============================================================
-- refunds
-- ============================================================

CREATE TABLE refunds (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id  UUID NOT NULL REFERENCES payments(id),
  amount_oere INTEGER NOT NULL CHECK (amount_oere > 0),
  reason      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_all"  ON refunds USING (current_user_role() = 'super_admin');
CREATE POLICY "tenant_isolation" ON refunds
  USING (payment_id IN (
    SELECT p.id FROM payments p
    JOIN orders o ON o.id = p.order_id
    WHERE o.tenant_id = current_tenant_id()
  ));

-- ============================================================
-- NOTE: JWT custom claims hook
-- When a user logs in, tenant_id and role must be present in
-- app_metadata for current_tenant_id() and current_user_role() to work.
-- Set these via the Supabase dashboard (Authentication → Users)
-- or via service_role API when creating users.
-- A custom_access_token hook will be added in a later migration.
-- ============================================================
