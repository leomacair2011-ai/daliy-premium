# Contact, accounts and live chat

Implemented 14 November 2026. The existing Site is upgraded from static hosting to a Worker with a provisioned D1 database. The Site remains owner-private; no access permissions were widened. Visitors can use these features once the owner explicitly shares or publishes the store to the intended audience.

## Contact

The only external contact supplied and authorised is WhatsApp: **+44 7436 563406**, linked to `https://wa.me/447436563406`. Email and social profiles are intentionally absent.

## Owner dashboard

Open `/account`, sign in with the ChatGPT account that owns this Site, and choose **Open owner dashboard**. `/owner` contains the inbox, unread indicators, a private conversation view, reply composer and resolution control. Enable **Available for live chat** and keep the dashboard open. Presence expires 30 seconds after the last heartbeat; messages can still be sent while the owner is away. The inbox and open conversations refresh every five seconds while the browser tab is visible.

Owner access is checked on every server request using Sites-authenticated identity headers and the owner email allowlist configured as a secret runtime value. It is never determined by a browser flag, URL, IP address or user-supplied role. The trusted Site identity ID is used as the durable signed-in visitor key.

## Returning visitors

Sites manages the authenticated browser session, sign-in, sign-out and expiry. Users remain signed in until that session expires or they sign out. The application does not record IP addresses for login or claim IP-based account ownership.

Anonymous chat uses a 30-day `__Host-dp_chat` cookie with Secure, HttpOnly and SameSite=Lax protections. The database stores a SHA-256 digest, not the cookie token. A guest conversation is remembered on that browser; it is not automatically merged into a signed-in account. Clearing cookies or switching browsers does not carry a guest conversation over.

Chat messages and the voluntarily supplied display name are stored in D1. Each visitor sees only their conversation. The owner sees the inbox. Messages are text-only, escaped on rendering, limited to 2,000 characters and twelve messages per minute per conversation. Writes require a matching Origin. Client-generated message identifiers prevent duplicate messages on retry. Messages remain stored for support; there is no automated retention/deletion job yet.

## Preview reviews

`/reviews` has six fictional examples, labelled globally and individually. No verified-purchase badges, real-customer claims, aggregate rating, or review structured data is emitted. Replace the sample content with authentic feedback before using the page as customer evidence.

## Local validation

`npm run build` then `npm run dev` uses the same Worker with a local SQLite adapter. QA-only identity routes exist exclusively in `scripts/serve.mjs`: `/__preview/login?role=owner`, `customer`, or `guest`. They are **not** compiled into the deployed Worker. Local test messages are stored only in the ignored `.openai/local/support-preview.sqlite` file and are not shipped or seeded into production.

Twenty-five automated checks cover the store, Stripe scaffolding, owner authorisation, visitor isolation, secure guest cookies, retry idempotency, online expiry, replies, reopened conversations, limits and failed database connections. Browser QA verifies contact layout, fictional-review labels and filtering, mobile layout, message sending, owner replies and guest history after refresh.

## Remaining limitations

This Site's private audience means only the current owner can visit until its sharing policy is deliberately changed. No email notifications, attachment uploads or push notifications are implemented. The owner must keep the inbox open to appear online and receive immediate updates. Payments remain paused, independently of chat. The optional Netlify static build does not include the Sites chat backend.
