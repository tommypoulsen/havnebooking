# Kodekvalitet og review — Havnebooking

_Reference ved selvrevision (CLAUDE.md) og ved `/code-review`. Opdateres når nye mønstre identificeres._

---

## 1. Hurtig selvrevision — kræves inden enhver opgave markeres som done

Kør igennem denne liste. Ét "nej" = ret det inden du rapporterer færdig.

**Arkitektur**
- [ ] Ingen `tenant_id` hentet fra client-input — resolved server-side fra JWT
- [ ] Ingen `service_role`-nøgle brugt udenfor server-kontekst
- [ ] Ingen hardkodet domæne-logik (båd/havn/kranløft) i wizard eller API — drives af `services.config`
- [ ] `'use client'` kun tilføjet ved reel interaktivitet (state/events/browser-API)

**Kode-kvalitet**
- [ ] Ingen `any`-typer; ingen `as`-casts uden forklaring i kommentar
- [ ] Priser i øre (integer), aldrig float eller decimaltal
- [ ] Farver via `@theme`-tokens, aldrig hardkodede hex/rgb
- [ ] Zod-validering på alle API-grænser og webhook-payloads

**Simplicitet**
- [ ] Er dette den simpleste løsning der virker? Ingen for-tidlig abstraktion.
- [ ] Er der kode der duplikeres fra en anden fil — bør den udtrækkes til `lib/utils/`?
- [ ] Er alle TODOs/workarounds enten løst nu eller dokumenteret med konkret årsag til at vente?

---

## 2. Arkitektur-alignment — ved dybere review

### Multi-tenant og RLS
Ændringen må ikke:
- Filtrere på `tenant_id` i applikationskode i stedet for at lade RLS gøre det
- Åbne en code-path der kan returnere data på tværs af tenants
- Bruge `service_role` i et flow der kan nås fra browseren

### Service-model og generaliserbarhed
Ændringen må ikke:
- Hardkode `"sejlbåd"`, `"kranløft"`, `"stativ"` eller andre domæne-specifikke værdier i generiske komponenter
- Tilføje ny betinget logik i booking-wizarden baseret på service-navn/type — brug `services.config`
- Antage at alle services har de samme formfelter

### Komponent-hierarki
- Server Components henter data — Client Components render interaktivitet
- Ingen Supabase-kald i Client Components
- Data flyder ned som props, aldrig opad via callbacks til Server-lag

### API og fejlhåndtering
- Server Actions returnerer `{ data: T } | { error: string }` — aldrig exceptions
- Webhooks tjekker `provider_reference` for idempotens inden behandling
- Fejlbeskeder eksponeret til browser er danske og brugervenlige — aldrig stack traces

---

## 3. Teknisk gæld-indikatorer — røde flag

Stop og refaktorér hvis du ser disse mønstre:

| Mønster | Korrekt handling |
|---------|-----------------|
| Prisberegning inline i en komponent | Flyt til `lib/utils/pricing.ts` |
| Tilgængeligheds-tjek inline i en komponent | Flyt til `lib/utils/availability.ts` |
| Identisk query-logik i to filer | Udtræk til shared server-side hjælpefunktion |
| `// TODO: fix later` uden ticket/årsag | Løs nu eller dokumentér konkret præmis for at vente |
| Magic strings/numbers (fx `'bekræftet'`, `893`) | Brug TypeScript const/enum eller hent fra DB |
| Komponent der gør mere end ét tydeligt ting | Split i to komponenter |
| `services.config` ignoreret — hardkodet flow | Tilpas til data-drevet mønster |
| Kopi-pastet blok fra en anden fil | Udtræk og genbrugsfunktion |
| Supabase-query i en Client Component | Flyt til Server Component eller Server Action |

---

## 4. Simplificitets-principper

Foretrækkes altid:
- **Færre filer** over mange små (sammenhængende logik hører sammen)
- **Direkte** over abstrakt — abstraktion kun hvis den bruges 3+ steder
- **Server-side** over client-side datahentning
- **Ingen ekstern cache** medmindre en konkret målbar ydelses-problem foreligger
- **Ingen ny dependency** uden at evaluere alternativet (native API, Supabase RPC, etc.)
- **Ingen feature flag / backwards-compat shim** når du bare kan ændre koden

---

## 5. Hvornår `/code-review` skal køres

| Situation | Kommando | Begrundelse |
|-----------|----------|-------------|
| Feature implementeret | `/code-review` | Fang bugs og simplificeringer |
| Inden PR / deploy | `/code-review` | Sikre koden er klar |
| Ny arkitektur-komponent (middleware, webhook, auth) | `/code-review ultra` | Dyb analyse af sikkerhed og korrekthed |
| Mistanke om arkitektur-drift | `/code-review ultra` | Multi-agent krydstjek mod docs/ |
| Månedlig vedligehold | `/code-review ultra` | Opdag akkumuleret teknisk gæld |
| Bug-fix der viser sig mere kompleks end forventet | `/code-review` | Sikre fix ikke introducerer ny gæld |

`/code-review ultra` bruger cloud-agenter til dybdegående analyse. Koster ekstra tid, men er nødvendig for sikkerhedskritisk kode (auth, betaling, RLS-politikker).

---

## 6. Periodevis vedligehold

Kør disse tjek månedligt eller inden større releases:

```bash
npm run build          # Fanger TypeScript-fejl og build-problemer
npx tsc --noEmit       # TypeScript type-check uden build-artefakter
npm run lint           # ESLint — stil og potentielle fejl
npx playwright test    # E2e — sikrer ingen regressioner i brugerflows
```

Gennemgå desuden:
- `supabase/migrations/` — er alle tabeller stadig RLS-beskyttet?
- `lib/utils/` — er der forretningslogik der er "sluppet ud" i komponenter?
- `app/(tenant)/book/` — er booking-flowet stadig data-drevet via `services.config`?
