import { mapDbOrderToOrder } from "./supabase";
import type { Order } from "./mockData";

type CheckoutOrder = Omit<Order, "id" | "orderNumber" | "createdAt" | "totalAmount"> & { couponCode?: string };
type PaymentResult = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayOptions = {
  key: string; order_id: string; amount: number; currency: string; name: string;
  prefill: { name: string; email: string; contact: string };
  handler: (result: PaymentResult) => void;
  modal: { ondismiss: () => void }; theme: { color: string };
};
declare global {
  interface Window { Razorpay?: new (options: RazorpayOptions) => { open(): void; on(event: string, callback: () => void): void }; }
}
let loading: Promise<void> | undefined;
async function loadCheckout() {
  if (window.Razorpay) return;
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => { script.remove(); loading = undefined; reject(new Error("Could not load Razorpay. Check your connection and try again.")); };
    document.head.appendChild(script);
  });
  await loading;
}
async function post(url: string, data: unknown) {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Payment request failed.");
  return result;
}
export async function payWithRazorpay(order: CheckoutOrder): Promise<Order> {
  const recovered = await recoverRazorpayOrder();
  if (recovered) return recovered;
  await loadCheckout();
  const created = await post("/api/payments/create", order);
  return new Promise((resolve, reject) => {
    let verifying = false;
    const checkout = new window.Razorpay!({
      key: created.keyId, order_id: created.id, amount: created.amount, currency: "INR", name: "Kaavu Styless",
      prefill: { name: order.customerName, email: order.customerEmail, contact: order.customerPhone },
      theme: { color: "#70162d" },
      modal: { ondismiss: () => { if (!verifying) reject(new Error("Payment cancelled. Your cart is saved.")); } },
      handler: async result => {
        verifying = true;
        // Keep the receipt for recovery if the browser loses its connection after payment.
        try {
          try { localStorage.setItem("ks_pending_payment", JSON.stringify(result)); } catch { /* Continue verification when browser storage is unavailable. */ }
          const verified = await post("/api/payments/verify", result);
          try { localStorage.removeItem("ks_pending_payment"); } catch { /* The server makes verification idempotent. */ }
          resolve(mapDbOrderToOrder(verified.order));
        } catch (error) { reject(error); }
      },
    });
    checkout.open();
  });
}
export async function recoverRazorpayOrder(): Promise<Order | null> {
  let saved: string | null = null;
  try { saved = localStorage.getItem("ks_pending_payment"); } catch { return null; }
  if (!saved) return null;
  const verified = await post("/api/payments/verify", JSON.parse(saved));
  try { localStorage.removeItem("ks_pending_payment"); } catch { /* Safe to verify again. */ }
  return mapDbOrderToOrder(verified.order);
}
