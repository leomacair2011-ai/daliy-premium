# Architecture inventory and routing contract

Evidence date: 15 November 2026 (Europe/London). Author: independent specialist pass, roles 02 Systems Architect and 13 SRE. Baseline revision: `2c1f9e887f49e85a726c70214afc2e296d66530a`. Source was clean when this inspection began. This report is a source-backed audit; it does not assert that production secrets, records, or provider configuration were independently inspected.

## Observed architecture

| Layer | Observed source and behaviour |
|---|---|
| Front end | Plain HTML, CSS and ES modules; no React/Vue framework. `src/app.js`, `cart.mjs`, `support.js`, `admin.js`. Native dialogs, client-rendered catalogue and localStorage bag/favourites. |
| Build | `scripts/build.mjs` validates base catalogue, copies assets to ignored `.openai/local/public`, builds ancillary pages, hashes JS/CSS URLs, embeds all assets as base64 in an esbuild Worker. Baseline generated Worker is about 6.4 MiB on disk, not browser transfer size. |
| Hosting | `.openai/hosting.json` binds the existing Sites project `appgprj_6af73c0b8dc08191ad62ad4b4711684d` to D1 `DB` and R2 `BUCKET`. Standard build outputs `dist/server/index.js`; optional static/Netlify path is a separate legacy deployment target, not evidence of live Netlify hosting. |
| Product truth | `store/products.json` has 9 base records. `server/admin.mjs:catalogueProducts` overlays D1 `catalogue_products`, including custom products; only published records enter the public catalogue. Live product count can differ from 9. No second pricing source should be introduced. |
| Persistence | D1 tables: support_threads, support_messages, support_presence, catalogue_products, product_media, orders. Schema in `db/schema.ts`; migrations `drizzle/0000_groovy_korvac.sql` and `0001_warm_wrecker.sql`. |
| Images | Approved logo derivatives in `src/assets/brand` (1024px, about 28/32 KiB); original user uploads in R2 via `/media/:uuid`. Baseline supplier and unused studio assets remain tracked. Do not replace live uploaded illustrations from base seed files. |
| Identity | `server/support.mjs:identity` trusts Sites-injected authenticated ID/email headers; owner email is runtime configuration. Trust requires the hosting proxy to strip forged client identity headers. No IP-based login. Guest chats use opaque Secure, HttpOnly, SameSite=Lax, 30-day cookies. |
| Admin | Owner-only products, media uploads and order APIs. Product revision checks prevent lost updates. Uploads limited to 5 MiB and JPEG/PNG/WebP signatures. Orders include notes, tracking and fulfilment status. No image decode/dimension check found. |
| Commerce | `server/payments.mjs` adapts catalogue variants to physical GBP checkout; `server/stripe.mjs` prices on server, uses Stripe session idempotency, signed webhooks, exact total/currency verification and paid-state protection. UI success alone is not paid proof. |
| Launch gates | Shipping countries empty, shipping fee null, checkoutEnabled false in `store/settings.json`. Worker requires secrets plus PAYMENTS_ENABLED, FULFILMENT_READY and PUBLIC_CHECKOUT_READY. Named merchant is Avenline. No secret values were read. Checkout is deliberately unavailable from current source configuration. |
| Orders | D1 retains product/variant/price snapshots, Stripe session, customer details, payment state and separate fulfilment state. Owner order views are protected. Public status endpoint returns status only for a session reference. No customer order-history, refunds, carrier or transactional-email implementation found. |
| Support | D1-backed authenticated/guest chat and owner inbox with presence heartbeat; WhatsApp contact link. Local tests exercise isolation and idempotency. No external message was sent in this audit. |
| Analytics | No GA4/purchase tracking integration found in inspected front end. No traffic/conversion claims are supported. |
| CI | `.github/workflows/check.yml`: Node 22, npm ci, npm test, npm run build on push/PR. No deployment step or automatic live payment activation. |

## Routes and crawlability

