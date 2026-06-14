# ADR-005: React Server Components som standard

Status: Accepteret

## Kontekst
Next.js App Router understøtter to komponenttyper:
- Server Components (RSC): renderes på serveren, kan fetche data direkte, ingen bundle-størrelse
- Client Components (`'use client'`): renderes i browseren, understøtter state og events

## Beslutning
Alle komponenter er Server Components medmindre de eksplicit kræver `'use client'`.
`'use client'` tilføjes kun ved: state (`useState`), events (`onClick` etc.), browser-API'er eller tredjeparts-biblioteker der kræver det.

## Rationale
**Datahentning**: Server Components kan fetche fra Supabase direkte — ingen API-lag eller fetch-waterfalls.
**Bundle-størrelse**: Server Component-kode sendes ikke til browseren — reducerer initial load.
**Auth/tenant**: Server Components har adgang til cookies og headers — kan resolve tenant og auth server-side uden at eksponere det for klienten.
**Sikkerhed**: Supabase-forespørgsler og environment variables (API-nøgler) er aldrig synlige i browseren.

## Mønster
```
page.tsx (Server) → henter data → sender som props til
BookingFlow.tsx ('use client') → håndterer interaktiv state
```

## Konsekvenser
- Booking-wizard og admin CRUD-paneler er Client Components (stateful interaktivitet)
- Data til Client Components serialiseres og sendes som props fra Server Components — ingen Supabase-kald i Client Components
- Real-time opdateringer (Supabase Realtime) sker i Client Components
- Formularer: Server Actions til mutation, Client Components til validering og UX
