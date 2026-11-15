# Decisions and approval register

- User's controlling V3 brief freezes design and requires production approval (sections43/46). This implementation remains local staging. No deployment request or approval has been implied by “continue”.
- Keep existing domain, private owner audience, Avenline Stripe account, prices, product records and shipping/tax configuration unchanged.
- Keep payments disabled. No genuine sandbox session, real-money order, refund or provider configuration change was attempted.
- Approved minimal accessibility corrections: two grey text shades slightly darkened for measured contrast failures; accessible names now include visible text; reduced-motion preference honoured. Existing layout/fonts/logo/illustrations preserved.
- Reviews: V3 explicitly prohibits invented reviews, superseding the older preview request. Removed fictional testimonials in staging and retained the page's existing component style.
- Product URLs: stable internal IDs, existing UI classes and modal selector; no schema migration. Canonicals use the existing trusted origin. No Product/Offer/review schema until factual eligibility is established.
- Private staging is noindex/nofollow, robots disallowall, empty sitemap. This intentionally limits Lighthouse SEO scores. Robots is not an access control; Sites privacy remains necessary. Public index policy requires a reviewed launch decision.
- No trackers, paid providers, accounts, emails or external customer messages added/sent.

## Facts needed before transactional launch

1. Legal seller identity, address, genuine business contact details, privacy/retention and lawful returns/cancellation process.
2. Per-product actual maker/model, condition, authenticity/provenance, contents, specifications and electrical/cosmetic compliance where relevant. Do not infer from illustration or a brand-like title.
3. Fulfilment origin, shipping destinations/costs, dispatch process and evidence for delivery estimate.
4. Authoritative stock model and reservation/expiry/decrement rules; then durable checkout and refund reconciliation.
5. Approved isolated Stripe sandbox and test credentials through secure runtime configuration, followed by real sandbox success/decline/retry/refund tests.
6. Supported D1/R2 backup/export and isolated restore rehearsal before any future migration; no export tool or production restore was verified here.
7. Independent security/functional review and final release approval after blockers are resolved.

Read-only live DB observation: DB binding; catalogue_products, orders, product_media, support_messages, support_presence, support_threads. Catalogue pagination returned11 published overrides on15Nov, including2 custom products. Several large JSON cells were truncated by connector. Six complete records inspected lacked condition; custom jacket remains categorised Fragrance. No rows changed, no customer/message/order contents read. Source fixture9 products is not asserted to equal the current live catalogue. Live illustrations remain R2 references; local fixture screenshots cannot certify every current live listing.
