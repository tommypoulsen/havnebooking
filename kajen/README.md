# Havnebooking — Kajen

Multi-tenant SaaS booking-platform for danske havne og bådeværfter.
B2B2C: havnen (tenant) er kunde, bådejere er slutbrugere.

Stack: Next.js 16 · React 19 · TypeScript strict · Tailwind CSS v4 · Supabase · QuickPay · Resend · Vercel

---

## Kom i gang (nyt udviklermiljø)

### Forudsætninger

- Node.js 20+
- [Supabase CLI](https://supabase.com/docs/guides/cli) — `npm install -g supabase`
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — kræves til lokal Supabase (e2e tests)
  - Windows: `winget install Docker.DockerDesktop`
  - Mac: `brew install --cask docker`
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
npm run test:e2e                    # Playwright e2e (se nedenfor)
npm run build                       # produktionsbuild + TypeScript-tjek
npx tsc --noEmit                    # TypeScript type-tjek uden build
npx supabase db push                # kør nye migrationer
npx supabase gen types typescript \
  --local > lib/types/database.ts   # regenerér DB-typer efter schema-ændringer
```

### E2e tests (Playwright)

E2e tests kører mod en **lokal Supabase-instans** — aldrig mod produktion.

**Første gang:**
```bash
# 1. Installér og start Docker Desktop (se Forudsætninger ovenfor)
# 2. Start lokal Supabase
npx supabase start

# 3. Kopiér test-miljøfil og kør migrationer + seed
cp .env.test.local.example .env.test.local
npx supabase db reset --local       # anvender migrationer + seed.sql

# 4. Installér browser
npx playwright install chromium
```

`.env.test.local` indeholder de velkendte standard-nøgler til lokal Supabase — du behøver ikke ændre dem, medmindre `npx supabase status` viser andre værdier.

**Kør tests:**
```bash
npm run test:e2e
```

`global-setup` rydder op inden kørslen og opretter test-brugerne. `global-teardown` fjerner dem igen bagefter. Produktion-databasen berøres aldrig.

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

### API — Webhooks og hjælpere

| Rute | Metode | Beskrivelse |
|------|--------|-------------|
| `/api/webhooks/quickpay` | `POST` | QuickPay betalings-callback: valider HMAC → opdater ordre og betaling → send bekræftelsesmail |
| `/api/switch-tenant?tenant=<subdomain>` | `GET` | Dev-værktøj: sætter `tenant-override`-cookie og redirecter til `/`. Bruges til at tilgå en tenant-side fra rod-domænet (fx Vercel preview-URL) |

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

## Vercel-deployment

### Miljøvariable på Vercel

Sæt følgende environment variables i Vercel-dashboardet (Settings → Environment Variables):

| Variabel | Beskrivelse |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (kun server) |
| `NEXT_PUBLIC_APP_DOMAIN` | Rod-domæne, fx `aksiom.dk` |
| `QUICKPAY_API_KEY` | QuickPay API-nøgle |
| `QUICKPAY_PRIVATE_KEY` | QuickPay private key til HMAC-validering |
| `RESEND_API_KEY` | Resend API-nøgle |
| `RESEND_FROM_EMAIL` | Afsender-email, fx `noreply@aksiom.dk` |

> **BOM-advarsel**: Hvis du kopierer værdier ind via Vercel-dashboardet og bruger et tekstprogram som Notepad til at holde dem, kan der opstå en usynlig Unicode BOM (U+FEFF) foran værdien. Dette bryder alle HTTP-kald fra Supabase-klienten med en `ByteString`-fejl. Løsning: skriv værdien direkte ind i Vercel-feltet — kopier fra Supabase-dashboardet, ikke fra en mellemliggende tekstfil.

### Custom domain

- Apex-domæne (`aksiom.dk`): `A`-record → `216.198.79.1`
- Wildcard subdomain (`*.aksiom.dk`): `CNAME`-record → `cname.vercel-dns.com`
- Tenant-adgang: `hundested.aksiom.dk` → serverer Hundested Bådeværft's tenant-sider

### Tenant-adgang fra Vercel preview-URL

Vercel preview-URL'er har ingen subdomæner, så tenant-routing virker ikke direkte. Brug i stedet:

```
https://<preview-url>/api/switch-tenant?tenant=hundested
```

Dette sætter en `tenant-override`-cookie og redirecter til forsiden.

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
  (tenant)/                  # Tenant-sider — subdomain-resolved i proxy
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
    switch-tenant/route.ts   # Dev-værktøj: sætter tenant-override-cookie
  components/
    SiteHeader.tsx           # Offentlig header med logo, navigation, burger-menu
    SiteFooter.tsx           # Offentlig footer med kontaktinfo
  globals.css                # @theme tokens + semantiske status-farver
  layout.tsx
lib/
  supabase/
    client.ts               # Browser-klient (singleton)
    server.ts               # Server-klient (cookie-baseret)
    middleware.ts           # Supabase-klient til proxy.ts (request-scoped, ikke Next.js-middleware)
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
  migrations/               # Nummereret SQL: 00001_init.sql … 00008_users_auth_id_nullable.sql
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
