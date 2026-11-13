# Daliy Premium

A professional shopping storefront based on the Apex Access visual direction. Nine imported Daily Premium products, six categories, and 54 pack/colour combinations. No photography is included yet.

## Run

Requires Node 22 or newer. No npm dependencies.

```
npm run build
npm test
npm run dev
```

Open http://127.0.0.1:3187. Deploy `dist/` as a static site. The GitHub repository is private; the Sites preview is owner-only.

## What works

Search, category filters, price/name sorting, saved products, option selection, quantities, persistent shopping bag, item removal, pack totals, empty states, URL-preserved catalogue filters, responsive layout, native dialogs and keyboard controls.

## Before taking payments

This is a working catalogue and bag preview, not a live order-processing service. Checkout is explicitly paused. No card details or customer information are collected. `checkoutEnabled` is informational; changing it does not create a payment integration.

Connect a server-side payment provider, verified inventory and fulfilment process; confirm prices, specifications, support details and delivery/return terms before opening orders. The existing Apex backend is separate and its configuration was preserved. No credentials were copied.

## Content

Edit `store/products.json` and rebuild. Source titles, URLs, options and supplier stock snapshots are retained for audit. `stock: 0` and `availability: unconfirmed` refer to sellable stock in this new store, not the source site's claimed quantity. See `docs/import-notes.md` for pricing discrepancies.

Photography can be added later to `src/images/` and rendered in the existing product panels, keeping their dimensions to avoid layout shifts. Current image arrays are empty.

The browser saves shopping bag and favourites locally, separately from Apex Access. Corrupt or obsolete basket lines are rejected, and prices are recalculated from the catalogue on load. Google Fonts is the only third-party asset request; system-font fallbacks work if it is unavailable.

Research: `docs/design-research.md`. Tests cover catalogue integrity, invalid stored basket data, numerical totals, filter combinations and the paused checkout state.
