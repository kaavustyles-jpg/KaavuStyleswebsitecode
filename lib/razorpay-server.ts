import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";
import { mapDbProductToProduct } from "./supabase";
import { reduceInventory, resolveProductColor } from "./inventory";
import type { OrderItem } from "./mockData";
import { permanentOrderImage } from "./order-image-storage";

export function paymentDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Online payment setup is incomplete. Configure the server Supabase service-role key.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
export async function razorpay(path: string, body?: unknown) {
  const key = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key || !secret) throw new Error("Razorpay keys are not configured.");
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    method: body ? "POST" : "GET", cache: "no-store", signal: AbortSignal.timeout(10000),
    headers: { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.description || "Razorpay request failed.");
  return data;
}
export function validSignature(message: string, signature: string, secret: string) {
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(message).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}
export async function prepareOrder(input: any) {
  const db = paymentDb();
  for (const key of ["customerName", "customerEmail", "customerPhone", "shippingAddress", "city", "postalCode"]) {
    if (typeof input[key] !== "string" || !input[key].trim() || input[key].length > 1000) throw new Error("Please complete your delivery details.");
  }
  if (!Array.isArray(input.items) || !input.items.length || input.items.length > 100) throw new Error("Your cart is empty or invalid.");
  const { data, error } = await db.from("products").select("*").in("id", input.items.map((item: any) => item.productId));
  if (error) throw new Error("Could not check product prices and stock.");
  const products = (data || []).map(mapDbProductToProduct);
  const items: OrderItem[] = await Promise.all(input.items.map(async (item: any) => {
    const product = products.find(p => p.id === item.productId);
    if (!product || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) throw new Error("Invalid cart item.");
    const color = resolveProductColor(product, item.color);
    return { productId: product.id, name: product.name, price: product.price, quantity: item.quantity, size: item.size, color, image: await permanentOrderImage(db, product.colorImages?.[color]?.[0] || product.images[0]) };
  }));
  reduceInventory(products, items);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  let discount = 0;
  if (input.couponCode) {
    const { data: coupon, error: couponError } = await db.from("coupons").select("*").eq("code", String(input.couponCode).trim().toUpperCase()).single();
    const now = Date.now();
    if (couponError || !coupon || !coupon.is_active || subtotal < coupon.min_order_value || (coupon.valid_from && now < Date.parse(coupon.valid_from)) || (coupon.valid_until && now > Date.parse(coupon.valid_until)) || (coupon.usage_limit && coupon.times_used >= coupon.usage_limit)) throw new Error("This coupon is no longer available.");
    discount = coupon.discount_type === "percentage" ? Math.round(Math.min(subtotal * coupon.discount_value / 100, coupon.max_discount ?? Infinity)) : Math.min(subtotal, coupon.discount_value);
  }
  const totalAmount = Math.round(Math.max(0, subtotal - discount) * 100) / 100;
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) throw new Error("Online payments require a positive order total.");

  return { customerName: input.customerName.trim(), customerEmail: input.customerEmail.trim(), customerPhone: input.customerPhone.trim(), shippingAddress: input.shippingAddress.trim(), city: input.city.trim(), postalCode: input.postalCode.trim(), items, totalAmount, status: "Pending", ipAddress: "" };
}
export async function finalizePayment(orderId: string, paymentId: string) {
  const db = paymentDb();
  const { data: attempt, error } = await db.from("payment_attempts").select("*").eq("razorpay_order_id", orderId).single();
  if (error || !attempt) throw new Error("Payment order was not found.");
  const payment = await razorpay(`payments/${encodeURIComponent(paymentId)}`);
  if (payment.order_id !== orderId || payment.currency !== "INR" || payment.amount !== attempt.amount) throw new Error("Payment details do not match this order.");
  if (payment.amount_refunded > 0) throw new Error("This payment has been refunded; it needs manual review.");
  if (payment.status === "authorized") await razorpay(`payments/${encodeURIComponent(paymentId)}/capture`, { amount: attempt.amount, currency: "INR" });
  else if (payment.status !== "captured") throw new Error("Payment has not been captured yet.");
  const { data: order, error: saveError } = await db.rpc("finalize_razorpay_order", { gateway_order_id: orderId, gateway_payment_id: paymentId });
  if (saveError || !order) {
    console.error("Payment order confirmation failed", { paymentId, orderId, code: saveError?.code, message: saveError?.message });
    throw new Error(`Payment received (${paymentId}), but order confirmation is pending. Please contact support with this payment ID.`);
  }

  const created = order._created === true;
  delete order._created;

  // Dispatch direct email notifications to kaavustyles@gmail.com and customer
  try {
    if (!created) return order;
    const { sendOrderNotificationEmail } = await import("./email-service");
    void sendOrderNotificationEmail(order);
  } catch (emailErr) {
    console.error("Could not send order confirmation email in finalizePayment:", emailErr);
  }

  return order;
}
