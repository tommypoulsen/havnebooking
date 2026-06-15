# Arkitektur — Havnebooking

_Læs dette dokument ved alle backend-, database- og API-opgaver._

---

## Overblik

```
Browser (bådejer / havn-admin)
        │ HTTPS
        ▼
Next.js på Vercel (frontend + Server Actions + API Routes)
        │                    │
        ▼                    ▼
Supabase Pro          QuickPay / MobilePay
(PostgreSQL + Auth)   (betaling)
        │
Resend (email)
```

Ingen separate microservices. Al forretningslogik bor i Next.js Server Actions og service-funktioner i `/lib/utils/`.

---

## Multi-tenant arkitektur

### Subdomain-routing
Tenant resolves fra request-hostname i Next.js Proxy (`proxy.ts` — middleware er omdøbt i Next.js 16):

```
hundested.havnebooking.dk  →  tenant: "hundested"
nautisk.havnebooking.dk    →  tenant: "nautisk"
```

Middleware-flow:
1. Udtræk subdomain fra `request.headers.get('host')`
2. Slå tenant op i `tenants`-tabellen via `subdomain`-kolonnen
3. Inject `tenant_id` og `tenant.config` i request headers til downstream brug
4. Redirect til fejlside hvis subdomain ikke kendes

```typescript
// proxy.ts — skabelon
export async function resolveTenant(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const subdomain = host.split('.')[0]
  const supabase = createMiddlewareClient(request)
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, config')
    .eq('subdomain', subdomain)
    .eq('active', true)
    .single()
  return tenant  // null → redirect til fejlside
}
```

### Dataisolation via RLS
Alle tabeller har `tenant_id`-kolonne og Row Level Security aktiveret.
To helper-funktioner bruges i alle RLS-politikker (defineret i `public`-schema, ikke `auth`):

```sql
-- Henter tenant_id fra JWT app_metadata (sat ved login)
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Henter brugerens rolle fra JWT app_metadata
CREATE OR REPLACE FUNCTION current_user_role() RETURNS TEXT AS $$
  SELECT auth.jwt() -> 'app_metadata' ->> 'role'
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
```

Standard RLS-skabelon (bruges på alle tabeller):
```sql
ALTER TABLE {tabel} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON {tabel}
  USING (tenant_id = current_tenant_id());

CREATE POLICY "super_admin_all" ON {tabel}
  USING (current_user_role() = 'super_admin');
```

---

## Auth og roller

### Roller (i JWT `app_metadata`)
| Rolle | Adgang |
|-------|--------|
| `super_admin` | Alle tenants — sættes manuelt i Supabase dashboard |
| `admin` | Fuld adgang til én tenant (konfiguration, priser, bookinger) |
| `staff` | Kan se og administrere bookinger, ikke ændre konfiguration |
| `customer` | Egne bookinger og data — per-tenant konto |

### Login-flow (kunde)
1. Bådejer åbner `hundested.havnebooking.dk`
2. Middleware resolver tenant → `hundested`
3. Supabase Auth email+password (per-tenant scope)
4. Ved succesfuld login: sæt `app_metadata.tenant_id` og `app_metadata.role = 'customer'`
5. JWT sendes med alle efterfølgende requests — RLS filtrerer automatisk

### Kunde-konti er per-tenant
En bådejer hos Hundested har ikke automatisk adgang til andre tenants.
`users`-tabellen har `UNIQUE(tenant_id, email)` — samme email kan bruges hos flere tenants.

---

## Generaliserbar service-model

Systemet er **ikke** et "havne-system" — det er et **generisk booking- og inventory-system** der pt. bruges til havneydelser. Nye servicetyper tilføjes uden kodeændringer.

### De tre inventory-typer

| Type | Nuværende brug | Eksempler på fremtidige services |
|------|----------------|----------------------------------|
| `capacity` | Stativpladser | Servicebåse, parkeringspladser, opbevaringsrum |
| `timeslot` | Kranløft | Antifouling, motorservice, malerarbejde, vinterklargøring |
| `stock` | Stormstøtter | Udlån af udstyr, materialesalg |

### Data-drevet konfiguration via `services.config`

Domænespecifik adfærd konfigureres i `services.config` JSONB — ikke i kode.
Booking-wizarden er data-drevet og renderer formfelter baseret på `config.formFields`.

```json
{
  "formFields": [
    {
      "key": "boat_type",
      "type": "choice",
      "label": "Båd-type",
      "required": true,
      "options": [
        { "value": "sejlbaad", "label": "Sejlbåd" },
        { "value": "motorbaad", "label": "Motorbåd" }
      ]
    },
    {
      "key": "mast",
      "type": "choice",
      "label": "Er masten monteret?",
      "required": true,
      "dependsOn": { "field": "boat_type", "value": "sejlbaad" },
      "options": [
        { "value": "med_mast", "label": "Med mast" },
        { "value": "uden_mast", "label": "Uden mast" }
      ]
    }
  ],
  "requiresSizeCategory": true,
  "requiresTimeSlot": true,
  "addons": ["stormstøtter", "transport"]
}
```

