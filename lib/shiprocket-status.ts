import type { Order } from "./mockData";
export function inspectShiprocketOrder(order: Order, remote: any) {
  const reference = String(remote.channel_order_id || "");
  const expected = order.shiprocket?.reference || order.orderNumber;
  const amount = remote.total ?? remote.sub_total;
  const email = typeof remote.customer_email === "string" ? remote.customer_email.trim().toLowerCase() : "";
  const remoteDate = Date.parse(remote.created_at || "");
  const oldPurchase = Number.isFinite(remoteDate) && remoteDate < Date.parse(order.createdAt) - 86400000;
  const explicitMismatch = reference !== expected || oldPurchase || (amount != null && Number.isFinite(Number(amount)) && Math.round(Number(amount) * 100) !== Math.round(order.totalAmount * 100)) || (email && email !== order.customerEmail.trim().toLowerCase());
  if (explicitMismatch) return { status: "Mismatch" as const, remoteStatus: String(remote.status || "Unknown"), orderStatus: order.status === "Shipped" ? "Processing" as const : order.status, error: "This Shiprocket record belongs to a different purchase or old test order. It has not been linked as the current shipment." };
  if (!email || amount == null || !Number.isFinite(Number(amount))) return { status: "NeedsReview" as const, remoteStatus: String(remote.status || "Unknown"), orderStatus: order.status, error: "Shiprocket did not provide enough details to verify this order. Check API buyer-details permissions before retrying." };
  const remoteStatus = String(remote.status || "Unknown");
  const code = Number(remote.status_code);
  const normalized = remoteStatus.toUpperCase().trim();
  if (["CANCELED", "CANCELLED"].includes(normalized) || code === 5) return { status: "Cancelled" as const, remoteStatus, orderStatus: ["Cancelled", "Delivered"].includes(order.status) ? order.status : "Processing" as const, error: "The shipment was cancelled in Shiprocket. Your paid website order is still active. Create a replacement shipment only if the customer still needs delivery." };
  const shipments = Array.isArray(remote.shipments) ? remote.shipments : remote.shipments ? [remote.shipments] : [];
  const shipment = shipments.find((value: any) => value.id || value.shipment_id);
  if (!shipment) return { status: "NeedsReview" as const, remoteStatus, orderStatus: order.status, error: "Shiprocket returned no shipment ID. Check this record before creating another shipment." };
  const fulfillment: Order["status"] = normalized === "DELIVERED" || code === 7 ? "Delivered" : ["SHIPPED", "OUT FOR DELIVERY", "IN TRANSIT"].includes(normalized) || [6, 19].includes(code) ? "Shipped" : "Processing";
  return { status: "Created" as const, remoteStatus, orderStatus: order.status === "Cancelled" ? order.status : fulfillment, shipmentId: Number(shipment.id || shipment.shipment_id), awb: String(shipment.awb || shipment.awb_code || ""), error: undefined };
}
