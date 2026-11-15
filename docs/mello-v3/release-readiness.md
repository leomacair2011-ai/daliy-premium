# MELLO V3 — staged engineering report

**Decision: NO-GO for transactional production launch. Safe engineering improvements are implemented and tested in LOCAL STAGING; none of this V3 batch has been deployed.** Baseline production/source revision2c1f9e887f49e85a726c70214afc2e296d66530a. Existing private site remains unchanged.

## Implemented

- Stable server-rendered product URLs with real current catalogue data, escaped HTML, metadata/canonicals, privacy-aware robots/sitemap and proper404/503 handling. Existing product-modal behaviour retained through real anchors.
- Search normalisation for case, repeated whitespace, punctuation and model names; undefined optional brand no longer becomes searchable text. No unsupported fuzzy matches invented.
- Keyboard filter focus retention, live result count, reduced-motion support, visible-label accessible names, and two minimum contrast corrections.
- Clear unavailable-checkout action and safe malformed saved checkout-attempt handling; basket selection/totals preserved.
- Removed fictional testimonials and ratings; truthful no-reviews state.
- Public pages avoid loading admin JavaScript; shared catalogue CSS retained.
- Stream-bounded API request bodies preserve webhook signature bytes.
- Isolated preview database/bucket configuration, source/Git backups, tests and evidence dossier.

## Verified tests

Baseline32/32. Final50/50 local automated tests: existing admin/security/support/Stripe-library cases plus6 product-route cases,7 independently authored search/cart cases,4 request-boundary cases and1 integrated built-Worker route test. Independent QA originally found3 search failures; orchestrator rerun passes all7. Tests use synthetic local DB/provider fixtures: **not actual hosted Stripe sandbox settlement**.

Actual browser checks confirm tolerant search, selected5-pack option, quantity2×£104.95=£209.90, refresh persistence, truthful disabled checkout, direct product URL/selector, keyboard removal, mobile menu and honest reviews. Full customer ordering, fulfilment and refund journeys remain unverified.

Homepage Lighthouse medians (3 runs each, local fixture): mobile99/96/100/100 before→99/100/100/66 after; desktop100/96/100/100 before→100/100/100/66 after, in Performance/Accessibility/Best Practices/SEO order. Lower SEO is intentional private noindex/robots protection. New PDP mobile single-run92 performance and3.33sLCP; desktop100. Contact/reviews mobile100 performance/accessibility/bestpractices. Raw reports and methods: performance-report.md and performance-before-after.csv. No production CWV, INP percentile, ranking or Apple-equivalence claim.

## Gate decisions

|Gate|Decision and evidence|
|---|---|
|Protected design|Partial verification: source art/logo unchanged and matched desktop screenshots; strict mobile/live-catalogue parity still needed|
|Product/customer truth|BLOCKED: incomplete verified identity/condition/specifications, seller details, delivery/returns and category inconsistency|
|Discovery/configuration/basket|Bounded local cases VERIFIED — PASSED; not entire live catalogue|
|Payments/inventory/orders|VERIFIED — FAILED activation readiness: no atomic stock reservations; retry/refund lifecycle incomplete; genuine sandbox untested|
|Technical SEO|Staged route checks pass; public indexing/Merchant eligibility NOT IMPLEMENTED pending approval/truth|
|Performance|Measured; homepage fast locally; PDP mobile misses target; live field data unavailable|
|Accessibility|Automated tested pages100 + limited keyboard/mobile checks; full WCAG/user study outstanding|
|Security|Existing local controls pass; request buffering fix unit tested; residual findings and independent review outstanding|
|Operations|Source restore and bundle verification pass; production DB/R2 backup/restore unverified|
|Independent review|Three real agents provided audits/tests/SEO patch; final role14 evaluator interrupted by usage limit; no sign-off invented|
|Release approval|REQUIRES OWNER APPROVAL under brief43/46; not solicited while critical blockers remain|

## Next safe steps

Provide verified merchant/product/fulfilment facts and approved isolated sandbox access; implement atomic reservations and durable payment/refund state with three-way review; verify D1/R2 recovery; complete live-catalogue visuals, mobile PDP optimisation, manual assistive-tech and independent final QA. Then present the exact releasable commit for production approval. No new service cost, domain/payment switch, product-price edit or customer data mutation occurred.

## Evidence navigation

- task-register.md — all14 role assignments, actual executors, dependencies and limitations.
- architecture-inventory.md / deployment-and-rollback.md — system, source of truth and recovery.
- experience-and-truth.md / product-data-audit.csv — Apple/GOV.UK benchmark, product gaps.
- security-commerce-audit.md / security-accessibility-review.md — findings and tested scope.
- technical-seo-report.md / ux-task-results.md / visual-regression-report.md — route and journey evidence.
- decision-register.md — owner facts, approval boundaries and read-only live catalogue inspection.
- evidence/after-tests.txt / lighthouse*.json / route*.json / dependency-audit.json — actual outputs.
