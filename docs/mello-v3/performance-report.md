# Actual Lighthouse measurements

Lighthouse13.6.0, Chrome for Testing157.0.8103.78 macOS arm64.15Nov2026. Three runs per homepage/device/phase (12 completed), alternating before/after; default Lighthouse simulated mobile throttling and desktop preset. URLs localhost3188 baseline and3189 staging. Raw JSON includes full config. Unchanged9-product seed catalogue and source images, no live customer data. **These are local lab results, not production/field CWV or the live11-product uploaded-image catalogue.** No INP field percentile measured. Concurrent machine/browser use introduces variance. Preliminary experiments retained separately, not substituted into final medians.

|Device|Phase|Performance|Accessibility|Best Practices|SEO|Median LCP ms|Median CLS|
|---|---|---:|---:|---:|---:|---:|---:|
|mobile|before|99|96|100|100|1603|0.0704|
|mobile|after|99|100|100|66|1416|0.0704|
|desktop|before|100|96|100|100|360|0.0605|
|desktop|after|100|100|100|66|412|0.0605|

Homepage performance ranges: mobile before97–99, after98–99; desktop100 in all six runs. No meaningful improvement in median performance score is claimed. Mobile median LCP improved modestly; desktop varied slightly slower. Main verified gain is automated accessibility96→100, with truthful SEO safeguards intentionally producing100→66. An indexable-looking seed homepage scoring100 did not imply actual product URLs or Google eligibility.

Additional single-run template checks (not medians): new product page mobile92/100/100/69, LCP3325ms; desktop100/100/100/69. Contact mobile100/100/100/66, reviews mobile100/100/100/66. Product mobile LCP misses2.5s lab target and needs image/render investigation using the real approved image catalogue. No before PDP comparison exists because baseline route was absent. No audit-only functionality changes or disabled security/consent controls.

Public pages no longer load admin.js; shared admin.css is deliberately retained because it includes existing catalogue image/layout rules. Logo artwork unchanged and already resized1024px before this task. New product image uses high loading priority. No claim that unused archived assets are all downloaded by customers.

Reproduction: start baseline on3188 and revised build on3189 with isolated local test DBs; use evidence/reproduce-home-audits.mjs, adjusting absolute paths/CHROME_PATH to local tooling. Audit code and JSON are evidence, not application runtime dependencies.
