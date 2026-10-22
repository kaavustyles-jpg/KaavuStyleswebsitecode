import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { paymentDb } from "@/lib/razorpay-server";
import { mapDbOrderToOrder } from "@/lib/supabase";
import { buildShiprocketOrder, validateParcel } from "@/lib/shiprocket-payload";
import { pickupLocations, shiprocket } from "@/lib/shiprocket-server";
import { syncShiprocketOrder } from "@/lib/shiprocket-sync";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try { requireAdmin(request); } catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 401 }); }
  let claimed = false;
  try {
    const body = await request.json();
    const db = paymentDb();
    const { data: row, error } = await db.from("orders").select("*").eq("id", params.id).single();
    if (error || !row) throw new Error("Order was not found.");
    if (body.action === "sync") return NextResponse.json(await syncShiprocketOrder(row));
    if (row.shiprocket && !["Cancelled", "Mismatch", "Failed"].includes(row.shiprocket.status)) {
      return NextResponse.json(await syncShiprocketOrder(row));
    }
    const parcel = validateParcel(body);
    const payload = buildShiprocketOrder(mapDbOrderToOrder(row), parcel);
    const locations = await pickupLocations();
    if (!locations.some((location: any) => location.name === parcel.pickupLocation)) throw new Error("This pickup location is not registered in Shiprocket.");
    const { data: claim, error: claimError } = await db.rpc("begin_shiprocket_attempt", { target_order_id: params.id, expected_shipping: row.shiprocket || null, parcel_details: parcel });
    if (claimError || !claim?.reference) throw new Error("Could not reserve the shipment. Apply shiprocket-replacements.sql, reload the order, and retry.");
    claimed = true;
    const result = await shiprocket("orders/create/adhoc", { ...payload, order_id: claim.reference });
    if (!result.order_id || !result.shipment_id) throw new Error("Shiprocket did not return shipment IDs. Use Refresh Shiprocket status to check this request.");
    const shipping = { ...claim, status: "Created", orderId: result.order_id, shipmentId: result.shipment_id, remoteStatus: result.new_order_status || "NEW", createdAt: new Date().toISOString() };
    const { data: updated, error: saveError } = await db.from("orders").update({ shiprocket: shipping, status: "Processing" }).eq("id", params.id).eq("shiprocket->>reference", claim.reference).select("*").single();
    if (saveError || !updated) throw new Error("Shiprocket accepted the order but saving its link failed. Use Refresh Shiprocket status; do not create another shipment.");
    // Creation is not dispatch: no Shipped notification is sent here.
    return NextResponse.json({ shipping, orderStatus: "Processing" });
  } catch (error) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : "Could not create shipment.") + (claimed ? " Refresh this shipment before retrying." : "") }, { status: 400 });
  }
}
