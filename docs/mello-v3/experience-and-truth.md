# MELLO V3 — experience, product truth, UK disclosure and analytics passes

Evidence date: 15 November 2026. Baseline revision: `2c1f9e887f49e85a726c70214afc2e296d66530a`.

Agent `/root/experience` performed role-separated passes 03 (UX), 04 (product truth), 10 (UK compliance), 11 (analytics). These are four specialist scopes in one real independent agent, not four simultaneous people. Scope: read-only source and public benchmark research; wrote only this report and `product-data-audit.csv`. No production data changed, no payment executed, no messages sent, no new tracking added. Source audit is not legal certification or a human usability study.

## Evidence boundaries

**OBSERVED:** `store/products.json` has nine imported base products and 54 variants; all base records mark stock unconfirmed. `server/admin.mjs:catalogueProducts` overlays database-managed records and includes new managed products, so this CSV is deliberately not represented as the complete live catalogue. Live D1 values require their own approved export/review. No customer or order records were read by this agent.

**OBSERVED:** `store/settings.json` disables checkout and supplies no shipping countries or fee. `server/payments.mjs:checkoutReady` additionally gates runtime payments on keys, DB and three explicit readiness flags. This audit did not inspect secret values. `src/app.js` displays an honest unavailable checkout notice; a bag is not an order.

**OBSERVED:** Existing logo #08 assets and dynamic saved-cover imagery are already present. Preserve both; product illustrations do not establish manufacturer, authenticity or condition.

## Apple benchmark and six customer-task scripts

The following are documented Apple principles, not copied code/design or proof of Apple’s internal implementation. Public pages fetched 15 November 2026.

