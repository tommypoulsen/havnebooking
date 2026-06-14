# ADR-006: Monolitisk Next.js API — ingen microservices

Status: Accepteret

## Kontekst
Al backend-logik kunne placeres i:
1. Next.js Server Actions + Route Handlers (monolitisk)
2. Separate backend-tjenester (microservices / BFF-lag)

## Beslutning
Al forretningslogik bor i Next.js Server Actions og service-funktioner i `/lib/utils/`.
Route Handlers bruges KUN til webhooks og tredjeparts-callbacks (QuickPay, Resend).

## Rationale
**Skala**: Trafikvolumen for havne og bådeværfter er lav og sæsonbestemt. Microservices er over-engineering på dette stadie.
**Enkelhed**: Ét codebase, ét deployment, ingen inter-service kommunikation.
**Vedligehold**: En lille organisation kan lettere vedligeholde én tjeneste.
**Vercel**: Serverless functions på Vercel skalerer automatisk ved behovs-spidser (fx sæsonopstart).
**Omskrivbarhed**: Hvis skala nødvendiggør det, kan specifikke Server Actions udtrækkes til separate tjenester — men vi afventer konkret behov.

## Konsekvenser
- Server Actions er primær mutation-mekanisme (ikke REST API-kald fra client)
- Forretningslogik i `/lib/utils/` er rene funktioner — testbare uden HTTP-lag
- Ingen GraphQL, ingen tRPC — direkte TypeScript server-til-client via Server Actions og RSC props
- Route Handlers (`app/api/`) bruges kun til: QuickPay webhooks, eventuelt fremtidig Supabase Edge Function-proxy
