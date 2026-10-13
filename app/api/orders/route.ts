import { NextRequest, NextResponse } from "next/server";
import { CUSTOMER_ORDER_COOKIE, receiptOrderIds } from "@/lib/customer-order-session";
import { paymentDb } from "@/lib/razorpay-server";
import { cleanOrderRow } from "@/lib/order-images";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const ids = receiptOrderIds(request.cookies.get(CUSTOMER_ORDER_COOKIE)?.value);
  if (!ids.length) return NextResponse.json({ orders: [] }, { headers: { "Cache-Control": "private, no-store" } });
  try {
    const { data, error } = await paymentDb().from("orders").select("*").in("id", ids).order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ orders: (data || []).map(cleanOrderRow) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "Could not load your order receipts." }, { status: 500 }); }
}
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(CUSTOMER_ORDER_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
