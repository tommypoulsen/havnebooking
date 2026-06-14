# Database Schema — Havnebooking

_Fuld SQL-schema med RLS-politikker. Læs dette inden du skriver migrationer eller Supabase-forespørgsler._

Priser opbevares i **øre** (integer) — undgår floating point.
Alle migrationer placeres i `supabase/migrations/` med numerisk prefix (`00001_init.sql`).
Aldrig ændr eksisterende migrationsfiler — tilføj altid en ny.

---

## Helper-funktioner (oprettes én gang i `00001_init.sql`)

```sql
-- Trigger-funktion til updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- Henter tenant_id fra JWT app_metadata
CREATE OR REPLACE FUNCTION auth.tenant_id() RETURNS UUID AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
$$ LANGUAGE SQL STABLE;

-- Henter brugerens rolle fra JWT app_metadata
CREATE OR REPLACE FUNCTION auth.user_role() RETURNS TEXT AS $$
  SELECT auth.jwt() -> 'app_metadata' ->> 'role'
$$ LANGUAGE SQL STABLE;
```

---

## Tabeller

### tenants

```sql
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
-- Super admin kan alt; en tenant kan læse sin egen række
CREATE POLICY "super_admin_all"    ON tenants USING (auth.user_role() = 'super_admin');
CREATE POLICY "tenant_read_own"    ON tenants FOR SELECT USING (id = auth.tenant_id());
```

`config` JSONB-eksempel:
```json
{
  "displayName": "Hundested Bådeværft",
  "contactEmail": "kontakt@hundested-baadevaerft.dk",
  "theme": "hundested",
  "cancellationPolicy": "standard"
}
```

---

### users

```sql
CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  auth_id    UUID NOT NULL UNIQUE,           -- Supabase Auth UUID
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
CREATE POLICY "super_admin_all"   ON users USING (auth.user_role() = 'super_admin');
CREATE POLICY "tenant_isolation"  ON users USING (tenant_id = auth.tenant_id());
-- Kunder kan kun se og redigere sig selv
CREATE POLICY "customer_own"      ON users
  FOR SELECT USING (auth_id = auth.uid());
```

---

### services

```sql
CREATE TABLE services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('capacity', 'timeslot', 'stock')),
  description TEXT,
  config      JSONB NOT NULL DEFAULT '{}',  -- formfelter, tilvalg og adfærd — se docs/architecture.md
  active      BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ
);
CREATE TRIGGER services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_all"    ON services USING (auth.user_role() = 'super_admin');
CREATE POLICY "public_read_active" ON services FOR SELECT
  USING (active = true AND tenant_id = auth.tenant_id());
CREATE POLICY "admin_staff_write"  ON services
  USING (tenant_id = auth.tenant_id()
    AND auth.user_role() IN ('admin', 'staff'));
```

---

### size_categories

```sql
CREATE TABLE size_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id  UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,               -- fx "0–3 ton", "Sejlbåd · 3–6 t"
  description TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE size_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_all"   ON size_categories USING (auth.user_role() = 'super_admin');
CREATE POLICY "public_read"       ON size_categories FOR SELECT USING (true);
CREATE POLICY "admin_staff_write" ON size_categories
  USING (service_id IN (
    SELECT id FROM services WHERE tenant_id = auth.tenant_id()
  ) AND auth.user_role() IN ('admin', 'staff'));
```

---

### capacity_inventory

```sql
CREATE TABLE capacity_inventory (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id       UUID NOT NULL REFERENCES services(id),
  size_category_id UUID NOT NULL REFERENCES size_categories(id),
  total_units      INTEGER NOT NULL CHECK (total_units > 0),
  UNIQUE(service_id, size_category_id)
);

ALTER TABLE capacity_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_all"   ON capacity_inventory USING (auth.user_role() = 'super_admin');
CREATE POLICY "public_read"       ON capacity_inventory FOR SELECT USING (true);
CREATE POLICY "admin_staff_write" ON capacity_inventory
  USING (service_id IN (
    SELECT id FROM services WHERE tenant_id = auth.tenant_id()
  ) AND auth.user_role() IN ('admin', 'staff'));
```

---

### time_slots

```sql
CREATE TABLE time_slots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id   UUID NOT NULL REFERENCES services(id),
  starts_at    TIMESTAMPTZ NOT NULL,
  capacity     INTEGER NOT NULL CHECK (capacity > 0),
  booked_count INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT booked_not_exceed_capacity CHECK (booked_count <= capacity)
);

ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_all"   ON time_slots USING (auth.user_role() = 'super_admin');
CREATE POLICY "public_read"       ON time_slots FOR SELECT USING (true);
CREATE POLICY "admin_staff_write" ON time_slots
  USING (service_id IN (
    SELECT id FROM services WHERE tenant_id = auth.tenant_id()
  ) AND auth.user_role() IN ('admin', 'staff'));
```

`booked_count` opdateres i en DB-transaktion ved bekræftelse af booking — ikke i application-kode.

---

### pricing_rules