`/#collection` is an ordinary homepage anchor, **not** a fragment-based router. Query parameters preserve client filtering. Product buttons call `product(id)` and render a dialog; baseline has no stable product detail URL. Main product listing is fetched from `/catalogue.json` and inserted by JavaScript. This is a product-route limitation, not a defect caused by the collection anchor itself.

| Route | Baseline behaviour from source |
|---|---|
| `/` | Store shell, client catalogue |
| `/contact`, `/reviews`, `/account` | Generated HTML templates; JS attaches shared shopping/support behaviour |
| `/owner` | Sign-in redirect if guest; 403 for non-owner; owner HTML if authorised |
| `/owner.html` | Explicit owner guard prevents alias bypass |
| `/catalogue.json` | Current published merged catalogue; no-store |
| `/media/:uuid` | Authorised owner or published-reference check; R2 bytes; private/no-store |
| `/api/admin/*`, `/api/owner/*` | Owner-only APIs |
| `/api/chat/*`, `/api/me` | Identity-scoped support and session views |
| `/api/checkout-config`, `/api/checkout`, `/api/stripe-webhook`, `/api/payment-status` | Gated Stripe integration |
| Unknown route/API | 404; trailing slash on GET/HEAD normalised with 301 |
| robots/sitemap/canonical | No implementation found at baseline |

## Smallest safe routing contract (proposed, requires SEO/QA review)

1. Stable route `/products/:id` uses current published D1-merged catalogue. IDs, not mutable names, identify records. Unknown/draft/archived products return actual 404; database failure returns 503, never stale seed truth.
2. Render factual product identity, description, selected option price and approved image in server HTML. Preserve the existing detail component/dialog presentation; do not add a new visual template. Product anchors must have real href values and can be enhanced to the same modal on normal clicks.
3. Use root-relative scripts, styles, logo assets and catalogue/settings fetches; baseline relative paths would otherwise resolve under `/products/`.
4. Parent product canonical excludes arbitrary query parameters. Variant selection can use a verified `variant` parameter but must resolve to an actual variant before rendering or adding to bag. Back/forward, refresh and modal close need explicit tests.
5. Keep noindex until public audience, seller/product truth and owner launch approval are established. Do not create Offer/review schema, Merchant Center feed, stock claims or publish indexability based on unconfirmed product data.
6. No database migration, price alteration, live payment change or imagery replacement is needed for this contract.

## Critical limitations and safe work

- No stock reservation or decrement is implemented. Serial request validation against a stock snapshot cannot prevent concurrent overselling; checkout activation is blocked pending an independently reviewed solution.
- No real Stripe sandbox transaction was performed by this audit. Existing tests use local doubles, not provider certification.
- Refunds, disputes, operational email, verified shipping and secure customer order retrieval remain incomplete.
- Product authenticity, condition, electrical/fragrance safety details and merchant identity cannot be inferred from names, images or low prices. Owner evidence is required before selling.
- README contains stale Daliy/Netlify/studio-art descriptions; use source and current deployment evidence as authoritative.
- Safe bounded changes include search normalization tests, correct route/status/metadata controls, accessible feedback/focus recovery, static asset delivery and removal of fictional review presentation. All remain staged until release gates and owner approval.

## Verification and handoff

`npm test` at baseline: **32 passed, 0 failed**, local Node test runner, 333.575583 ms reported suite duration. Covers admin auth/input/uploads, catalogue/stock validations, local Stripe doubles/webhook signature construction, support isolation/idempotency and gated checkout. It does not cover actual browser rendering, Lighthouse, production restore or real sandbox payment settlement.

Status: architecture discovery **VERIFIED — PASSED** at source scope. Production commerce readiness **VERIFIED — FAILED** because source configuration deliberately prevents checkout and operational requirements are incomplete. Independent review requested: role 12 QA for routing and environment contract; role 08 Security for proxy/header trust and checkout activation prerequisites. No source or customer data changed by this specialist.
