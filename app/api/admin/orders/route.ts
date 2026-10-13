import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { paymentDb } from "@/lib/razorpay-server";
import { cleanOrderRow } from "@/lib/order-images";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  try { requireAdmin(request); } catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 401 }); }
  try {
    const result = [];
    const db = paymentDb();
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await db.from("orders").select("*").order("created_at", { ascending: false }).order("id").range(offset, offset + 499);
      if (error) throw error;
      result.push(...(data || []).map(cleanOrderRow));
      if (!data || data.length < 500) break;
    }
    return NextResponse.json({ orders: result }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "Could not load admin orders." }, { status: 500 }); }
}
