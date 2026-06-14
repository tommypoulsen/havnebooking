# ADR-002: Brugerkonti er per-tenant

Status: Accepteret

## Kontekst
Spørgsmål: skal en bådejer have én global konto på tværs af alle havne, eller separate konti per havn?

## Beslutning
Brugerkonti er per-tenant. `users`-tabellen har `UNIQUE(tenant_id, email)`.
En bådejer hos Hundested har ikke automatisk adgang til en anden havn.

## Rationale
**GDPR**: Hver tenant (havn) er dataansvarlig for sine egne slutbrugere. Med globale konti ville vi skulle håndtere komplekse databehandleraftaler og adgangskontrol på tværs af tenants.
Med per-tenant konti er ansvarsfordelingen klar: havnen er dataansvarlig for sine bådejere, vi er databehandler.
**Enkelhed**: Ingen cross-tenant lookup, ingen global brugerprofil at vedligeholde.
**Sikkerhed**: En kompromitteret konto hos én tenant giver ikke adgang til andre tenants' data.

## Konsekvenser
- Bådejere skal oprette konto specifikt hos den havn de bruger
- Samme email-adresse kan bruges hos flere havne (separate rækker, separate Supabase Auth-brugere)
- Databehandleraftale underskrives per tenant ved oprettelse
- Fremtidig "bring your own account"-feature kræver re-evaluering af denne beslutning
