# Research and design decisions

Reviewed 13 November 2026. Focused web research was available; no separate Deep Research tool was exposed in this session.

- Baymard, Product Lists UX: https://baymard.com/research/ecommerce-product-lists — combine category filters, search, clear prices, and meaningful sorting. Applied as six categories, result counts, numeric sorting, composed filters, clear-all and empty states.
- Baymard, Cart & Checkout Usability: https://baymard.com/research/checkout-usability — make selected options, quantities and totals easy to inspect and edit. Applied as pack-based prices, explicit quantities, basket editing, and a clearly disclosed paused checkout.
- Google web.dev, Keyboard focus: https://web.dev/learn/accessibility/focus/ — semantic controls, logical focus order, visible focus rings and skip links. Applied throughout; native dialogs provide Escape handling and focus containment.
- Google web.dev, Manual accessibility testing: https://web.dev/learn/accessibility/test-manual — browser checks complement unit tests. Desktop and mobile QA cover navigation, product options, basket totals, search and overflow.

## November 13 redesign

The owner rejected the initial text-only layout and made Apple.com the primary visual reference, with Switch Reps and Apex Access secondary references. Visually inspected https://www.apple.com/uk/ and https://switchreps.net/ in the browser, and reviewed https://www.apple.com/uk/shop via the web tool.

Applied patterns: compact translucent navigation, a narrow shopping announcement strip, large isolated product imagery, high-contrast product hero, restrained system typography, a visual category rail, generous white space, soft grey section backgrounds, rounded product cards and blue pill actions. Switch Reps informed the top delivery/discount announcement, while the existing Apex shopping logic informed category browsing and the bag. Branding, copy, composition and studio artwork are specific to Daliy Premium.

The mobile design has a compact expandable navigation, swipeable category rail and filters, two-column cards, a stacked photo gallery, full-height bag drawer and reduced-motion support. All images are local. The hero and two image atlases total approximately 660 KB; full supplier images load only when their product is opened.

No fabricated ratings, active coupon codes, inventory, countdowns, or payment readiness claims were added. The delivery estimate comes from the owner’s request and is qualified in the delivery dialog. Stripe remains paused pending deployment/configuration and seller stock confirmation.

## Verification

17 automated tests pass, including catalogue and image availability, bag normalisation and pricing, filters/sorting, Stripe account readiness, checkout gates and webhook validation. Browser checks cover desktop and mobile layouts, product photo switching, pack/colour prices, quantities, bag persistence after refresh, unavailable checkout, search, sorting, saved items, empty states, navigation and responsive overflow.
