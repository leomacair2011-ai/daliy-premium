# Daily Premium Stripe connection

Confirmed merchant: **Avenline**, account `acct_1UPkgQImiZgm5yMi`, as identified through the Stripe connection and confirmed by the user.

Only Stripe is supported. No Apex credentials or account IDs are copied. The server verifies the configured key belongs to the exact Daily Premium account ID before creating a Checkout Session. Stripe selects eligible payment methods dynamically; cryptocurrency and PayPal are explicitly excluded. No other payment processor is integrated.

The Sites URL is a private static design preview. The repository also contains a Netlify server integration. Deploy this repository to Netlify to use the `/api/*` payment routes; importing it does not automatically connect a Stripe account.

Set these names in the host's secret settings, never GitHub source or chat:

- `STRIPE_SECRET_KEY`: a restricted API key (`rk_…`) from the confirmed Daily Premium Stripe account, with only the permissions required by this integration. Use a separate Stripe sandbox for development and CI. Keep the key in hosting secret settings, never in this repository or chat.
The confirmed account ID is pinned in `server/merchant.json`; it is not a secret.
- `STRIPE_WEBHOOK_SECRET`: for this new host's `/api/stripe-webhook` endpoint. A new endpoint has its own signing secret even when the account is the same.
- `PAYMENTS_ENABLED=true`: explicit activation.
- `PUBLIC_CHECKOUT_READY=true`: only after the host is publicly reachable, including the webhook.
- `FULFILMENT_READY=true`: only after inventory allocation and fulfilment have been implemented and verified.

Register `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, and `checkout.session.expired`. Server verifies signatures and compares amount/currency before marking an order paid. Paid orders cannot be downgraded by stale events. Session creation uses an idempotency key. Orders are private Netlify Blobs records; client lookup returns status only.

Confirm `shipping.countries` and `shipping.fee` in `store/settings.json`. Confirm store inventory per product/variant, replace `availability: unconfirmed`, and set real sellable stock. Source quantity is never treated as this store's inventory. This base validates stock per checkout but does not reserve or decrement inventory across simultaneous orders or dispatch goods. Implement that operational workflow before setting `FULFILMENT_READY`.

Use the same Daily Premium account, not its public checkout URL, publishable key or a copied checkout session link. No secrets can be obtained from the public website. The Stripe plugin is connected to Avenline. It does not provision the website runtime credential. Host-secret configuration, backend deployment, and a sandbox checkout/webhook round trip remain outstanding.

References: https://docs.stripe.com/api/checkout/sessions/create and https://docs.stripe.com/events/manage-webhook-endpoints
