@AGENTS.md

# Havnebooking — Instruktioner til Claude Code

## Projekt
Multi-tenant SaaS booking-platform for danske havne og bådeværfter.
B2B2C: havnen er tenant/kunde, bådejere er slutbrugere.
Første kunde: Hundested Bådeværft.
Prototype (reference, redigér ikke): `/prototype/`
Produktionskode: `/app/`, `/lib/`, `/supabase/`, `/tests/`

---

## Stack

| Lag | Teknologi | Note |
|-----|-----------|------|
| Framework | Next.js 16 App Router | LÆS `node_modules/next/dist/docs/` FØR du skriver Next.js-kode |
| Runtime | React 19 | Server Components som standard |
| Sprog | TypeScript strict | Ingen `any` |
| Styling | Tailwind CSS v4 | Kun `@theme`-tokens — aldrig hardkodede farver |
| Database | PostgreSQL (Supabase) | RLS aktiveret på alle tabeller |
| Auth | Supabase Auth | JWT-roller via `app_metadata` custom claims |
| Betaling | QuickPay + MobilePay | IKKE Stripe |
| Email | Resend | Transaktionel (bekræftelse, kvittering, påmindelser) |
| Validering | Zod | Alle API-grænser og webhook-payloads |
| Test (unit/int) | Vitest | Unit + integration |
| Test (e2e) | Playwright | Kræves inden release |
| Hosting | Vercel | |

---

## Mappestruktur

```
app/
  (auth)/              # Login, register — ingen tenant-layout
  (tenant)/            # Tenant-sider — subdomain resolved i middleware
    layout.tsx         # Loader tenant, injicerer farveskema (#theme-root), SiteHeader/SiteFooter
    page.tsx           # Forside
    priser/            # Prisoversigt
    kontakt/           # Kontaktside
    book/              # Booking-flow (slutbruger)
    admin/             # Tenant-admin panel (role: admin | staff)
      timeslots/       # Opret/slet tidspunkter
      bookings/        # Ordreliste med statusfilter
      pricing/         # Prisniveauer (vises/gemmes i kr)
      lager/           # Kapacitetsstyring (capacity_inventory)
      settings/        # Logo-upload + farveskema-vælger
  (super-admin)/       # Super admin (JWT claim: role = super_admin)
    tenants/           # CRUD — liste, opret, rediger, aktivér/deaktivér
  api/
    webhooks/
      quickpay/route.ts  # QuickPay callback
  components/
    SiteHeader.tsx     # Offentlig header (logo eller tekst, burger-menu)
    SiteFooter.tsx     # Offentlig footer med kontaktinfo
  globals.css          # @theme tokens + semantiske status-farver (success/danger)
  layout.tsx
lib/
  supabase/
    client.ts          # Browser Supabase client (singleton)
    server.ts          # Server Supabase client (cookie-baseret)
    middleware.ts      # Middleware Supabase client
    actions.ts         # login / logout server actions
  types/
    database.ts        # Autogenereret fra Supabase — redigér IKKE manuelt
    domain.ts          # Domænetyper (Tenant, Service, Order, …)
  utils/
    tenant.ts          # getTenant() med React.cache() deduplication
    palettes.ts        # 5 farveskemaer — hvert med 7 CSS custom properties
    pricing.ts         # Prisberegning — ren funktion, ingen side effects
    availability.ts    # Tilgængelighed — ren funktion
    cancellation.ts    # Refunderingslogik — ren funktion
supabase/
  migrations/          # Nummereret SQL: 00001_init.sql … 00005_storage_logos.sql
  seed.sql             # Testdata inkl. demo-tidspunkter for Kranløft
tests/
  unit/                # Vitest unit-tests (pricing, availability, cancellation)
  integration/         # API/webhook tests mod rigtig Supabase test-tenant
  e2e/                 # Playwright e2e — kræves inden release
prototype/             # REDIGÉR IKKE — reference-prototype (ingen package.json)
docs/
  architecture.md      # Arkitektur og mønstre — læs ved backend/DB-opgaver
  database-schema.md   # Fuld SQL + RLS — læs ved migrationer og forespørgsler
  code-quality.md      # Review-kriterier og selvrevisions-checkliste
  adr/                 # Architecture Decision Records
```

---

## Kritiske regler

1. **Tenant-isolation** — Brug aldrig `service_role`-nøglen i browser- eller client-kode. RLS er den eneste lås.
2. **Tenant-id** — Resolve altid `tenant_id` server-side fra JWT (`auth.tenant_id()`). Stol aldrig på client-sendt `tenant_id`.
3. **Server Components** — Standard for alle komponenter. Tilføj `'use client'` KUN ved state, events eller browser-API'er.
4. **Betaling** — KUN QuickPay. Stripe eksisterer ikke i dette projekt.
5. **Kortdata** — Gem aldrig betalingskortdata. QuickPay er PCI-compliant og håndterer det.
6. **Typer** — Ingen `any`. Brug Zod til validering ved alle ydre grænser.
7. **Farver** — Altid `@theme`-tokens. Aldrig hardkodede hex/rgb-værdier eller Tailwind-standardfarver (fx `bg-green-100`). Brug semantiske tokens til status: `text-success`, `bg-success-bg`, `text-danger`, `bg-danger-bg` (defineret i `globals.css`). Farveskemaer defineres i `lib/utils/palettes.ts` — tilføj ikke nye farveskemaer i `globals.css`.
8. **Priser** — Opbevar altid priser i **øre** (integer) for at undgå floating point.
9. **Prototype** — `/prototype/` er reference. Redigér den ikke; kopier ikke blindt fra den.
10. **Migrationer** — Aldrig ændr eksisterende migrationsfiler. Tilføj altid en ny fil.
11. **Locale** — Kun det danske marked p.t. Brug `da-DK` til al dato- og talformatering (`Intl.NumberFormat`, `Intl.DateTimeFormat`). Ingen i18n-lag.
12. **Service-generaliserbarhed** — Servicerne er generiske (`capacity` / `timeslot` / `stock`). Design aldrig UI eller logik hardkodet til "båd" eller "havn" — domænespecifik adfærd konfigureres via `services.config` JSONB.
13. **Simplicitet** — Trafikvolumen er lav. Ingen Redis, ingen job-queue, ingen ekstern cache. Foretrækkes enkle løsninger.

