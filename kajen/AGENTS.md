<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Agent-specifikke regler

## Før du skriver kode
1. Læs `CLAUDE.md` i sin helhed
2. Ved backend/DB-opgaver: læs også `docs/architecture.md` og `docs/database-schema.md`
3. Tjek at filen du redigerer IKKE er under `/prototype/` — prototype-kode redigeres aldrig
4. Gennemse eksisterende typer i `lib/types/domain.ts` inden du opretter nye

## Subagent-brug
- **Explore**: find filer og symboler på tværs af kodebasen
- **Plan**: arkitekturbeslutninger og implementeringsplaner inden kodestart
- **code-review**: efter implementering — fang fejl og afvigelser fra konventioner

## Kode-generering
- TypeScript strict som standard — ingen `any`, ingen `as` casts uden forklaring
- Server Components som standard — dokumentér årsagen hvis du tilføjer `'use client'`
- Tailwind v4 `@theme`-tokens (se `app/globals.css`) — aldrig hardkodede farver
- Prisberegninger hører hjemme i `lib/utils/pricing.ts` — aldrig inline i komponenter
- Tenant-id hentes altid fra server-side auth-kontekst — aldrig fra client-input

## Database-ændringer
- Opret altid ny migrationsfil (aldrig ændr eksisterende)
- Inkludér RLS-politik i samme migrationsfil som `CREATE TABLE`
- Priser gemmes i øre (integer) — aldrig decimaltal
- Brug `auth.tenant_id()` og `auth.user_role()` helper-funktionerne i RLS-politikker

## Betaling
- KUN QuickPay — Stripe eksisterer ikke i dette projekt
- QuickPay-webhooks skal valideres med HMAC-signatur inden behandling
- Tjek altid om `provider_reference` allerede er behandlet (idempotens)
- Log altid `provider_reference` ved betalingsfejl

## Test
- Unit tests for ren forretningslogik (pricing, availability, cancellation)
- Integration tests mod rigtig Supabase test-tenant — ingen mocks
- Kør `npm test` og verificér grønt inden du rapporterer en opgave som færdig
