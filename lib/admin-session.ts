import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

export const ADMIN_COOKIE = "kaavu_admin_session";
export function signAdminSession(expires: number) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("Admin session secret is not configured.");
  return `${expires}.${createHmac("sha256", secret).update(String(expires)).digest("hex")}`;
}
export function requireAdmin(request: NextRequest) {
  const saved = request.cookies.get(ADMIN_COOKIE)?.value || "";
  const [expires, signature] = saved.split(".");
  if (!/^\d+$/.test(expires || "") || !/^[a-f0-9]{64}$/.test(signature || "") || Number(expires) <= Date.now()) throw new Error("Please sign in to the admin panel again.");
  const expected = signAdminSession(Number(expires)).split(".")[1];
  if (!timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"))) throw new Error("Please sign in to the admin panel again.");
  if (request.method !== "GET") {
    const origin = request.headers.get("origin");
    if (!origin || new URL(origin).host !== request.headers.get("host")) throw new Error("Invalid admin request origin.");
  }
}