```sql
CREATE TABLE pricing_rules (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id       UUID NOT NULL REFERENCES services(id),
  size_category_id UUID REFERENCES size_categories(id),  -- NULL = alle størrelser
  duration_type    TEXT NOT NULL CHECK (duration_type IN ('per_lift', 'per_season', 'per_day')),
  price_oere       INTEGER NOT NULL CHECK (price_oere > 0),  -- pris i øre
  valid_from       DATE,   -- NULL = altid gyldig
  valid_to         DATE,   -- NULL = ingen udløb
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_all"   ON pricing_rules USING (auth.user_role() = 'super_admin');
CREATE POLICY "public_read"       ON pricing_rules FOR SELECT USING (true);
CREATE POLICY "admin_write"       ON pricing_rules
  USING (service_id IN (
    SELECT id FROM services WHERE tenant_id = auth.tenant_id()
  ) AND auth.user_role() = 'admin');
```

Eksempel (Hundested sæson 2026/2027):
```sql
-- Kranløft 0–3 ton: 893 kr. = 89300 øre
INSERT INTO pricing_rules (service_id, size_category_id, duration_type, price_oere)
VALUES ('<kranløft-service-id>', '<0-3t-kategori-id>', 'per_lift', 89300);
```

---

### cancellation_policies

```sql
CREATE TABLE cancellation_policies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  service_id  UUID REFERENCES services(id),  -- NULL = gælder alle services
  days_before INTEGER NOT NULL CHECK (days_before >= 0),
  refund_pct  INTEGER NOT NULL CHECK (refund_pct BETWEEN 0 AND 100),
  UNIQUE(tenant_id, COALESCE(service_id, '00000000-0000-0000-0000-000000000000'::UUID), days_before)
);

ALTER TABLE cancellation_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_all"  ON cancellation_policies USING (auth.user_role() = 'super_admin');
CREATE POLICY "tenant_isolation" ON cancellation_policies USING (tenant_id = auth.tenant_id());
```

Eksempel (Hundested):
```sql
-- > 30 dage: 100% refundering
INSERT INTO cancellation_policies (tenant_id, days_before, refund_pct) VALUES ('<id>', 30, 100);
-- 15–30 dage: 50% refundering
INSERT INTO cancellation_policies (tenant_id, days_before, refund_pct) VALUES ('<id>', 15, 50);
-- < 15 dage: 0% refundering
INSERT INTO cancellation_policies (tenant_id, days_before, refund_pct) VALUES ('<id>', 0, 0);
```

---

### orders

```sql
CREATE TABLE orders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  user_id     UUID NOT NULL REFERENCES users(id),
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
  total_oere  INTEGER NOT NULL CHECK (total_oere >= 0),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ
);
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_all"   ON orders USING (auth.user_role() = 'super_admin');
CREATE POLICY "tenant_isolation"  ON orders USING (tenant_id = auth.tenant_id());
-- Kunder ser kun egne ordrer
CREATE POLICY "customer_own"      ON orders FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
```

---

### order_lines

```sql
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
  attributes       JSONB NOT NULL DEFAULT '{}'  -- bruger-valgte formfelter fx {"boat_type":"sejlbaad","mast":"med_mast"}
);

ALTER TABLE order_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_all"  ON order_lines USING (auth.user_role() = 'super_admin');
CREATE POLICY "inherit_from_order" ON order_lines
  USING (order_id IN (
    SELECT id FROM orders WHERE tenant_id = auth.tenant_id()
  ));
```

---

### payments

```sql
CREATE TABLE payments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id           UUID NOT NULL REFERENCES orders(id),
  provider           TEXT NOT NULL DEFAULT 'quickpay',
  provider_reference TEXT NOT NULL UNIQUE,  -- QuickPay payment ID (til idempotens-tjek)
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
CREATE POLICY "super_admin_all"   ON payments USING (auth.user_role() = 'super_admin');
CREATE POLICY "tenant_isolation"  ON payments
  USING (order_id IN (
    SELECT id FROM orders WHERE tenant_id = auth.tenant_id()
  ));
```

---

### refunds

```sql
CREATE TABLE refunds (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id  UUID NOT NULL REFERENCES payments(id),
  amount_oere INTEGER NOT NULL CHECK (amount_oere > 0),
  reason      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_all"  ON refunds USING (auth.user_role() = 'super_admin');
CREATE POLICY "tenant_isolation" ON refunds
  USING (payment_id IN (
    SELECT p.id FROM payments p
    JOIN orders o ON o.id = p.order_id
    WHERE o.tenant_id = auth.tenant_id()
  ));
```

---

## Indeks-strategi

```sql
-- Tenant-opslag (bruges i middleware og RLS)
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);

-- Bruger-opslag ved login
CREATE INDEX idx_users_auth_id    ON users(auth_id);
CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);

-- Tilgængelighed
CREATE INDEX idx_time_slots_service_starts ON time_slots(service_id, starts_at);
CREATE INDEX idx_capacity_inv_service_size ON capacity_inventory(service_id, size_category_id);

-- Ordrer per tenant og bruger
CREATE INDEX idx_orders_tenant_status ON orders(tenant_id, status);
CREATE INDEX idx_orders_user          ON orders(user_id);

-- Betalings-idempotens
CREATE UNIQUE INDEX idx_payments_provider_ref ON payments(provider_reference);
```

---

## Skalerbarhedsnote

`time_slots.booked_count` opdateres med `UPDATE ... SET booked_count = booked_count + 1 WHERE id = $1 AND booked_count < capacity RETURNING id` inden for en transaktion.
Hvis 0 rækker returneres: kapaciteten er nået — returner fejl til brugeren.
Dette er optimistic locking — undgår eksplicit row-lock under høj load.