---

## Database-konventioner (resumé — se `docs/database-schema.md` for fuld schema)

Alle tabeller har:
```sql
id         UUID PRIMARY KEY DEFAULT gen_random_uuid()
tenant_id  UUID NOT NULL REFERENCES tenants(id)
created_at TIMESTAMPTZ DEFAULT NOW()
```
Mutable tabeller har desuden `updated_at TIMESTAMPTZ` (via trigger `set_updated_at()`).

RLS-skabelon per tabel:
```sql
ALTER TABLE {tabel} ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON {tabel}
  USING (tenant_id = auth.tenant_id());
CREATE POLICY "super_admin_all" ON {tabel}
  USING (auth.user_role() = 'super_admin');
```

---

## Komponent-konventioner

- Filnavne: PascalCase for komponenter, kebab-case for routes og utility-filer
- Ingen default exports undtagen Next.js `page.tsx` / `layout.tsx` / `error.tsx` / `loading.tsx` / `middleware.ts`
- Props: flade og eksplicitte typer
- Ingen prop drilling > 2 niveauer — brug composition eller React Context
- `React.cache()` til dyre gentagende server-side kald i samme request

---

## API / Server Actions

- Route handlers KUN til webhooks og tredjeparts-callbacks
- Al forretningslogik → Server Actions eller service-funktioner i `/lib/utils/`
- Returtype: `{ data: T } | { error: string }` — kast aldrig HTTP-exceptions fra forretningslogik
- Valider auth + tenant FØR enhver DB-operation
- QuickPay-webhooks: tjek altid om `provider_reference` allerede er behandlet (idempotens)

---

## Test-konventioner

- Unit: `tests/unit/{modul}.test.ts` — ren forretningslogik, ingen DB-kald
- Integration: `tests/integration/{område}.test.ts` — mod rigtig Supabase test-tenant, ingen mocks
- E2e: `tests/e2e/{flow}.spec.ts` — Playwright mod lokal dev-server + test-tenant. **Kræves inden release.** Dækker booking-flow (happy path + fejlscenarier), admin CRUD og betalingsflow (mock QuickPay).
- Prioritér dækning: `pricing.ts`, `availability.ts`, `cancellation.ts`, QuickPay webhook handler, fuld booking-wizard
- Kør: `npm test` (Vitest) · `npx playwright test` (e2e)

---

## Selvrevision — obligatorisk inden enhver opgave markeres som done

Kør hurtig-checklisten fra `docs/code-quality.md` sektion 1 inden du skriver "done" eller "færdig":

- **Tenant**: ingen client-sendt `tenant_id`; ingen `service_role` udenfor server
- **Generisk**: ingen domæne-hardkodning — `services.config` driver adfærd
- **Server Components**: `'use client'` kun ved reel interaktivitet
- **Typer**: ingen `any`; Zod ved alle API-grænser
- **Priser**: øre-integers; farver: `@theme`-tokens
- **Simplicitet**: simpleste løsning? ingen duplikering? ingen ubehandlet TODO?

Fuld checkliste og røde flag: `docs/code-quality.md`
Hvornår `/code-review` og `/code-review ultra` skal køres: `docs/code-quality.md` sektion 5

---

## Fejlhåndtering

- Server: log fejlen server-side, returner `{ error: "brugervenlig dansk besked" }` til client
- Client: React error boundaries + danske fejlbeskeder
- Aldrig eksponer stack traces eller interne fejldetaljer til browseren
- Betalingsfejl: log altid `provider_reference` (QuickPay payment ID)

---

## Nyttige kommandoer

```bash
npm run dev                         # Start dev-server (localhost:3000)
npm test                            # Kør Vitest (unit + integration)
npx playwright test                 # Kør e2e tests
npm run build                       # Produktionsbuild (check for TS-fejl)
npx supabase db push                # Kør pending migrationer
npx supabase gen types typescript \
  --local > lib/types/database.ts   # Regenerér DB-typer
```

---

## Hvad du IKKE må

- Bruge Stripe
- Bruge `service_role`-nøgle i browser- eller client-kode
- Gemme betalingskortdata
- Tilføje `'use client'` uden årsag
- Stole på client-sendt `tenant_id`
- Redigere `lib/types/database.ts` manuelt
- Redigere filer under `/prototype/`
- Bruge `any`-typer
- Hardkode farver (brug altid `@theme`-tokens)
- Ændre eksisterende migrationsfiler
- Designe services, UI eller logik specifikt til "båd" eller "havn" — hold det generisk
