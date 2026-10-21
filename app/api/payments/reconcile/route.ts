import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { requireAdmin } from "@/lib/admin-session";
import { reconcilePayments } from "@/lib/payment-reconciliation";
export const runtime = "nodejs";
export const maxDuration = 60;
async function run() {
  try { return NextResponse.json(await reconcilePayments(), { headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Reconciliation failed." }, { status: 500 }); }
}
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  if (!secret || Buffer.byteLength(supplied) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return run();
}
export async function POST(request: NextRequest) {
  try { requireAdmin(request); } catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 401 }); }
  return run();
}
