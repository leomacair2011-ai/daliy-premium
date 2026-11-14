# Managing Daliy Premium

Open https://daliy-premium.zany-sugar-0629.chatgpt.site/account, sign in with the owner account, and choose **Open owner dashboard**. Direct link: https://daliy-premium.zany-sugar-0629.chatgpt.site/owner.

## Products

- Select **Products → Add product**, or choose an existing listing to edit.
- Enter its name, category, description, and options. Choose a suggested category or type your own; published categories appear in the shop filters. Prices are GBP per pack; stock is a count of packs.
- Upload JPEG, PNG or WebP photos, up to 5 MB per photo and 10 photos per product. Choose **Use as cover** to change the first image.
- Save as **Draft** while preparing the listing. Choose **Published** and save when it is ready to appear in the shop. Choose **Archived** to hide it without deleting its record.
- Confirm stock only after checking the quantities. Publishing a listing does not enable Stripe or take payments.
- Changes persist in the store database; photos persist in its object storage. No code rebuild is needed. Photos attached only to draft/archived listings are available to the owner, not other visitors.
- Concurrent edits are detected. If another tab saved first, reopen the listing before editing again. Unsaved edits prompt before leaving.

## Orders

**Orders** shows customer names, email addresses, purchased options, quantities, totals, delivery addresses, payment states, and fulfilment states. Search by order ID, customer name or email. Filter by payment or fulfilment status. The list refreshes every 30 seconds while visible; **Refresh orders** refreshes immediately.

Open an order to add private notes, a carrier/tracking reference, or change fulfilment to Processing, Shipped or Delivered. Only Stripe-confirmed paid orders can be marked for fulfilment. Payment status cannot be changed in the browser. Cancelling fulfilment does not refund a payment; refunds must be handled in Stripe.

Orders are created by this store's Stripe checkout and confirmed by a signature-verified webhook. Historical orders from dailypremium1.com or other stores are not imported. There are no fabricated orders in the published database.

Stripe checkout is still paused. Before accepting orders, configure the Avenline account's runtime Stripe credentials and required webhook, delivery countries/fees, confirmed stock and the existing launch flags. The private Sites audience must also be addressed before public shoppers can access checkout. The admin system itself works now; a live payment has not been taken during testing.

## Messages

The existing customer chat is under **Messages**. Your availability control and reply workflow remain intact.

## Technical notes

- D1 migration `0001_warm_wrecker.sql` adds catalogue overrides, media metadata and orders. Existing support tables are preserved.
- R2 binding `BUCKET` stores photos; D1 binding `DB` stores listing and order records.
- Every admin API is authorized server-side against the owner identity. Writes require the store origin, and requests have size/type limits.
- Listings use optimistic revisions to prevent lost updates. Order snapshots retain purchase-time prices even after product edits.
- Checkout remains tied to the confirmed Avenline merchant account. The Sites Worker now routes the existing checkout, webhook and payment-status handlers to D1.
- Local-only QA order/product fixtures reside in ignored preview storage and are never deployed.
