import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { paymentDb } from "@/lib/razorpay-server";
import { mapDbOrderToOrder } from "@/lib/supabase";
import { buildShiprocketOrder, validateParcel } from "@/lib/shiprocket-payload";
import { pickupLocations, shiprocket } from "@/lib/shiprocket-server";
export const runtime = "nodejs";
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try { requireAdmin(request); } catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 401 }); }
  let claimed = false;
  try {
    const db = paymentDb();
    const parcel = validateParcel(await request.json());
    const { data: row, error } = await db.from("orders").select("*").eq("id", params.id).single();
    if (error || !row) throw new Error("Order was not found.");
    if (row.shiprocket?.orderId) return NextResponse.json({ shipping: row.shiprocket });
    const payload = buildShiprocketOrder(mapDbOrderToOrder(row), parcel);
    const locations = await pickupLocations();
    if (!locations.some((location: any) => location.name === parcel.pickupLocation)) throw new Error("This pickup location is not registered in Shiprocket.");
    const { data: acquired, error: claimError } = await db.rpc("claim_shiprocket_order", { target_order_id: params.id, parcel_details: parcel });
    if (claimError) throw new Error("Apply the Shiprocket SQL migration before creating a shipment.");
    if (!acquired) throw new Error("This order is already being sent. Check Shiprocket before trying again.");
    claimed = true;
    const result = await shiprocket("orders/create/adhoc", payload);
    if (!result.order_id || !result.shipment_id) throw new Error("Shiprocket did not return shipment IDs. Check the order in Shiprocket.");
    const shipping = { ...parcel, status: "Created", orderId: result.order_id, shipmentId: result.shipment_id, createdAt: new Date().toISOString() };
    const { data: updatedOrder, error: saveError } = await db.from("orders").update({ shiprocket: shipping, status: "Shipped" }).eq("id", params.id).select("*").single();
    if (saveError) throw new Error(`Shiprocket order ${result.order_id} was created, but saving its details failed. Do not create it again; contact support.`);

    // Dispatch shipping email to customer ("order people") and shipping desk
    try {
      const { sendStatusUpdateEmail } = await import("@/lib/email-service");
      void sendStatusUpdateEmail(updatedOrder || row, "Shipped", {
        shipmentId: result.shipment_id,
        orderId: result.order_id,
        pickupLocation: parcel.pickupLocation,
      });
    } catch (e) {
      console.error("Could not dispatch Shiprocket shipping update email:", e);
    }

    return NextResponse.json({ shipping });
  } catch (error) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : "Could not create shipment.") + (claimed ? " Check Shiprocket using your order number before retrying; the request may already have succeeded." : "") }, { status: 400 });
  }
}
