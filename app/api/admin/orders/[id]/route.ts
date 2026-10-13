import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { paymentDb } from "@/lib/razorpay-server";
import { cleanOrderRow } from "@/lib/order-images";
export const runtime = "nodejs";
async function authorize(request: NextRequest) {
  try { requireAdmin(request); return null; } catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 401 }); }
}
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const rejected = await authorize(request); if (rejected) return rejected;
  try {
    const column = /^[0-9a-f-]{36}$/i.test(params.id) ? "id" : "order_number";
    const { data, error } = await paymentDb().from("orders").select("*").eq(column, params.id).maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    return NextResponse.json({ order: cleanOrderRow(data) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "Could not load this order." }, { status: 500 }); }
}
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const rejected = await authorize(request); if (rejected) return rejected;
  try {
    const { status } = await request.json();
    if (!["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].includes(status)) return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
    const { data, error } = await paymentDb().from("orders").update({ status }).eq("id", params.id).select("*").single();
    if (error) throw error;
    return NextResponse.json({ order: cleanOrderRow(data) });
  } catch { return NextResponse.json({ error: "Could not update this order." }, { status: 500 }); }
}
