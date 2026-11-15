# Mello

Mello is a storefront with catalogue search, product options, saved items, a shopping bag, and customer support. The local preview starts with the sample catalogue in this repository. The hosted store manages its catalogue and uploaded product images separately.

## Run

Requires Node 22 or newer. Run `npm ci` first. The frontend has no JavaScript framework; Stripe and Netlify dependencies support the optional payment backend.

```
npm ci
npm run build
npm test
npm run dev
```

Open http://127.0.0.1:3187. The standard build produces a Sites Worker with embedded assets and D1 support chat. The GitHub repository and Sites audience remain private. See `docs/live-chat.md` for owner access and local QA.

## What works

Search, category filters, price/name sorting, saved products, option selection, quantities, persistent shopping bag, item removal, pack totals, empty states, URL-preserved catalogue filters, responsive layout, native dialogs and keyboard controls.

## Before taking payments

This is a working catalogue and bag preview, not a live order-processing service. Checkout is explicitly paused. No card details are collected. Contact chat stores only the display name and messages the visitor chooses to send. `checkoutEnabled` is informational; changing it does not create a payment integration.

A Stripe-only Netlify backend is included. It is prepared to connect to the existing **Daily Premium Stripe account**, not Apex’s account. See `docs/stripe-setup.md`. No credentials have been copied or connected. Confirm inventory, fulfilment, selling prices and store terms before opening orders. The Sites URL runs the chat/account Worker, with checkout still paused. The optional Netlify static build (`npm run build:static`) can run the payment functions, but does not include the Sites chat backend.

## Content

Edit `store/products.json` and rebuild. Source titles, URLs, options and supplier stock snapshots are retained for audit. `stock: 0` and `availability: unconfirmed` refer to sellable stock in this new store, not the source site's claimed quantity. See `docs/import-notes.md` for pricing discrepancies.

Original supplier photography lives in `src/assets/products/` and is mapped in each product’s `images` array. Studio artwork lives in `src/assets/studio/`; `studioArt` selects its atlas position. See `docs/artwork.md` for final prompts, provenance and paths. Replace these images with commissioned photography when available.

Edit the announcement messages in `src/index.html`. The bar is shared across customer pages and rotates between delivery enquiries, GBP pricing, and WhatsApp support. Storefront styles live in `src/storefront.css`.

The browser saves shopping bag and favourites locally, separately from Apex Access. Corrupt or obsolete basket lines are rejected, and prices are recalculated from the catalogue on load. Fonts use the system stack; storefront assets are hosted locally.

Contact, accounts, owner dashboard and chat: `docs/live-chat.md`. The reviews page displays an empty state until genuine customer reviews are available.

Research: `docs/design-research.md`. Tests cover catalogue integrity, invalid stored basket data, numerical totals, filter combinations and the paused checkout state.

## Admin uploads and orders

The owner dashboard now includes **Products**, **Orders**, and **Messages**. Product photos are stored in R2 and listings in D1; changes are available without rebuilding. Orders retain their purchase-time details and support private notes, tracking references and fulfilment status updates. See [the admin guide](docs/admin-guide.md) for daily use and the remaining Stripe launch requirements.
