# MELLO security and commerce audit

Task SEC-COM-001. Roles 07 (commerce) and 08 (security) performed as separate specialist passes by one real agent; these passes are **not independent approvals of one another**. Evidence date: 2026-11-15. Starting revision: `2c1f9e887f49e85a726c70214afc2e296d66530a`. Read-only application audit, document-only output; no credentials accessed, no real payment requests, customer records or production writes. Independent review requested from roles 12 and 14.

## Evidence and established controls

`npm test` completed successfully: **32 tests, 32 pass, 0 fail**, local Node test runner. Tests use fake DB/provider objects and temporary SQLite where specified; these are implementation tests, **not a Stripe sandbox transaction**. Inspected `server/stripe.mjs`, `payments.mjs`, `admin.mjs`, `support.mjs`, `worker.mjs`, `src/cart.mjs`, `src/app.js`, `src/support.js`, `store/settings.json` and relevant tests. Consulted the installed Stripe best-practices skill and its security reference. No claim of formal security certification.

Observed controls:

- Checkout is unavailable unless DB, key, webhook secret and explicit payment/fulfilment/public-readiness flags exist, plus shipping destinations and fee. Repository shipping destinations are empty and fee is null. Settings explicitly disable checkout. See `server/payments.mjs:7` and `store/settings.json`.
- The merchant account must match the pinned account and have charges enabled before a checkout is created (`server/payments.mjs:19–20`). No account switch was attempted.
- Prices, variants and quantity are revalidated on the server; supplied browser prices are ignored (`server/stripe.mjs:6–22`). Application adapter forces GBP.
- Hosted checkout URL is constrained to `https://checkout.stripe.com` in `src/app.js:126`; raw cards do not enter the application's forms.
- Webhook signature uses Stripe's verifier with a 300-second tolerance. A paid update requires matching currency/amount and the recorded session when present. Older failure/expiry events cannot downgrade paid (`server/stripe.mjs:53–70`). A redirect alone does not mark paid.
- Owner APIs reject anonymous/customer identities before access; writes require same-origin requests. Database statements bind user input. Revision checks prevent silent lost product/order updates. Fulfilment cannot be advanced unless payment is recorded paid.
- Guest chat uses a random, hashed token with a Secure, HttpOnly, SameSite=Lax `__Host-` cookie; IP is not login identity. Customer conversation queries derive their key from server identity/cookie, not a caller-selected thread ID.
- Uploads are owner-only, limited to 5 MiB, MIME and signature checked for JPEG/PNG/WebP, max 100/hour. SVG is rejected. Draft media is denied to nonowners.
- CSP, nosniff, referrer and permissions headers exist. Tests verify origin protection, SQL search escaping, uploads and guest conversation isolation.

## Findings and release disposition

| ID | Severity / scope | Evidence and consequence | Required action / acceptance |
|---|---|---|---|
| COM-001 | **P0 activation blocker**, latent while checkout disabled | `stripe.mjs:20` checks a stock snapshot; checkout and webhook contain no stock reservation/decrement/reconciliation. Two distinct checkout IDs can both buy the final unit. | Keep payments disabled. Architect an atomic variant reservation ledger, expiry/release and exactly-once consumption, then independent security and concurrency QA before activation. No live inventory edits without approval. |
| COM-002 | P1 activation blocker | `stripe.mjs:37–50` only compares `items_json` before calling Stripe again. It does not stop paid/expired orders, return a prior session, or store a durable immutable checkout request covering shipping/currency. Provider idempotency is relied on without an application lifecycle. | Bind complete immutable totals and a durable session/state to each attempt; reconcile retry/outage/expired-key cases using sandbox tests. Do not claim exactly-once financial behaviour from the current test suite. |
| COM-003 | P1 activation blocker | Only completed/async-success/async-failure/expired webhook types are handled; no refund/dispute state reconciliation (`stripe.mjs:57`). No customer order history/secure lookup or transactional confirmation delivery exists in inspected application. | Implement and verify actual provider lifecycle/support operations after approved sandbox and merchant facts. No invented refund/order email state. |
| SEC-001 | P2 abuse hardening | Chat `bodyOf()` and checkout/webhook handlers use `request.text()` before checking actual size (`support.mjs:20–25`, `stripe.mjs:28,56`). An omitted/false Content-Length lets a large request be fully buffered. | Reuse a stream-bounded request reader, retain raw bytes for webhook signature verification; reject early, test absent Content-Length and chunked over-limit input. |
| SEC-002 | P2 owner upload integrity | `admin.mjs:23–27` checks only magic bytes, not actual decode/dimensions. A 12-byte PNG-signature payload or decompression-heavy image passes preliminary type recognition. | Validate decodability and dimensions using supported image tooling. Owner-only upload reduces exposure but does not make every file valid. Do not call current magic-byte tests full image validation. |
| SEC-003 | P2 abuse resilience | Chat rate limit is per conversation. Clearing the anonymous cookie creates another thread (`support.mjs:37–49`). | Add an appropriate privacy-conscious edge/rate policy before opening publicly; test locally, no production load tests. |
| SEC-004 | Trust-boundary verification required | `support.mjs:6–9` trusts `oai-authenticated-*` headers. This is appropriate only if the hosting gateway strips untrusted input and injects verified claims. Unit tests intentionally forge these headers; that does not prove platform enforcement. | Verify host's authentication contract and ensure alternate worker endpoints cannot bypass it. Do not label a forged header in a unit test an exploitable production bypass without host evidence. |
| PRI-001 | P2 retention gap | Checkout hashes raw IP without rotation and stores it in orders; support keeps messages indefinitely in inspected code. | Confirm operational retention/deletion policy, minimise retained data, and document it. No production record deletion was authorised. |

