# ADR-001: Multi-tenant dataisolation via PostgreSQL Row Level Security

Status: Accepteret

## Kontekst
Systemet skal isolere data fuldstændigt på tværs af tenants (havne). To strategier var i spil:
1. Application-level filtering: `WHERE tenant_id = $currentTenantId` i alle forespørgsler
2. PostgreSQL Row Level Security: databasen håndhæver isolation automatisk

## Beslutning
Vi bruger Supabase PostgreSQL med RLS aktiveret på alle tabeller.
`tenant_id`-kolonnen er mandatory på alle tabeller.
To helper-funktioner læser tenant fra JWT: `auth.tenant_id()` og `auth.user_role()`.

## Rationale
RLS håndhæves af databasen — selv buggy application-kode eller en glemt WHERE-klausul kan ikke lække cross-tenant data.
Application-level filtering kræver at ALLE forespørgsler husker filtret — én fejl eksponerer data.
Med RLS er det umuligt for applikationskoden at omgå isolationen (undtagen ved brug af service_role-nøglen, som derfor aldrig bruges i browser/client-kode).

## Konsekvenser
- Alle tabeller skal have `tenant_id`-kolonne og RLS aktiveret
- RLS-politikker skal inkluderes i samme migrationsfil som CREATE TABLE
- `service_role`-nøglen bruges KUN i betroede server-kontekster (fx super admin Server Actions) — aldrig i browser
- Supabase Auth JWT skal indeholde `app_metadata.tenant_id` og `app_metadata.role` for at RLS kan fungere
