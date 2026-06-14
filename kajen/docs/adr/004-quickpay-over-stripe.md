# ADR-004: QuickPay over Stripe som payment gateway

Status: Accepteret

## Kontekst
To realistiske valg til betalingsgateway for det danske marked:
1. Stripe — internationalt, fremragende API, stor community
2. QuickPay — dansk, direkte MobilePay-integration, dansk support

## Beslutning
QuickPay som primær payment gateway. MobilePay tilgås via QuickPay's integration.

## Rationale
**MobilePay**: Dominerende betalingsmetode i Danmark. QuickPay understøtter MobilePay direkte via deres API. Med Stripe er MobilePay-integration mere kompleks og kræver separat aftale med MobilePay.
**Dansk support og compliance**: Havnene er danske virksomheder — dansk-sproget support og dansk CVR-integration er værdifuldt.
**Partial refunds**: QuickPay understøtter partial refunds via API, hvilket er nødvendigt for vores refunderingslogik.
**Acquirer-frihed**: QuickPay virker med multiple acquirers (Clearhaus, Nets/Worldline, Bambora) — giver forhandlingsfleksibilitet.

## Konsekvenser
- Stripe-kode må aldrig introduceres i projektet
- QuickPay API-nøgler opbevares i Vercel environment variables (`QUICKPAY_API_KEY`, `QUICKPAY_PRIVATE_KEY`)
- Webhook-validering via HMAC-SHA256 signatur (QuickPay's `X-Quickpay-Checksum-SHA256` header)
- Betalingsinfrastruktur: tre lag: QuickPay (gateway) + acquirer (Clearhaus anbefales) + MobilePay (separat aftale)
- Ved integration: oprettes payment → redirect til QuickPay hosted page → webhook ved success/failure
