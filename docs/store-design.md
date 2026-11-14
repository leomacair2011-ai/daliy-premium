# Store design refinement

The storefront now uses a light shopping canvas, compact global navigation, a two-tone store heading, visual category navigation, and a horizontal row of large product cards. Apple’s UK Store (https://www.apple.com/uk/store, reviewed 14 November 2026) informed the spatial hierarchy, restrained colours and product-led presentation. Daliy Premium retains its own wordmark, copy, catalogue and original studio assets.

The highlights support pointer controls, touch scrolling, keyboard arrows, visible focus and reduced motion. Product cards open the existing supplier-photo and pack-selection flow. Contact, sample reviews, account and owner inbox share the same visual treatment.

Builds fingerprint the shared scripts and styles to prevent returning browsers from mixing an updated document with stale assets. The existing Worker, D1, account authorization, support conversations and paused Stripe setup are preserved.

Validation: 25 automated tests; desktop at 1440px and mobile at 390px; carousel movement and disabled controls; category filtering, empty results and reset; selected pack pricing and bag; contact chat and review filtering; owner inbox layout. Fictional review disclosures remain visible.
