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
```

Alle afhængigheder er registreret i `package.json` — ingen manuel installation nødvendig.

### 2. Konfigurér miljøvariable

```bash
cp .env.example .env.local
```

Åbn `.env.local` og udfyld alle værdier. Se kommentarer i filen for hvor du finder dem.

### 3. Start Supabase lokalt

```bash
npx supabase start          # starter lokal Supabase-instans (Docker kræves)
npx supabase db push        # kør migrationer mod lokal instans
npx supabase db seed        # indlæs testdata (supabase/seed.sql)
```

Lokale URL og anon-nøgle udskrives af `supabase start` — brug dem i `.env.local` til lokal udvikling.

### 4. Start dev-server

```bash
npm run dev
```

Åbn [http://localhost:3000](http://localhost:3000).

For tenant-routing lokalt: tilføj til `/etc/hosts` (eller Windows hosts-fil):
```
127.0.0.1  hundested.localhost
```
og åbn [http://hundested.localhost:3000](http://hundested.localhost:3000).

---

## Daglige kommandoer

```bash
npm run dev                         # dev-server
npm test                            # Vitest (unit + integration)
npx playwright test                 # e2e tests (kræver kørende dev-server)
npm run build                       # produktionsbuild + TypeScript-tjek
npm run lint                        # ESLint
npx tsc --noEmit                    # TypeScript type-tjek uden build
npx supabase db push                # kør nye migrationer
npx supabase gen types typescript \
  --local > lib/types/database.ts   # regenerér DB-typer efter schema-ændringer
```

---

## Vigtigste dokumentation

| Fil | Indhold |
|-----|---------|
| `CLAUDE.md` | Arkitekturregler og konventioner (læs dette først) |
| `docs/architecture.md` | Systemdesign og mønstre |
| `docs/database-schema.md` | Fuld SQL-schema med RLS-politikker |
| `docs/code-quality.md` | Review-kriterier og selvrevisions-checkliste |
| `docs/adr/` | Architecture Decision Records |
| `prototype/` | Reference-prototype — redigér ikke |

---

## Projektstruktur

```
app/
  (auth)/              # Login, registrering
  (tenant)/            # Tenant-sider — layout resolver tenant fra subdomain
    book/              # Booking-flow (slutbruger)
    admin/             # Admin-panel (role: admin | staff)
  (super-admin)/       # Super admin
  api/webhooks/        # QuickPay callback
lib/
  supabase/            # Supabase-klienter (browser, server, middleware)
  types/               # Autogenererede DB-typer + domænetyper
  utils/               # Ren forretningslogik (pricing, availability, cancellation)
supabase/
  migrations/          # SQL-migrationer (aldrig ændr eksisterende)
  seed.sql             # Testdata
tests/
  unit/                # Vitest unit-tests
  integration/         # Vitest integration-tests (mod test-tenant)
  e2e/                 # Playwright e2e
prototype/             # Reference-prototype (redigér ikke)
docs/                  # Arkitektur og ADR-dokumentation
```