Brugerens svar gemmes i `order_lines.attributes` JSONB:
```json
{ "boat_type": "sejlbaad", "mast": "med_mast" }
```

### Tilgængelighed

```typescript
// lib/utils/availability.ts
export function getAvailableCapacity(total: number, booked: number): number {
  return total - booked
}

export function isTimeSlotAvailable(slot: { capacity: number; booked_count: number }): boolean {
  return slot.booked_count < slot.capacity
}
```

Tilgængelighed kontrolleres i en DB-transaktion ved booking — ikke kun i UI — for at undgå race conditions.

---

## Booking-flow

```
1. Vælg service (liste hentes fra DB — data-drevet)
2. Udfyld formfelter fra services.config.formFields (data-drevet)
3. Systemet beregner pris via pricing_rules
4. Vælg timeslot (hvis type = timeslot) eller bekræft periode
5. Tilvalg fra services.config.addons
6. Kontaktoplysninger
7. Opsummering / ordre-review
8. Betaling via QuickPay
9. Webhook fra QuickPay → bekræft ordre → send mail via Resend
```

### Ordre-model
Én ordre (`orders`) kan indeholde flere linjer (`order_lines`).
Eksempel: kranløft + stativleje + stormstøtter = 1 ordre, 3 linjer.
Dette forenkler betaling og refundering markant.

---

## Betaling (QuickPay)

### Flow
```
1. Server Action opretter ordre (status: pending)
2. Server Action kalder QuickPay API → opretter payment → returnerer payment_link
3. Client redirecter til QuickPay hosted payment page
4. Bruger betaler
5. QuickPay sender webhook til /api/webhooks/quickpay
6. Webhook handler:
   a. Valider HMAC-signatur
   b. Tjek om provider_reference allerede er behandlet (idempotens)
   c. Opdater payment.status = 'captured'
   d. Opdater order.status = 'confirmed'
   e. Dekrementer time_slot.booked_count (i transaktion)
   f. Send bekræftelsesmail via Resend
```

### Webhook-idempotens
```typescript
// Tjek altid inden behandling:
const existing = await supabase
  .from('payments')
  .select('status')
  .eq('provider_reference', event.id)
  .single()

if (existing.data?.status === 'captured') return  // Allerede behandlet
```

### Refundering
Beregn refunderbart beløb via `cancellation_policies`-tabellen.
Initiér partial refund via QuickPay API.
Opret `refunds`-række ved succesfuld refundering.

---

## Prisberegning

Priser opbevares i `pricing_rules`-tabellen i **øre** (integer).
Prisberegning sker i `lib/utils/pricing.ts` — ren funktion uden side effects.

```typescript
// lib/utils/pricing.ts
export function calculateOrderTotal(
  lines: OrderLineInput[],
  rules: PricingRule[]
): { lines: PricedLine[]; totalOere: number } {
  // ...
}
```

Prisregel-opslag: `service_id + size_category_id + duration_type`.
Vis priser til brugere i kroner: `totalOere / 100` (undgå `toFixed` — brug `Intl.NumberFormat`).

---

## Farveskema-system

Hvert tenant kan vælge ét af fem foruddefinerede farveskemaer via admin → Indstillinger.

Et skema (`Palette` i `lib/utils/palettes.ts`) definerer syv CSS custom properties der tilsammen styrer hele websitets udseende — ikke kun accent-farven:

```typescript
type PaletteVars = {
  '--color-rust':         string  // accent / CTA-knapper / links
  '--color-rust-dark':    string  // accent hover
  '--color-rust-light':   string  // accent dæmpet
  '--color-charcoal':     string  // mørke flader: header, footer, admin-nav
  '--color-charcoal-mid': string  // mørk hover
  '--color-offwhite':     string  // sidebaggrund
  '--color-warm-gray':    string  // borders og skillelinjer
}
```

Properties injiceres som inline-styles på `#theme-root`-div'en i `(tenant)/layout.tsx` ved server-rendering. Når admin vælger et nyt skema, opdaterer `PalettePicker` variablerne direkte på DOM-elementet via `element.style.setProperty()` for øjeblikkelig feedback, mens Server Action gemmer valget til databasen.

Logo-upload sker direkte fra browseren via Supabase Storage (`logos`-bucket, public). Den offentlige URL gemmes i `tenant.config.logoUrl` og vises i `SiteHeader` og `SiteFooter`.

---

## Super-admin

