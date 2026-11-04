# Savdochi

Next.js + MongoDB wholesale ordering MVP.

## Run

1. `npm ci`
2. Copy `.env.example` to `.env.local` and configure `MONGODB_URI` and `AUTH_SECRET`.
3. `npm run dev`

MongoDB must support transactions (Atlas or a replica set). Existing users are preserved. Product and order collections are created automatically. Never commit environment secrets.

## MVP

- Cookie login and buyer/seller roles.
- Client navigation preserves the mounted app and drafts, with no redundant server navigation or loading-screen flashes. Concurrent GETs are deduplicated and bounded by a timeout.
- URL-based navigation with browser Back/Forward, refreshable product links and catalog filters preserved in query parameters.
- Public catalog with category, supplier and text filters.
- Seller-owned product create/edit/archive, unit price, available stock and minimum quantity.
- Account-based server cart: stock is reserved for 72 hours when added, edits retain the original deadline, removal releases stock. Guests sign in before reserving.
- Expired holds are returned transactionally before inventory/cart reads and writes; no cron or destructive TTL index is required. Visible inventory/order panels refresh quietly every 5 seconds after the previous request completes; chat messages check every 2 seconds. Hidden tabs pause, focus/reconnect refreshes immediately.
- Checkout consumes existing holds without deducting stock again; cancellation restores stock once.
- Direct quantity entry with stock/minimum validation and address/phone checkout.
- Optional Leaflet delivery map with device geolocation, click-to-select and manual coordinates.
- Partner directory built from orders and conversations.
- Private buyer–seller business chat with retry deduplication, older-message pagination and periodic refresh.
- Atomic multi-seller checkout: authoritative database prices, reservation consumption and idempotent request IDs.
- Seller statuses: pending → confirmed → shipped → delivered; cancellation before shipping restores stock once.
- Buyer cancellation while pending and private order history. Order item snapshots survive product edits/deletion.

Stock shown in the seller form is available stock, excluding already reserved orders. Removing a product archives it. Payment and delivery are agreed directly with the seller; online payments are not implemented. Device location requires HTTPS and browser permission; manual map selection remains available.

## Verification

- `npm test` checks validation and allowed status transitions.
- `npm run build` checks production compilation.
- `SAVDOCHI_TEST_URL=<url> npm run test:integration` runs actual registration, product and order requests. **Use only a disposable database**: it creates test accounts/orders/products. It covers seller isolation, buyer permissions, transaction rollback, concurrent stock reservations, idempotent checkout, cancellation, price snapshots and session recovery.

## Business workspace update

- Role-specific overview and separate product, order, partner, reservation, report, notification, support and settings routes.
- Company/store contact profiles; seller brands, delivery areas/days/lead time, fees/free threshold, minimum order value and payment methods. Checkout validates current terms and computes the total on the server.
- Compressed product images served separately with cache headers, structured packaging, volume price tiers and accepted-partner discounts. Excel `.xlsx` imports use a template, validation preview, up to 50 rows and atomic, retry-safe creation.
- Partnership requests with recipient acceptance/rejection; seller-defined discounts/terms for accepted partners. Existing trading contacts remain visible.
- Seller reservation visibility and configurable per-shop quantity limits or partner-only reservations.
- Order change proposals for reduced quantities, prices, fees and delivery dates; buyer accepts/rejects. Accepted reductions return the difference to stock. Order history, cancellation reasons, buyer receipt, manual payment reporting/confirmation and refund receipt tracking. This does not transfer money or verify bank payments.
- Favorites and repeat orders. Reorders preserve existing cart quantities and explicitly report unavailable items.
- In-app notifications, unread chat counts and order-linked messages; chat/notification refresh pauses while hidden. Reservation reminders appear when the buyer's notification feed is checked within six hours of expiry; no unattended scheduler is configured.
- Recovery-code password reset, password changes invalidate other sessions, hashed database-backed authentication attempt limits. Users must first generate and securely save a recovery code in settings; email reset delivery is not configured.
- Admin-only business verification, product archival endpoint and support replies. `ADMIN_EMAILS` must explicitly list the owner's **existing application account**; there is no public administrator signup or automatic privilege grant.

### Optional Telegram activation

Set `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME` (without `@`) and a random `TELEGRAM_WEBHOOK_SECRET` in Vercel environment settings, then redeploy. Register the bot webhook at `APP_ORIGIN/api/telegram/webhook` using the same secret token through Telegram's `setWebhook` API. Never put tokens in source control, URLs shared with others, or chat. Users connect their own private chat using a ten-minute, one-time link in Settings. Notifications are delivered after committed application actions; temporary delivery failures remain pending for a later notification event. Telegram delivery is not a guaranteed scheduling service.

### Rollout and operations

Existing data remains valid; additive fields have defaults. MongoDB replica-set transactions remain required. Do not delete expired reservations with a TTL index: inventory is released inside a transaction before inventory/cart operations. Configure a moderator before promising response times for support or verification. Test with pilot companies and shops before wider launch; live polling is not an offline or push-delivery guarantee.

`SAVDOCHI_TEST_URL=<disposable deployment URL> SAVDOCHI_ALLOW_TEST_WRITES=1 python tests/business-integration.py` exercises profiles, partner acceptance/discounts, tier pricing, reservation limits, total validation, proposal stock conservation, chat unread/ownership, receipt/payment reports, repeat orders, support, import idempotency and one-time account recovery against the actual HTTP API. It creates synthetic accounts/orders and archives its test products afterward; use a disposable database for repeat CI runs.

## Demo accounts and session rollout

`/login?demo=seller` and `/login?demo=buyer` prepare two shared public demo accounts and prefill login inputs. Setup is idempotent and transactional: two role-specific profiles, three products, an accepted partnership and a chat. The demo banner identifies the active role; use fictional data only. Demo commerce is separated from real catalogs, reservations, orders and partner/chat requests. Demo accounts cannot change shared credentials, link personal Telegram accounts or request business verification.

The session epoch in `lib/auth.js` invalidates all pre-rollout signed sessions once. Existing accounts and business data are retained; users can sign in again. Keep the epoch in future releases so old sessions remain invalid.
