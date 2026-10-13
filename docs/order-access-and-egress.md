# Order access and homepage bandwidth

The storefront provider no longer fetches orders. Admin orders and invoices use cookie-authenticated server endpoints. Status writes also use the server; direct browser order insertion has been disabled for configured Supabase projects in favor of verified Razorpay checkout.

Apply in this order:

1. Deploy this code with `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_LOGIN_EMAILS`, `ADMIN_LOGIN_PASSWORD`, and `ADMIN_SESSION_SECRET` set in the server environment. Keep the public URL/anon key as public settings; the service-role key must never be public.
2. Restart/sign in again at `/admin/login` and verify the order list and invoice endpoints work with the server session.
3. Run `migrations/private-orders.sql` in Supabase SQL Editor. This removes all public order policies, revokes browser access and restricts the inventory/order RPC to the server. The migration does not delete orders.
4. Run `node scripts/migrate-order-images.cjs` to inspect old embedded images. Run `node scripts/migrate-order-images.cjs --apply` to back up affected item arrays locally, upload their original images to the existing public `images` bucket, and replace only item image values with URLs. Keep the backup private. The script is safe to retry; uploaded filenames are content hashes. No historical prices, customer details, payments or order IDs change.
5. Check a signed-out homepage in Network: there must be no orders request. Direct public Supabase order reads must fail after the SQL migration. Check an admin invoice, status update and verified test checkout again.

Old embedded images are removed from admin API responses immediately using a small logo fallback, even before running the cleanup. New order snapshots only contain image URLs; legacy embedded product images are uploaded to Storage before checkout records are saved, and missing/invalid sources use the logo fallback. The database guard also rejects embedded images in new or changed item arrays.

Customer order history is limited to signed receipt IDs issued after verified payment in that browser. It never authorizes access merely from an email supplied by the browser. Older orders or orders from another device are still available to authenticated admins; full customer account history requires verified customer authentication and ownership mapping, which the existing local-only customer login does not provide.

This reduces future bandwidth. Recorded egress cannot be erased. No remote cleanup or access migration is run automatically by the application.
