import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
export const CUSTOMER_ORDER_COOKIE = "kaavu_order_receipts";
function signature(value: string) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("Order receipt session is not configured.");
  return createHmac("sha256", secret).update(`customer-orders:${value}`).digest("hex");
}
export function receiptOrderIds(cookie: string | undefined): string[] {
  try {
    const [body, supplied] = (cookie || "").split(".");
    if (!/^[a-f0-9]{64}$/.test(supplied || "")) return [];
    if (!timingSafeEqual(Buffer.from(signature(body), "hex"), Buffer.from(supplied, "hex"))) return [];
    const decoded = JSON.parse(Buffer.from(body, "base64url").toString());
    if (decoded.expires < Date.now() || !Array.isArray(decoded.ids)) return [];
    return decoded.ids.filter((id: unknown) => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id)).slice(-50);
  } catch { return []; }
}
export function addOrderReceipt(cookie: string | undefined, orderId: string) {
  const ids = Array.from(new Set([...receiptOrderIds(cookie), orderId])).slice(-50);
  const body = Buffer.from(JSON.stringify({ ids, expires: Date.now() + 30 * 86400000 })).toString("base64url");
  return `${body}.${signature(body)}`;
}
