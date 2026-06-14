# ADR-003: Subdomain-baseret tenant-routing

Status: Accepteret

## Kontekst
To tilgange til at identificere hvilken tenant en request tilhører:
1. Path-baseret: `havnebooking.dk/hundested/book`
2. Subdomain-baseret: `hundested.havnebooking.dk/book`

## Beslutning
Subdomain-baseret routing. Tenant resolves i Next.js middleware fra `request.headers.get('host')`.
Konfiguration: `hundested.havnebooking.dk → tenant: "hundested"`.

## Rationale
Renere URL-struktur — `/book` frem for `/hundested/book`.
Industristandard for SaaS multi-tenancy (Vercel, Linear, Notion osv.).
Bedre white-label muligheder: en tenant kan pege eget domæne (`booking.hundested-baadevaerft.dk`) til systemet via CNAME.
Routerne i `app/` behøver ikke tenant-prefix — koden er den samme for alle tenants.

## Konsekvenser
- Next.js middleware resolves tenant FØR enhver route handler kører
- Tenant-info injiceres i request headers og er tilgængeligt i Server Components via `headers()`
- Lokalt udviklingsmiljø: brug `localhost:3000` med en fast default-tenant, eller `.env.local` override
- Vercel: wildcard subdomain (`*.havnebooking.dk`) konfigureres i dashboard
- Custom domains: håndteres via Vercel's custom domain feature + DNS CNAME