## Isolated stock reproduction

Executed a local Node script importing `checkoutResponse` with a catalogue containing one product/variant, stock 1, quantity 1, and two random checkout IDs. Both calls used `Promise.all`, an in-memory DB stub and a provider stub; zero network calls and zero production writes.

Actual result:

```json
{"test":"two checkout attempts for one stock unit","statuses":[200,200],"sessions":2,"networkCalls":0,"productionWrites":0}
```

This proves the function lacks cross-checkout stock consumption. It does not reproduce a real money charge or test D1 concurrent transaction guarantees. The source inspection independently shows there is no reservation table update or stock decrement anywhere on this path.

## Coverage and unavailable evidence

| Scenario | Result |
|---|---|
| Invalid variants, invalid quantity, split-line stock overflow | VERIFIED — PASSED in existing local tests |
| Client price override, GBP adapter, shipping line creation | VERIFIED — PASSED in existing local tests |
| Invalid webhook signature, unpaid event, mismatched amount, paid event | VERIFIED — PASSED with real Stripe signing/verification library and local fixture secret |
| Unauthorized admin/customer access and cross-site writes | VERIFIED — PASSED in local tests; hosting edge auth not independently tested |
| Customer thread isolation, idempotent message retry, rate limit | VERIFIED — PASSED in local tests |
| Last-unit concurrency | VERIFIED — FAILED (COM-001 reproduction) |
| Real hosted sandbox checkout success/decline/cancel/timeout/refund | BLOCKED — NO ACCESS to an approved isolated sandbox in this pass |
| Exactly-once paid order under outage/provider retry | NOT IMPLEMENTED / incomplete coverage; do not infer from basic idempotency test |
| Dependency vulnerability scan | NOT IMPLEMENTED in this specialist pass; orchestrator may run registry audit separately |
| Formal penetration test/legal review | NOT APPLICABLE to this bounded agent audit; no certification claimed |

## Recommendation

**Do not activate production commerce.** Existing checkout-off gates are a necessary safety boundary. Safe frontend/content/performance improvements can be staged while inventory integrity, durable payment lifecycle, product truth, fulfilment and merchant disclosures remain release blockers. Any commerce changes require three-way builder, independent security reviewer and independent functional reviewer sign-off per the brief. No deployment approval has been inferred.

## Independent QA follow-on (role 12)

After the read-only audit, the orchestrator assigned independent requirement-driven search and basket regression tests. These were authored against the unchanged baseline in isolated `outputs/mello-v3-qa` (created by `git archive HEAD`; application dependency directory linked read-only by convention). This agent did not implement the frontend repair.

`node --test tests/v3-regression.test.mjs` baseline: **7 tests, 4 pass, 3 fail**. Actual output retained in `outputs/mello-v3-qa/v3-baseline-test-output.txt`. Tests expose repeated-space/hyphen query failures, model/manufacturer punctuation failures, and literal `undefined` indexing when optional brand is absent. Existing basket normalization correctly rejects malformed storage values and removed products/variants; repeated lines cap at 99; basket calculation uses current integer-penny variant prices. Final repaired-source retest pending at this point.
