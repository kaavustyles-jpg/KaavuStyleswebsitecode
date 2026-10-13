import type { Order } from "./mockData";

export interface ParcelDetails { weight: number; length: number; width: number; height: number; pickupLocation: string; deliveryState: string; }
export function validateParcel(input: ParcelDetails): ParcelDetails {
  for (const field of ["weight", "length", "width", "height"] as const) {
    if (typeof input[field] !== "number" || !Number.isFinite(input[field]) || input[field] <= 0 || input[field] > (field === "weight" ? 1000 : 1000)) throw new Error(`Enter a valid ${field} greater than zero.`);
  }
  if (typeof input.pickupLocation !== "string" || !input.pickupLocation.trim() || input.pickupLocation.length > 200) throw new Error("Select a registered pickup location.");
  if (typeof input.deliveryState !== "string" || !input.deliveryState.trim() || input.deliveryState.length > 100) throw new Error("Enter the customer's delivery state.");
  return { ...input, pickupLocation: input.pickupLocation.trim(), deliveryState: input.deliveryState.trim() };
}
export function buildShiprocketOrder(order: Order, raw: ParcelDetails) {
  const parcel = validateParcel(raw);
  if (order.paymentStatus !== "Paid") throw new Error("Only paid orders can be sent to Shiprocket.");
  if (["Cancelled", "Delivered", "Shipped"].includes(order.status)) throw new Error("This order cannot be sent for a new shipment.");
  const phone = order.customerPhone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  if (!/^\d{10}$/.test(phone) || !/^\d{6}$/.test(order.postalCode)) throw new Error("Correct the customer's phone number and delivery pincode before shipping.");
  if (!order.items.length || !Number.isFinite(order.totalAmount) || order.totalAmount <= 0) throw new Error("Invalid order value or items.");
  const names = order.customerName.trim().split(/\s+/);
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (!Number.isFinite(subtotal) || subtotal < order.totalAmount) throw new Error("Order item prices do not match the order total.");
  const date = new Date(order.createdAt);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid order date.");
  const istDate = new Date(date.getTime() + 330 * 60000).toISOString().slice(0, 16).replace("T", " ");
  return {
    order_id: order.orderNumber, order_date: istDate, pickup_location: parcel.pickupLocation,
    billing_customer_name: names[0], billing_last_name: names.slice(1).join(" "),
    billing_address: order.shippingAddress, billing_city: order.city, billing_pincode: order.postalCode,
    billing_state: parcel.deliveryState, billing_country: "India", billing_email: order.customerEmail, billing_phone: phone,
    shipping_is_billing: true, payment_method: "Prepaid",
    order_items: order.items.map(item => {
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || !Number.isFinite(item.price) || item.price < 0) throw new Error("Invalid order item.");
      return { name: `${item.name} (${item.size}, ${item.color})`, sku: `${item.productId}-${item.size}-${item.color}`.slice(0, 100), units: item.quantity, selling_price: item.price };
    }),
    total_discount: Math.round((subtotal - order.totalAmount) * 100) / 100,
    sub_total: order.totalAmount, weight: parcel.weight, length: parcel.length, breadth: parcel.width, height: parcel.height,
  };
}