| Stage/task and measurable acceptance | BENCHMARKED Apple pattern | OBSERVED MELLO baseline | Safe adaptation / gate |
|---|---|---|---|
| Discover: open homepage, choose Audio, then search `HS08`, `Air-Pods`, irrelevant text. Correct actual items only, useful empty state and keyboard access. | [UK Store](https://www.apple.com/uk/store) exposes product departments and direct item links. | Existing categories, filters, substring search and card dialogs. Node search probes below show punctuation/terminology gaps. | Normalise punctuation/whitespace and search verified variant terms; retain empty results. No invented match or new layout. |
| Understand: open one electronics, fragrance and hair-tool item; identify maker, exact model, condition, contents and delivery basis before adding. | [Shopping help](https://www.apple.com/uk/shop/help/shopping_experience) separates shopping, payment, merchant and return terms. | Generic imported descriptions; no structured condition, specifications or verified contents. | Owner must supply product evidence. Never infer genuine branded status from name or illustration. **Sales gate blocked.** |
| Configure: select a different pack/colour; verify variant ID and current GBP amount in bag, refresh and reopen. | Apple’s [saved items/bags guidance](https://www.apple.com/uk/shop/help/shopping_experience) describes keeping choices and editing bag quantities. | Stable option IDs and authoritative catalogue price lookup exist in cart and server code. | Independent QA should execute variant/quantity/refresh scenario. Cross-device bag continuity not promised. |
| Purchase: test disabled checkout, then only authorised sandbox success/decline/timeout/retry; one paid record per verified payment. | Apple describes guest or account ordering and an opportunity to review before submission in [shopping help](https://www.apple.com/uk/shop/help/shopping_experience). | Stripe code exists but readiness is false in repository settings. No sandbox transaction performed by this agent. | Keep honest unavailable state; require seller/shipping/payment setup and sandbox verification before activation. |
| Receive: inspect a synthetic authorised paid order, add genuine test tracking only in staging, verify separate fulfilment/payment state. | [Delivery help](https://www.apple.com/uk/shop/help/shipping_delivery) ties costs and estimates to checkout; [order help](https://www.apple.com/uk/shop/help/viewing_changing_orders) provides shipment state and next actions. | Owner order management exists; no customer order-history or transactional email feature found in account page/support client. | Do not simulate notifications/tracking. Customer order retrieval and email remain implementation/infrastructure gaps. |
| Support: locate contact from product/bag, submit an intentionally invalid then valid staging enquiry, see saved acknowledgement and isolated reply. | [Order help](https://www.apple.com/uk/shop/help/viewing_changing_orders) documents authenticated/verified order access, cancellation and eligible returns. | WhatsApp link and server-backed chat exist; account focuses on conversations. | Keep real contact route; test acknowledgement/isolation. Do not share order data merely from an order number. |

No comparative timed Apple checkout, Apple purchase, five-person study, screen-reader session or controlled usability study was performed. This is a source-backed heuristic and public-document benchmark. Final QA must record actual browser outcomes separately.

## Search probe evidence

Command: Node imports `filterProducts` from `src/cart.mjs`, loads the repository base catalogue, and queries it without network or mutation.

| Query | Actual IDs at baseline |
|---|---|
| `AirPods Pro 3` | daily-7720755 |
| `airpods` | daily-7720755, daily-7730237 |
| ` airpods ` | daily-7720755, daily-7730237 |
| `Air-Pods` | none |
| `headphones` | none |
| `HS08` | daily-7720742 |
| `iphone 18` | daily-7720735 |
| `airpds` | none |
| `zzznonexistent` | none, correctly |

The `headphones` no-result is a content/terminology limitation, not evidence that arbitrary fuzzy matches are appropriate. Preserve precision. Search typo tolerance is optional after verified vocabulary.

## Product-truth gate

All nine base products carry branded-looking names but no manufacturer/authenticity evidence in this repository. This does **not** prove counterfeiting; it means genuine status, exact device model and material specifications remain unverified. No approval to rename, remove or change prices was supplied. Do not submit merchant feeds, claim official warranty or enable sales without verification. Product source URLs/old supplier stock are provenance, not current verified inventory.

Extra concrete checks:

- `daily-7720703` source URL names a TAG HEUER watch while display/sourceName say Apple Watch. Treat identity as unresolved, not a harmless SEO typo.
- `daily-7720735` five-pack price is £479.94 while imported option label says £95.99/unit; multiplication gives £479.95. Ten-pack price is £939.99 versus £93.99/unit × 10 = £939.90. Preserve actual prices; owner must reconcile supplier labels before using per-unit claims.
- Brand field is `Louis` for fragrance, `iPhone` for phone, `AirPods` for audio. These are source labels, not verified manufacturer records. Do not propagate them into asserted manufacturer schema.
- All variants lack specific images. Current cover art does not prove selected colour/pack contents.
- All descriptions use pack/colour wording even when only Standard or pack quantity exists. Safe future copy should derive option wording from actual variants; do not invent colour choices.
- Fragrance concentration, actual ingredients/allergens and packaging are absent. Hair-tool UK plug/voltage and electrical safety evidence are absent. Owner facts, not generated text, are required.

## Review-content finding

`src/pages/reviews.html` explicitly labels samples as fictional, and `src/support.js` contains invented profiles/ratings/quotes. The old disclosure is clear, but V3 explicitly prohibits invented reviews/placeholder functionality. **P1 staged remediation:** remove sample data and replace with a factual no-reviews state inside the existing page container. Keep no aggregateRating or Review schema. Genuine reviews require a real collection/permission process. This is a justified content correction, not a redesign.

## UK disclosure checks and owner facts

This is an engineering gap register, not legal advice/certification. Official guidance was opened on 15 November 2026:

- [GOV.UK distance selling](https://www.gov.uk/online-and-distance-selling-for-businesses) identifies pre-order seller/contact/address, goods description, taxes, payment and delivery disclosure requirements.
- [GOV.UK online selling](https://www.gov.uk/online-and-distance-selling-for-businesses/online-selling) adds online-order information, correction and durable confirmation requirements.
- [GOV.UK returns/refunds](https://www.gov.uk/accepting-returns-and-giving-refunds) explains distance-sale cancellation/refund rights and that policies cannot remove statutory protections.

| ID / severity | Observed gap | Required owner input / safe action |
|---|---|---|
| TRUTH-01 / P0 sales gate | Product identity, maker, condition and safety cannot be verified from provided records. | Evidence per product and lawful supplier provenance; do not rewrite as genuine by assumption. |
| UK-01 / P1 | Mello trading name and WhatsApp exist; legal seller/address not found in site content. | Legal business name, correspondence/returns address, required contact email and applicable registration/VAT facts. Do not expose private address without owner-approved business disclosure. |
| UK-02 / P1 | Delivery estimate is hard-coded to 14 days after dispatch; country list empty, fee null. | Actual dispatch origin, processing lead time, carrier/destinations, delivery fees/taxes/customs responsibility. Preserve payment gate; proposed copy should qualify unknowns. |
| UK-03 / P1 | Return terms deferred until checkout opens; no operative cancellation/returns process. | Approved operational return address/process and lawful terms; no blanket fragrance/electronics exclusions guessed. |
| PRIV-01 / P1 | Privacy dialog describes browser storage/chat, but lacks legal controller/contact/retention-rights detail. | Approved privacy notice derived from real controller, host/processors and retention practice. Do not publish invented policy. |
| REV-01 / P1 | Fictional sample testimonials remain although labelled. | Replace with truthful empty state in staging; genuine review system later. |

Changing live policy, shipping rules or product assertions requires explicit owner approval. Do not silently replace the 14-day estimate with another invented promise.

## Analytics pass

Read-only `rg -n -i 'gtag|googletagmanager|google-analytics|dataLayer|facebook|fbq\(|posthog|plausible|analytics|pixel' src server store` returned no matches in inspected text source. This supports **no application-level analytics instrumentation found**, not a claim about platform telemetry or external services. Browser bag/favourites and chat session cookies serve current features. No event/purchase dashboards, GA4, Search Console or Merchant Center connection was verified.

Recommended future event contract (NOT IMPLEMENTED): `view_item`, `search`, `add_to_cart`, `remove_from_cart`, `begin_checkout` from actual actions; `purchase` only from verified server order state, with unique transaction ID and GBP integer minor units. No names, emails, chat bodies, addresses or raw search terms with personal data in third-party events. Require privacy/consent decision and owner approval before adding external tracking. No traffic, conversion, revenue or field CWV figures are invented.

## Handoff

Task ID: EXP-TRUTH-001. Status: **VERIFIED — PASSED** for bounded read-only audit and search probes; **VERIFIED — FAILED** for unconditional commerce-readiness gate. Starting/ending source revision: 2c1f9e887f49e85a726c70214afc2e296d66530a (source untouched by this agent). Changes made: two audit files only. Independent review requested: role12 QA for source/test findings, role14 final evaluator for readiness. Dependencies: no production activation until owner facts and payment/order tests. Root owns source corrections and final integration.
