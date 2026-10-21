# Reliable payment confirmation

Order numbers retain the `KAAVU00002` format. A private counter row is incremented inside the stock/order transaction; concurrent checkouts serialize on that row. Existing numbers are preserved, and allocation starts after the largest saved KAAVU number. Numbers grow beyond five digits when needed without truncation. Failed transactions roll back the counter, inventory, insertion and payment link together.

The payment-attempt row is locked during finalization. Repeating verification returns the same saved order and does not deduct stock again. Old order numbers saved inside pending attempts are ignored. Existing payment-linked orders can have their attempt linkage repaired without recreating the order. Notification dispatch is only attempted for a newly created order.

## Deployment

1. Apply `migrations/reliable-order-confirmation.sql` in Supabase SQL Editor after the size/color inventory and Razorpay migrations. It changes functions and adds a private counter/reconciliation metadata. It does not change existing order numbers or finalize payments by itself.
2. Add `CRON_SECRET` from the local server environment to the production deployment. Keep the existing server Supabase and Razorpay keys. Redeploy the code and `vercel.json`.
3. Sign in to Admin → Orders and click Check pending payments once to recover existing captured payments. This is an actual database write for verified captured payments; do it after applying the SQL. Never request another payment from these customers.

The included Vercel cron runs daily at 00:00 UTC (05:30 IST), compatible with Hobby scheduling limits. For quicker production recovery, use an eligible plan and change the cron to `*/5 * * * *`, or configure your server scheduler to call GET `/api/payments/reconcile` every five minutes with `Authorization: Bearer <CRON_SECRET>`. No Razorpay webhook is needed. Changing code alone does not install a scheduler on a non-Vercel host.

The worker checks pending attempts against Razorpay's order-payment list, then independently verifies the captured payment's order ID, currency, amount and refund state before finalization. It does not capture unpaid/authorized payments or issue refunds. Jobs claim batches with expiring leases and use bounded concurrency. Stock failures and other confirmation errors remain pending with `reconcile_error` in `payment_attempts` for manual review. Leases expire after ten minutes if a process stops unexpectedly. Unpaid attempts are rescheduled rather than deleted.

This cannot reconstruct missing customer/cart data if a payment was made outside this app and has no stored payment attempt. Recovery uses the original attempt details and current stock validation. Refunded payments are never converted into new paid orders.
