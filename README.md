# Savdochi

Next.js + MongoDB wholesale ordering MVP.

## Run

1. `npm ci`
2. Copy `.env.example` to `.env.local` and configure `MONGODB_URI` and `AUTH_SECRET`.
3. `npm run dev`

MongoDB must support transactions (Atlas or a replica set). Existing users are preserved. Product and order collections are created automatically. Never commit environment secrets.

## MVP

- Cookie login and buyer/seller roles.
- Public catalog with category, supplier and text filters.
- Seller-owned product create/edit/archive, unit price, available stock and minimum quantity.
- Browser-persisted cart, quantity controls and address/phone checkout.
- Atomic multi-seller checkout: authoritative database prices, stock reservation and idempotent request IDs.
- Seller statuses: pending → confirmed → shipped → delivered; cancellation before shipping restores stock once.
- Buyer cancellation while pending and private order history. Order item snapshots survive product edits/deletion.

Stock shown in the seller form is available stock, excluding already reserved orders. Removing a product archives it. Payment and delivery are agreed directly with the seller; online payments and chat are not implemented.

## Verification

- `npm test` checks validation and allowed status transitions.
- `npm run build` checks production compilation.
- `SAVDOCHI_TEST_URL=<url> npm run test:integration` runs actual registration, product and order requests. **Use only a disposable database**: it creates test accounts/orders/products. It covers seller isolation, buyer permissions, transaction rollback, concurrent stock reservations, idempotent checkout, cancellation, price snapshots and session recovery.
