import "server-only";
import { paymentDb, razorpay, finalizePayment } from "./razorpay-server";

type Dependencies = { db: ReturnType<typeof paymentDb>; gateway: typeof razorpay; finalize: typeof finalizePayment; now: () => number };
export async function reconcilePayments(overrides: Partial<Dependencies> = {}) {
  const { db, gateway, finalize, now } = { db: paymentDb(), gateway: razorpay, finalize: finalizePayment, now: Date.now, ...overrides };
  const deadline = now() + 40000;
  const summary = { checked: 0, recovered: 0, waiting: 0, failed: 0, deferred: 0, issues: [] as { gatewayOrderId: string; message: string }[] };
  for (let batch = 0; batch < 10 && now() < deadline; batch++) {
    const { data: attempts, error } = await db.rpc("claim_payment_reconciliation", { batch_size: 10 });
    if (error) throw new Error("Could not claim pending payments. Apply reliable-order-confirmation.sql first.");
    if (!attempts?.length) break;
    let nextIndex = 0;
    await Promise.all(Array.from({ length: Math.min(4, attempts.length) }, async () => {
      while (nextIndex < attempts.length) {
        const attempt = attempts[nextIndex++];
        if (now() >= deadline) { summary.deferred++; continue; }
        summary.checked++;
        let retryDelay = 15 * 60000;
        let failure: string | null = null;
        try {
          const result = await gateway(`orders/${encodeURIComponent(attempt.razorpay_order_id)}/payments`);
          if (!Array.isArray(result.items)) throw new Error("Razorpay returned an invalid payment list.");
          const payment = result.items.find((item: any) => item.status === "captured" && !item.amount_refunded);
          if (payment) {
            await finalize(attempt.razorpay_order_id, payment.id);
            summary.recovered++;
          } else {
            summary.waiting++;
            retryDelay = now() - Date.parse(attempt.created_at) > 86400000 ? 86400000 : 5 * 60000;
          }
        } catch (error) {
          failure = error instanceof Error ? error.message : "Payment reconciliation failed.";
          summary.failed++;
          summary.issues.push({ gatewayOrderId: attempt.razorpay_order_id, message: failure });
        }
        const { error: recordError } = await db.from("payment_attempts").update({ reconcile_after: new Date(now() + retryDelay).toISOString(), last_reconciled_at: new Date(now()).toISOString(), reconcile_error: failure }).eq("razorpay_order_id", attempt.razorpay_order_id).is("order_id", null);
        if (recordError) console.error("Could not record payment reconciliation result", { gatewayOrderId: attempt.razorpay_order_id, code: recordError.code });
      }
    }));
  }
  return summary;
}
