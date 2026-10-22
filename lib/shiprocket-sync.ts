import "server-only";
import { paymentDb } from "./razorpay-server";
import { mapDbOrderToOrder } from "./supabase";
import { inspectShiprocketOrder } from "./shiprocket-status";
import { shiprocket } from "./shiprocket-server";

export async function syncShiprocketOrder(row: any) {
  const order = mapDbOrderToOrder(row);
  let remote: any;
  if (row.shiprocket?.orderId) {
    const result = await shiprocket(`orders/show/${encodeURIComponent(row.shiprocket.orderId)}`);
    remote = result.data;
  } else {
    const reference = row.shiprocket?.reference || row.order_number;
    const result = await shiprocket(`orders?filter_by=channel_order_id&filter=${encodeURIComponent(reference)}&per_page=100`);
    const matches = (Array.isArray(result.data) ? result.data : []).filter((item: any) => String(item.channel_order_id) === reference);
    if (matches.length > 1) throw new Error("Multiple Shiprocket records use this reference. Review them before creating another shipment.");
    remote = matches[0];
  }
  if (!remote?.id) throw new Error("No matching Shiprocket order was found. A new shipment has not been created. If a previous request is still pending, check Shiprocket before retrying.");
  const inspected = inspectShiprocketOrder(order, remote);
  const shipping = { ...row.shiprocket, ...inspected, orderId: Number(remote.id), checkedAt: new Date().toISOString() };
  delete shipping.orderStatus;
  // Optimistic comparison avoids overwriting a simultaneous replacement request.
  let update = paymentDb().from("orders").update({ shiprocket: shipping, status: inspected.orderStatus }).eq("id", row.id);
  update = row.shiprocket ? update.eq("shiprocket", JSON.stringify(row.shiprocket)) : update.is("shiprocket", null);
  const { data, error } = await update.select("*").single();
  if (error || !data) throw new Error("Could not save the refreshed shipment. Reload the order and retry.");
  return { shipping, orderStatus: inspected.orderStatus };
}
