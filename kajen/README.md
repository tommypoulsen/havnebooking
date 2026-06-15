# Havnebooking — Kajen

Multi-tenant SaaS booking-platform for danske havne og bådeværfter.
B2B2C: havnen (tenant) er kunde, bådejere er slutbrugere.

Stack: Next.js 16 · React 19 · TypeScript strict · Tailwind CSS v4 · Supabase · QuickPay · Resend · Vercel

---

## Kom i gang (nyt udviklermiljø)

### Forudsætninger

- Node.js 20+
- [Supabase CLI](https://supabase.com/docs/guides/cli) — `npm install -g supabase`
- Adgang til: Supabase-projektet, QuickPay testbutik, Resend-konto

### 1. Installer afhængigheder

```bash
npm install
npx playwright install chromium   # kun nødvendigt for e2e tests
```

### 2. Konfigurér miljøvariable

```bash
cp .env.example .env.local
```

Åbn `.env.local` og udfyld alle værdier. Vigtige noter:
- `NEXT_PUBLIC_APP_DOMAIN`: lad være **tom** i lokalt udviklermiljø — middleware bruger da `localhost` som rod-domæne
- `E2E_SUPER_EMAIL` / `E2E_SUPER_PASSWORD`: skal matche den super-admin bruger du opretter i trin 4

### 3. Kør migrationer og seed-data

```bash
npx supabase db push        # kør migrationer mod remote
```

Eller for at nulstille remote database fuldstændigt (NB: sletter også auth.users):

```bash
echo "y" | npx supabase db reset --linked
```

Husk at genopret admin-bruger efter reset — se [Admin-konto](#admin-konto) nedenfor.

### 4. Start dev-server

```bash
npm run dev
```

Åbn [http://localhost:3000](http://localhost:3000).

For tenant-routing lokalt: tilføj til hosts-filen (`C:\Windows\System32\drivers\etc\hosts` på Windows):
```
127.0.0.1  hundested.localhost
```
og åbn [http://hundested.localhost:3000](http://hundested.localhost:3000).

### Admin-konto

Opret admin-bruger i Supabase dashboard → **Authentication → Users → Add user**, derefter kør i SQL-editoren:

```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{
  "role": "admin",
  "tenant_id": "00000000-0000-0000-0000-000000000001"
}'::jsonb
WHERE email = 'din@email.dk';
```

Super-admin konto oprettes tilsvarende med `"role": "super_admin"` (ingen `tenant_id`).

---

## Daglige kommandoer

```bash
npm run dev                         # dev-server
npm test                            # Vitest (unit + integration)
npx playwright test                 # e2e tests (kræver kørende dev-server)
npm run build                       # produktionsbuild + TypeScript-tjek
npx tsc --noEmit                    # TypeScript type-tjek uden build
npx supabase db push                # kør nye migrationer
npx supabase gen types typescript \
  --local > lib/types/database.ts   # regenerér DB-typer efter schema-ændringer
```

---

## Sideruter og endpoints

Alle offentlige sider kræver korrekt subdomain (f.eks. `hundested.localhost:3000`).
Admin-sider kræver login med rolle `admin` eller `staff`.
Super-admin sider kræver rolle `super_admin`.

### Offentlige sider (tenant-subdomæn)

| Rute | Side | Beskrivelse |
|------|------|-------------|
| `GET /` | Forside | Hero-sektion, service-oversigt, CTA til booking |
| `GET /priser` | Priser | Prisoversigt pr. service og størrelse |
| `GET /kontakt` | Kontakt | Kontaktoplysninger fra `tenant.config` |
| `GET /book` | Book — serviceliste | Viser aktive services; klik videresender til wizard |
| `GET /book/[serviceId]` | Booking-wizard | Multi-trin: størrelse → tidspunkt/dato → formfelter → kontaktinfo → opsummering |

### Auth

| Rute | Handling | Beskrivelse |
|------|----------|-------------|
| `GET /login` | — | Login-formular |
| Server Action `login` | `POST` | Email + password → JWT; returnerer `null` ved succes, fejlbesked ved fejl |
| Server Action `logout` | `POST` | Invalidér session → redirect til `/login` |

### Tenant-admin (`/admin/...`)

Kræver autentificeret bruger med rolle `admin` eller `staff` på den aktuelle tenant.

| Rute | Side | Beskrivelse |
|------|------|-------------|
| `GET /admin` | — | Redirect til `/admin/timeslots` |
| `GET /admin/timeslots` | Tidspunkter | Vis og opret tidspunkter til timeslot-services; enkelt dato eller uge-skabelon |
| `GET /admin/bookings` | Bookinger | Ordreliste med statusfilter (alle / afventer / bekræftet / annulleret / refunderet) |
| `GET /admin/pricing` | Priser | Rediger prisniveauer pr. størrelse (vises og gemmes i kr) |
| `GET /admin/lager` | Lager | Kapacitetsstyring: rediger `total_units` pr. størelseskategori, tilføj/slet kategorier |
| `GET /admin/settings` | Indstillinger | Upload logo (Supabase Storage) + vælg farveskema |

#### Server Actions — timeslots

| Action | Funktion |
|--------|----------|
| Opret enkelt tidspunkt | `createTimeSlot(formData)` |
| Opret batch fra uge-skabelon | `createTimeSlotsFromSchedule(serviceId, slots[])` |
| Slet tidspunkt | `deleteTimeSlot(formData)` — afvises hvis `booked_count > 0` |

#### Server Actions — lager

| Action | Funktion |
|--------|----------|
| Opdater kapacitet | `upsertInventory(formData)` — upsert på `(service_id, size_category_id)` |
| Tilføj størelseskategori | `addSizeCategory(formData)` — opretter både `size_categories` og `capacity_inventory` |
| Slet størelseskategori | `deleteSizeCategory(formData)` — afvises hvis bookinger eksisterer |

#### Server Actions — indstillinger

| Action | Funktion |
|--------|----------|
| Opdater farveskema | `updateTheme(formData)` — validerer mod `PALETTES`-nøgler |
| Opdater logo-URL | `updateLogoUrl(logoUrl)` — gemmer public URL fra Supabase Storage |
| Fjern logo | `removeLogo()` — sletter `logoUrl` fra `tenant.config` |

### Super-admin (`/tenants/...`)

Kræver JWT-claim `role = super_admin`. Ingen tenant-scope.

| Rute | Side | Beskrivelse |
|------|------|-------------|
| `GET /tenants` | Tenant-liste | Oversigt over alle tenants med status og oprettelsesdato |
| `GET /tenants/new` | Opret tenant | Formular: navn, subdomæne, displaynavn, kontaktoplysninger |
| `GET /tenants/[id]` | Rediger tenant | Rediger konfiguration; knap til aktivering/deaktivering |

#### Server Actions — tenants

| Action | Funktion |
|--------|----------|
| Opret tenant | `createTenant(formData)` — validerer subdomæne (kun `[a-z0-9-]`) |
| Opdater tenant | `updateTenant(formData)` — opdaterer navn og `config` JSONB |
| Skift aktiv-status | `toggleTenantActive(formData)` — flipper `active`-flag |
| Opret bruger | `createTenantUser(formData)` — opretter Supabase Auth-bruger + users-række |
| Rediger bruger | `updateTenantUser(formData)` — opdaterer navn, email, rolle i DB og auth.app_metadata |
| Slet bruger | `deleteTenantUser(formData)` — sletter users-række og Supabase Auth-bruger |
| Nulstil adgangskode | `resetTenantUserPassword(formData)` — sætter ny adgangskode via `auth.admin.updateUserById` |

### API — Webhooks

| Rute | Metode | Beskrivelse |
|------|--------|-------------|
| `/api/webhooks/quickpay` | `POST` | QuickPay betalings-callback: valider HMAC → opdater ordre og betaling → send bekræftelsesmail |

---

## Tenant-konfiguration (`tenants.config`)

```json
{
  "displayName": "Hundested Bådeværft",
  "contactEmail": "kontakt@hundested-baadevaerft.dk",
  "contactPhone": "71 99 70 02",
  "contactAddress": ["Nordre Beddingsvej 47", "DK-3390 Hundested"],
  "contactHours": "Mandag, onsdag og fredag kl. 8–11",
  "logoUrl": "https://<supabase>/storage/v1/object/public/logos/<id>/logo.png",
  "theme": "default",
  "cancellationPolicy": "standard"
}
```

### Farveskemaer (`theme`)

Hvert skema definerer et komplet sæt CSS custom properties der styrer hele websitets udseende.

| Nøgle | Navn | Header | Accent |
|-------|------|--------|--------|
| `default` | Rust | `#1e1e1e` koksgrå | `#7a3010` rust |
| `navy` | Havblå | `#0d2137` mørk marine | `#1a4a7a` blå |
| `forest` | Skovgrøn | `#1a2e1e` mørk grøn | `#2e7d4f` skovgrøn |
| `slate` | Skifergrå | `#263238` skifer | `#4a6278` gråblå |
| `terracotta` | Terrakotta | `#2c1a1a` mørk brun | `#c0392b` terrakotta |

Skemaet vælges i admin → Indstillinger og træder i kraft øjeblikkeligt via client-side DOM-opdatering.

---

## Vigtigste dokumentation

| Fil | Indhold |
|-----|---------|
| `CLAUDE.md` | Arkitekturregler og konventioner (læs dette først) |
| `docs/architecture.md` | Systemdesign og mønstre |
| `docs/database-schema.md` | Fuld SQL-schema med RLS-politikker |
| `docs/code-quality.md` | Review-kriterier og selvrevisions-checkliste |
| `docs/adr/` | Architecture Decision Records |
| `prototype/` | Reference-prototype — redigér ikke, ingen package.json |

---

## Projektstruktur

```
app/
  (auth)/                    # Login — ingen tenant-layout
    login/
  (tenant)/                  # Tenant-sider — subdomain-resolved i middleware
    layout.tsx               # Loader tenant, injicerer farveskema og viser SiteHeader/SiteFooter
    page.tsx                 # Forside
    priser/page.tsx          # Prisside
    kontakt/page.tsx         # Kontaktside
    book/
      page.tsx               # Serviceliste
      [serviceId]/
        page.tsx             # Booking-wizard (server wrapper)
        BookingWizard.tsx    # Booking-wizard (client, multi-trin)
    admin/
      layout.tsx             # Admin-layout med AdminNav
      AdminNav.tsx           # Navigationsmenu
      timeslots/             # Tidspunkter: liste + batch-opret
      bookings/              # Ordreliste med statusfilter
      pricing/               # Prisniveauer pr. størrelse
      lager/                 # Kapacitetsstyring
        page.tsx
        InventoryRow.tsx     # Inline rediger total_units (client)
        AddCategoryForm.tsx  # Tilføj størelseskategori (client)
        actions.ts
      settings/              # Logo og farveskema
        page.tsx
        LogoUpload.tsx       # Fil-upload til Supabase Storage (client)
        PalettePicker.tsx    # Farveskema-vælger med øjeblikkelig DOM-opdatering (client)
        actions.ts
  (super-admin)/             # Super-admin — kræver role = super_admin
    layout.tsx
    SuperAdminNav.tsx
    tenants/
      page.tsx               # Tenant-liste
      new/page.tsx           # Opret tenant
      [id]/page.tsx          # Rediger tenant
      [id]/EditTenantClient.tsx
      TenantForm.tsx         # Genanvendelig formular (client)
      actions.ts
  api/
    webhooks/
      quickpay/route.ts      # QuickPay callback (ikke implementeret endnu)
  components/
    SiteHeader.tsx           # Offentlig header med logo, navigation, burger-menu
    SiteFooter.tsx           # Offentlig footer med kontaktinfo
  globals.css                # @theme tokens + semantiske status-farver
  layout.tsx
lib/
  supabase/
    client.ts               # Browser-klient (singleton)
    server.ts               # Server-klient (cookie-baseret)
    middleware.ts            # Supabase-klient til proxy (request-scoped)
    actions.ts              # login / logout server actions
  types/
    database.ts             # Autogenereret fra Supabase — redigér ikke manuelt
    domain.ts               # Domænetyper (Tenant, Service, Order, …)
  utils/
    tenant.ts               # getTenant() — React.cache() deduplication
    palettes.ts             # Farveskema-definitioner (5 komplette sæt)
    pricing.ts              # Prisberegning — ren funktion
    availability.ts         # Tilgængelighed — ren funktion
    cancellation.ts         # Refunderingslogik — ren funktion
supabase/
  migrations/               # Nummereret SQL: 00001_init.sql …
  seed.sql                  # Testdata inkl. demo-tidspunkter for Kranløft
tests/
  unit/                     # Vitest unit-tests
  integration/              # Mod rigtig Supabase test-tenant
  e2e/                      # Playwright (kræves inden release)
prototype/                  # Reference-prototype — redigér ikke
docs/
  architecture.md
  database-schema.md
  code-quality.md
  adr/
```
