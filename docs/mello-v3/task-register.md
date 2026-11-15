# MELLO V3 task register

Evidence date: 15 November 2026. Baseline `2c1f9e887f49e85a726c70214afc2e296d66530a`. All changes below are LOCAL STAGING, not deployed. Source and git bundle backups verified. No live prices, products, orders, customer data, payment flags, domains, audience or shipping policies changed.

## Capability / roster / ownership

Native subagents existed; four concurrent slots. Three real specialists ran alongside the orchestrator. Roles were combined as separate bounded passes, **not fourteen independent people**. Specialists had the same runtime tools; least privilege was enforced by task scopes, not technical tool-level ACLs. Implementation copies came from `git archive HEAD` with linked dependencies; these are isolated source directories, not independent Git branches. Account usage limits interrupted the later passes. Final independent role14 sign-off is missing.

|Role|Actual executor|Assignment and measurable result|Status|
|---|---|---|---|
|01 Orchestrator|root|Backups, baseline, single writer map, integration, final report|Evidence assembled; no release authorised|
|02 Architecture|architecture subagent|Verify stack, DB/API/routes; propose stable-ID route contract|Report delivered|
|03 Apple UX|experience subagent|Six cited Apple task scripts and gap matrix|Report delivered|
|04 Product truth|experience subagent|Nine seed-product completeness matrix; owner facts|Report delivered; root separately checked live table|
|05 SEO|architecture subagent|Isolated server/seo.mjs + worker patch and six tests|Root integrated and tested; final specialist handoff interrupted|
|06 Performance|experience started; root continued|Real Lighthouse13.6.0 mobile/desktop repeated trials|Raw reports retained; no field data|
|07 Commerce|security_commerce subagent|Trace variants, server pricing, signed webhook; concurrency repro|Oversell activation blocker reproduced|
|08 Security|security_commerce subagent; root bounded-body patch|Auth/data threat review; cap streamed request buffering|Audit delivered; body patch tested but independent security review pending|
|09 Accessibility|root sequential pass|Lighthouse findings, keyboard/mobile checks, minimal fixes|Automated findings fixed; no human screen-reader study|
|10 UK retail|experience subagent|Official GOV.UK guidance and disclosure gaps|Owner/legal facts outstanding|
|11 Analytics|experience subagent|Inspect current instrumentation and consent implications|No application tracker found; none installed|
|12 Independent QA|security_commerce subagent|Seven independent search/cart tests on original baseline|4 pass/3 fail before; root rerun all7 pass after; final independent retest interrupted|
|13 SRE|architecture subagent + root|Source restore, isolated previews, release/rollback runbook|Source restore verified; production data restore unverified|
|14 Final evaluator|root adversarial checklist ONLY|Challenge completion and release gates|Independent evaluator unavailable after usage limit; no independent sign-off claimed|

## Queue, dependencies and acceptance

|Task|Owner/writer|Reviewer/evidence|Result / remaining gate|
|---|---|---|---|
|BASE-001 Source recovery|root, backup outputs only|git bundle verify; extracted baseline served3188|VERIFIED — PASSED for source, not business-data backup|
|COM-001 Stock concurrency|07 read-only|two sessions for stock1 with fake provider|VERIFIED — FAILED; keep checkout disabled; real inventory contract needed|
|COM-002/003 Retry/refund lifecycle|07 read-only|security-commerce-audit.md|NOT IMPLEMENTED; sandbox/inventory work required|
|SEARCH-001 Normalise names/models|root src/cart.mjs|Independent QA authored tests; root executes|VERIFIED — PASSED 7/7 search/cart regressions|
|SEO-001 Stable product URL|05 server/seo.mjs + worker|Root source review,6 tests, real direct browser visit|VERIFIED — PASSED bounded route tests; no public indexing claim|
|UX-001 Basket reliability|root src/app.js|Browser2×£104.95=£209.90, refresh/quantity/selection|VERIFIED — PASSED selected local journey|
|TRUTH-001 Remove fictional reviews|root support.js/reviews.html|No sample array/rating; browser reviews state|VERIFIED — PASSED locally|
|A11Y-001 Names/contrast/focus|root app.js/storefront.css/index.html|Lighthouse + keyboard/mobile evidence|Measured; full WCAG certification not claimed|
|PERF-001 Public admin JS|root build.mjs|Build excludes admin.js on public pages, retains owner script|VERIFIED — PASSED; shared admin CSS retained to preserve catalogue styles|
|SEC-001 Bounded body|root request-body.mjs + worker|4 chunked/exact-byte tests|VERIFIED — PASSED unit checks; independent final review required|
|OPS-001 Isolated staging data|root scripts/serve.mjs|PREVIEW_DATA_DIR local-only separate database/bucket|VERIFIED — PASSED; no hosted staging deployment|
|RELEASE-001 Publish|root only|Brief sections43,46 require approval + gates|REQUIRES OWNER APPROVAL; no production deployment performed|

Dependency graph: baseline/backup → independent audits → route contract → nonoverlapping implementation → integrated tests → independent final review (blocked) → owner release approval (not requested while critical blockers remain) → production smoke checks (not performed).

## Integration/conflicts

Root exclusively edited frontend/build/preview; architecture exclusively edited worker/SEO in its source copy, then root integrated it. QA independently authored regression tests in its copy. No overlapping active writers. Root caught admin.css contains shared storefront styles and retained it; only unused public admin.js loading was removed. Root added bounded-request middleware after the architect stopped. No schema migration or live data mutation. No author self-approval is labelled independent.