Super-admin er en separat route group `(super-admin)/` med adgang kun for JWT-claim `role = super_admin`.

| Rute | Funktion |
|------|----------|
| `/tenants` | Oversigt over alle tenants |
| `/tenants/new` | Opret ny tenant (navn, subdomæne, kontaktinfo) |
| `/tenants/[id]` | Rediger tenant, aktivér/deaktivér, administrer brugere |

`/tenants/[id]` indeholder bruger-administration: opret admin/staff-bruger, rediger navn/email/rolle, slet bruger, nulstil adgangskode. Operationer anvender `createServiceClient()` (service role) da de rammer `supabase.auth.admin`-API'et.

Subdomain valideres med regex `^[a-z0-9-]+$` og `23505`-fejlkode fra Supabase bruges til at opdage duplikate subdomæner.

---

## Komponent-arkitektur

### Server Components (standard)
- Datahentning fra Supabase
- Layout og statisk indhold
- Sider der ikke kræver interaktivitet

### Client Components (`'use client'`)
- Booking-wizard (state machine)
- Formularer med validering
- Admin CRUD-paneler
- Real-time opdateringer (Supabase Realtime)

### Mønster: Server-wrapper + Client-interaktivitet
```tsx
// app/(tenant)/book/page.tsx — Server Component
export default async function BookPage() {
  const tenant = await getCurrentTenant()  // Server-side
  const services = await getServices(tenant.id)  // Server-side
  return <BookingFlow services={services} tenantConfig={tenant.config} />
}

// app/(tenant)/book/BookingFlow.tsx — Client Component
'use client'
export function BookingFlow({ services, tenantConfig }: Props) {
  // State machine her
}
```

---

## Fejlhåndtering

Server-side returtype:
```typescript
type Result<T> = { data: T; error?: never } | { data?: never; error: string }
```

Eksempel:
```typescript
export async function createBooking(input: BookingInput): Promise<Result<Order>> {
  const validated = BookingInputSchema.safeParse(input)
  if (!validated.success) return { error: 'Ugyldige oplysninger' }
  // ...
  return { data: order }
}
```

Aldrig `throw` fra forretningslogik — returner `{ error: string }` i stedet.
Aldrig eksponer stack traces eller Supabase-fejlkoder til browseren.

---

## E-mail (Resend)

Sendes ved:
- Booking bekræftet
- Booking annulleret (inkl. refunderingsinfo)
- Påmindelser (30 dage inden sæsonstart — fremtidig feature)

Templates gemmes som React Email komponenter i `/emails/`.
Afsenderdomæne per tenant konfigureres i `tenants.config`.

---

## Test-strategi

### Lag og ansvar

| Lag | Framework | Hvad testes |
|-----|-----------|-------------|
| Unit | Vitest | `pricing.ts`, `availability.ts`, `cancellation.ts` — rene funktioner, ingen I/O |
| Integration | Vitest | Server Actions og webhook handlers mod rigtig Supabase test-tenant |
| E2e | Playwright | Fulde brugerflows i browser — **kræves inden release** |

### E2e dækning (Playwright)
Minimum inden release:
- Booking-flow: happy path (vælg service → betal → bekræftelse)
- Booking-flow: fuldt timeslot viser "Optaget"
- Booking-flow: afbestilling og refundering
- Admin: opret/rediger/slet tidsvinduer
- Admin: rediger kapacitet i lager
- Admin: upload logo og skift farveskema
- Super-admin: opret og rediger tenant
- Auth: login, logout, adgangskontrol (rolle-baseret)

Playwright kører mod lokal dev-server med `supabase/seed.sql` test-tenant.
Betalingsflow testes med QuickPay test-mode (ingen rigtige kortdata).

### Ingen mocks af Supabase
Integration- og e2e-tests bruger rigtig test-tenant — aldrig mock af Supabase-klienten.
Seed-data i `supabase/seed.sql` nulstilles mellem test-suites.

---

## Skalerbarhed og fremtid

**Simplicitet som standard:** Trafikvolumen er lav og sæsonbestemt. Ingen Redis, ingen job-queue, ingen ekstern cache.

**Ny tenant:** Opret row i `tenants`, sæt subdomain, konfigurér services og priser i admin-panel.
**Ny servicetype:** Opret service med korrekt `type`, konfigurér `config.formFields` i admin — ingen kodeændringer.
**Ny tenant-tema:** Tilføj en ny nøgle i `lib/utils/palettes.ts` med et komplet sæt af 7 CSS custom properties. Sæt `config.theme` til den nye nøgle i tenant-row — ingen `globals.css`-ændringer nødvendigt.
**MobilePay:** Tilgås via QuickPay's MobilePay-integration — ingen separat integration nødvendig.
**Internationale markeder:** Kræver i18n-lag og multi-currency — ikke i scope p.t.
