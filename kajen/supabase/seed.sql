-- Seed data: Hundested Bådeværft (test tenant)
-- Stable UUIDs so cross-references work across resets.
-- Users must be created separately via Supabase Auth dashboard,
-- then their app_metadata must be set: { tenant_id, role }.

-- ============================================================
-- Tenant
-- ============================================================

INSERT INTO tenants (id, name, subdomain, config) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Hundested Bådeværft',
  'hundested',
  '{
    "displayName": "Hundested Bådeværft",
    "contactEmail": "hundested@baadevaerft.com",
    "contactPhone": "71 99 70 02",
    "contactAddress": ["Nordre Beddingsvej 47", "DK-3390 Hundested"],
    "contactHours": "Mandag, onsdag og fredag kl. 8–11",
    "theme": "hundested",
    "cancellationPolicy": "standard"
  }'
) ON CONFLICT (id) DO UPDATE SET config = EXCLUDED.config;

-- ============================================================
-- Services
-- ============================================================

INSERT INTO services (id, tenant_id, name, type, description, config, sort_order) VALUES (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'Kranløft',
  'timeslot',
  'Søsætning og optagning med kran',
  '{
    "requiresSizeCategory": true,
    "formFields": [
      {
        "id": "boat_type",
        "label": "Bådtype",
        "type": "select",
        "required": true,
        "options": [
          { "value": "sejlbaad", "label": "Sejlbåd" },
          { "value": "motorbaad", "label": "Motorbåd" },
          { "value": "katamaran", "label": "Katamaran" }
        ]
      },
      {
        "id": "mast",
        "label": "Mast",
        "type": "select",
        "required": true,
        "dependsOn": { "field": "boat_type", "value": "sejlbaad" },
        "options": [
          { "value": "med_mast", "label": "Med mast" },
          { "value": "uden_mast", "label": "Uden mast" }
        ]
      }
    ]
  }',
  0
);

INSERT INTO services (id, tenant_id, name, type, description, config, sort_order) VALUES (
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000001',
  'Stativleje',
  'capacity',
  'Vinteropbevaring på stativ',
  '{
    "requiresSizeCategory": true,
    "formFields": [
      {
        "id": "boat_type",
        "label": "Bådtype",
        "type": "select",
        "required": true,
        "options": [
          { "value": "sejlbaad", "label": "Sejlbåd" },
          { "value": "motorbaad", "label": "Motorbåd" }
        ]
      }
    ]
  }',
  1
);

INSERT INTO services (id, tenant_id, name, type, description, config, sort_order) VALUES (
  '00000000-0000-0000-0000-000000000012',
  '00000000-0000-0000-0000-000000000001',
  'Stormstøtter',
  'stock',
  'Udlån af stormstøtter til stativ',
  '{
    "requiresSizeCategory": false,
    "formFields": [
      {
        "id": "quantity",
        "label": "Antal stormstøtter",
        "type": "number",
        "required": true
      }
    ]
  }',
  2
);

-- ============================================================
-- Size categories — Kranløft
-- ============================================================

INSERT INTO size_categories (id, service_id, label, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000010', '0–3 ton', 0),
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000010', '3–6 ton', 1),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000010', '6–10 ton', 2),
  ('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000010', '10+ ton', 3);

-- Size categories — Stativleje
INSERT INTO size_categories (id, service_id, label, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000011', '0–3 ton', 0),
  ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000011', '3–6 ton', 1),
  ('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000011', '6–10 ton', 2),
  ('00000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000011', '10+ ton', 3);

-- ============================================================
-- Capacity inventory — Stativleje (50 pladser fordelt på størrelse)
-- ============================================================

INSERT INTO capacity_inventory (service_id, size_category_id, total_units) VALUES
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000030', 20),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000031', 18),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000032', 8),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000033', 4);

-- ============================================================
-- Pricing rules — Kranløft (per løft, i øre)
-- ============================================================

INSERT INTO pricing_rules (service_id, size_category_id, duration_type, price_oere) VALUES
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000020', 'per_lift', 89300),   -- 893 kr
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000021', 'per_lift', 109500),  -- 1.095 kr
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000022', 'per_lift', 149500),  -- 1.495 kr
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000023', 'per_lift', 199500);  -- 1.995 kr

-- Pricing rules — Stativleje (per sæson, i øre)
INSERT INTO pricing_rules (service_id, size_category_id, duration_type, price_oere) VALUES
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000030', 'per_season', 299500),  -- 2.995 kr
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000031', 'per_season', 399500),  -- 3.995 kr
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000032', 'per_season', 549500),  -- 5.495 kr
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000033', 'per_season', 749500);  -- 7.495 kr

-- Pricing rules — Stormstøtter (per dag per stk)
INSERT INTO pricing_rules (service_id, size_category_id, duration_type, price_oere) VALUES
  ('00000000-0000-0000-0000-000000000012', NULL, 'per_day', 2500);  -- 25 kr/dag

-- ============================================================
-- Cancellation policy — Hundested (standard)
-- ============================================================

INSERT INTO cancellation_policies (tenant_id, days_before, refund_pct) VALUES
  ('00000000-0000-0000-0000-000000000001', 30, 100),
  ('00000000-0000-0000-0000-000000000001', 15, 50),
  ('00000000-0000-0000-0000-000000000001', 0,  0);
