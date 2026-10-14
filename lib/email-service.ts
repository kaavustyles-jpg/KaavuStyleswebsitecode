import nodemailer from "nodemailer";
import type { Order, OrderItem } from "./mockData";

const GMAIL_USER = process.env.GMAIL_USER || "kaavustyles@gmail.com";
const GMAIL_PASS = (process.env.GMAIL_APP_PASSWORD || "lzfnkdcqwjiedmdw").replace(/\s+/g, "");
const ADMIN_NOTIFICATION_EMAIL = process.env.ORDER_NOTIFICATION_EMAIL || "kaavustyles@gmail.com";
const SHIPPING_TEAM_EMAIL = process.env.SHIPROCKET_EMAIL || "vyshnavigowda@gmail.com";

export function getEmailTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASS,
    },
  });
}

export interface NormalizedOrderDetails {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  postalCode: string;
  totalAmount: number;
  status: string;
  paymentId?: string;
  paymentStatus?: string;
  createdAt: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    size?: string;
    color?: string;
    image?: string;
  }>;
}

export function normalizeOrderData(raw: any): NormalizedOrderDetails {
  const items = Array.isArray(raw.items)
    ? raw.items.map((it: any) => ({
        name: it.name || "Product",
        quantity: Number(it.quantity) || 1,
        price: Number(it.price) || 0,
        size: it.size || "Standard",
        color: it.color || "Standard",
        image: it.image || "",
      }))
    : [];

  return {
    orderNumber: raw.orderNumber || raw.order_number || "KAAVU-NEW",
    customerName: raw.customerName || raw.customer_name || "Valued Customer",
    customerEmail: raw.customerEmail || raw.customer_email || "",
    customerPhone: raw.customerPhone || raw.customer_phone || "",
    shippingAddress: raw.shippingAddress || raw.shipping_address || "",
    city: raw.city || "",
    postalCode: raw.postalCode || raw.postal_code || "",
    totalAmount: Number(raw.totalAmount ?? raw.total_amount ?? 0),
    status: raw.status || "Pending",
    paymentId: raw.razorpayPaymentId || raw.razorpay_payment_id || raw.paymentId || raw.payment_id || "",
    paymentStatus: raw.paymentStatus || raw.payment_status || (raw.razorpayPaymentId || raw.payment_id ? "Paid (Online)" : "Pending / COD"),
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
    items,
  };
}

export function formatInrPrice(amount: number): string {
  return "₹" + Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

// Generate the luxury responsive HTML template
export function buildOrderEmailHtml(order: NormalizedOrderDetails, isForAdmin: boolean): string {
  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const fullAddress = [order.shippingAddress, order.city, order.postalCode]
    .filter(Boolean)
    .join(", ");

  const cleanPhone = order.customerPhone.replace(/[^0-9]/g, "");
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.startsWith("91") ? cleanPhone : "91" + cleanPhone}`
    : "";

  const itemsHtml = order.items
    .map(
      (it) => `
      <tr style="border-bottom: 1px solid #EAE0D5;">
        <td style="padding: 14px 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #1E1014;">
          <strong style="color: #2B0B14; font-size: 14px;">${it.name}</strong>
          <div style="font-size: 11px; color: #8F6E3A; margin-top: 4px; font-weight: 600; text-transform: uppercase;">
            Size: ${it.size || "Standard"} &nbsp;|&nbsp; Color: ${it.color || "Standard"}
          </div>
        </td>
        <td style="padding: 14px 10px; text-align: center; font-family: monospace; font-size: 13px; color: #1E1014; font-weight: bold;">
          ${it.quantity}
        </td>
        <td style="padding: 14px 10px; text-align: right; font-family: monospace; font-size: 13px; color: #1E1014;">
          ${formatInrPrice(it.price)}
        </td>
        <td style="padding: 14px 10px; text-align: right; font-family: monospace; font-size: 13px; color: #800020; font-weight: bold;">
          ${formatInrPrice(it.price * it.quantity)}
        </td>
      </tr>
    `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order ${order.orderNumber} - Kaavu Styles</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F3EC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8F3EC; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; background-color: #FFFFFF; border: 2px solid #8F6E3A; box-shadow: 0 4px 20px rgba(43, 11, 20, 0.08);">
          
          <!-- Brand Header -->
          <tr>
            <td style="background-color: #2B0B14; padding: 28px 24px; text-align: center; border-bottom: 3px solid #E5C378;">
              <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; letter-spacing: 0.22em; text-transform: uppercase; color: #FFFFFF; font-weight: normal;">
                KAAVU STYLES
              </h1>
              <p style="margin: 6px 0 0; font-size: 10px; letter-spacing: 0.28em; text-transform: uppercase; color: #E5C378; font-weight: bold;">
                For Every Version Of You
              </p>
            </td>
          </tr>

          <!-- Notification Banner -->
          <tr>
            <td style="background-color: #FAF4EB; padding: 18px 24px; border-bottom: 1px solid #E5C378; text-align: center;">
              <span style="display: inline-block; background-color: #2B0B14; color: #E5C378; font-size: 11px; font-weight: bold; letter-spacing: 0.18em; text-transform: uppercase; padding: 5px 14px; border: 1px solid #E5C378;">
                ${isForAdmin ? "🛍️ STORE ALERT: NEW ORDER RECEIVED" : "✨ OFFICIAL ORDER CONFIRMATION"}
              </span>
              <h2 style="margin: 12px 0 4px; font-family: Georgia, 'Times New Roman', serif; font-size: 22px; color: #2B0B14;">
                Order #${order.orderNumber}
              </h2>
              <p style="margin: 0; font-size: 12px; color: #6B5B52;">
                Placed on ${formattedDate}
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 24px;">
              ${
                isForAdmin
                  ? `<p style="margin: 0 0 16px; font-size: 14px; color: #1E1014; line-height: 1.5;">
                      Hello <strong>Kaavu Styles Team</strong>, a new order has just been placed on your store. Please review the customer and shipment details below to prepare for dispatch.
                    </p>`
                  : `<p style="margin: 0 0 16px; font-size: 14px; color: #1E1014; line-height: 1.5;">
                      Dear <strong>${order.customerName}</strong>, thank you for shopping with <strong>Kaavu Styles</strong>! We have received your order and our artisans are preparing it with utmost care.
                    </p>`
              }

              <!-- Customer & Shipping Details Grid -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; background-color: #FAF6F0; border: 1px solid #E8DFD5;">
                <tr>
                  <td width="50%" valign="top" style="padding: 16px; border-right: 1px solid #E8DFD5;">
                    <div style="font-size: 10px; font-weight: bold; letter-spacing: 0.16em; text-transform: uppercase; color: #8F6E3A; margin-bottom: 6px;">
                      Customer Details
                    </div>
                    <div style="font-size: 14px; font-weight: bold; color: #2B0B14; margin-bottom: 4px;">
                      ${order.customerName}
                    </div>
                    <div style="font-size: 12px; color: #333333; margin-bottom: 3px;">
                      📧 <a href="mailto:${order.customerEmail}" style="color: #800020; text-decoration: none;">${order.customerEmail}</a>
                    </div>
                    ${
                      order.customerPhone
                        ? `<div style="font-size: 12px; color: #333333; margin-top: 4px;">
                            📞 <a href="tel:${order.customerPhone}" style="color: #800020; text-decoration: none; font-weight: bold;">${order.customerPhone}</a>
                            ${
                              whatsappUrl
                                ? `&nbsp;(<a href="${whatsappUrl}" target="_blank" style="color: #25D366; text-decoration: none; font-weight: bold;">WhatsApp Chat</a>)`
                                : ""
                            }
                          </div>`
                        : ""
                    }
                  </td>
                  <td width="50%" valign="top" style="padding: 16px;">
                    <div style="font-size: 10px; font-weight: bold; letter-spacing: 0.16em; text-transform: uppercase; color: #8F6E3A; margin-bottom: 6px;">
                      Delivery Address
                    </div>
                    <div style="font-size: 13px; color: #2B0B14; line-height: 1.4;">
                      ${fullAddress || "Address provided during checkout"}
                    </div>
                    <div style="margin-top: 8px; font-size: 11px; font-weight: bold; color: #15803D;">
                      Payment Status: ${order.paymentStatus}
                    </div>
                    ${
                      order.paymentId
                        ? `<div style="font-size: 10px; font-family: monospace; color: #666666; margin-top: 2px;">
                            Ref ID: ${order.paymentId}
                          </div>`
                        : ""
                    }
                  </td>
                </tr>
              </table>

              <!-- Order Items Table -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 20px; border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #2B0B14; color: #FFFFFF;">
                    <th align="left" style="padding: 10px; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;">Product</th>
                    <th align="center" style="padding: 10px; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;">Qty</th>
                    <th align="right" style="padding: 10px; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;">Price</th>
                    <th align="right" style="padding: 10px; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Total Amount Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; background-color: #FAF4EB; border: 2px solid #E5C378;">
                <tr>
                  <td style="padding: 16px; text-align: right;">
                    <span style="font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #6B5B52; font-weight: bold; margin-right: 12px;">
                      Grand Total Amount:
                    </span>
                    <span style="font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: bold; color: #800020;">
                      ${formatInrPrice(order.totalAmount)}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Action Link -->
              <div style="text-align: center; margin: 24px 0 8px;">
                ${
                  isForAdmin
                    ? `<a href="https://kaavustyles.com/admin/orders" style="display: inline-block; background-color: #2B0B14; color: #E5C378; padding: 12px 28px; text-decoration: none; font-size: 12px; font-weight: bold; letter-spacing: 0.18em; text-transform: uppercase; border: 1px solid #E5C378;">
                        Manage Order In Admin Portal →
                      </a>`
                    : `<a href="https://kaavustyles.com/orders" style="display: inline-block; background-color: #2B0B14; color: #E5C378; padding: 12px 28px; text-decoration: none; font-size: 12px; font-weight: bold; letter-spacing: 0.18em; text-transform: uppercase; border: 1px solid #E5C378;">
                        Track Order Status Online →
                      </a>`
                }
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #2B0B14; padding: 22px 24px; text-align: center; border-top: 2px solid #E5C378; color: #FFFFFF;">
              <p style="margin: 0 0 6px; font-size: 11px; color: #E5C378; font-weight: bold; letter-spacing: 0.14em; text-transform: uppercase;">
                Kaavu Styles Couture
              </p>
              <p style="margin: 0 0 8px; font-size: 11px; color: #D6CEC5; line-height: 1.4;">
                Handcrafted Sarees, Kurtis & Designer Ethnic Wear · Bengaluru, India
              </p>
              <p style="margin: 0; font-size: 11px; color: #D6CEC5;">
                Direct inquiries: <a href="mailto:kaavustyles@gmail.com" style="color: #E5C378; text-decoration: underline;">kaavustyles@gmail.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Send order notifications via Gmail SMTP
 * 1. Admin Alert to kaavustyles@gmail.com
 * 2. Customer Receipt to customer's email (if provided)
 */
export async function sendOrderNotificationEmail(rawOrder: any): Promise<{
  success: boolean;
  adminEmailSent: boolean;
  customerEmailSent: boolean;
  error?: string;
}> {
  try {
    const order = normalizeOrderData(rawOrder);
    const transporter = getEmailTransporter();

    // 1. Send Admin Alert Email
    const adminHtml = buildOrderEmailHtml(order, true);
    const adminSubject = `🛍️ New Order #${order.orderNumber} Received - ${formatInrPrice(order.totalAmount)} (${order.customerName})`;

    const adminMailOptions = {
      from: `"Kaavu Styles Orders" <${GMAIL_USER}>`,
      to: ADMIN_NOTIFICATION_EMAIL,
      replyTo: order.customerEmail || GMAIL_USER,
      subject: adminSubject,
      html: adminHtml,
    };

    let adminEmailSent = false;
    try {
      await transporter.sendMail(adminMailOptions);
      adminEmailSent = true;
      console.log(`[Order Email] Admin alert sent successfully to ${ADMIN_NOTIFICATION_EMAIL} for order #${order.orderNumber}`);
    } catch (adminErr) {
      console.error("[Order Email] Failed to send admin alert email:", adminErr);
    }

    // 2. Send Customer Confirmation Email (if customerEmail is valid and not the admin itself)
    let customerEmailSent = false;
    const isValidCustomerEmail =
      order.customerEmail &&
      order.customerEmail.includes("@") &&
      order.customerEmail.toLowerCase() !== ADMIN_NOTIFICATION_EMAIL.toLowerCase();

    if (isValidCustomerEmail) {
      try {
        const customerHtml = buildOrderEmailHtml(order, false);
        const customerSubject = `✨ Order Confirmed #${order.orderNumber} - Thank You for Shopping with Kaavu Styles`;

        await transporter.sendMail({
          from: `"Kaavu Styles" <${GMAIL_USER}>`,
          to: order.customerEmail,
          replyTo: ADMIN_NOTIFICATION_EMAIL,
          subject: customerSubject,
          html: customerHtml,
        });
        customerEmailSent = true;
        console.log(`[Order Email] Customer confirmation sent to ${order.customerEmail} for order #${order.orderNumber}`);
      } catch (custErr) {
        console.error(`[Order Email] Failed to send customer receipt to ${order.customerEmail}:`, custErr);
      }
    }

    return {
      success: adminEmailSent || customerEmailSent,
      adminEmailSent,
      customerEmailSent,
    };
  } catch (error: any) {
    console.error("[Order Email] Error in sendOrderNotificationEmail:", error);
    return {
      success: false,
      adminEmailSent: false,
      customerEmailSent: false,
      error: error.message || "Email dispatch failed",
    };
  }
}

export interface StatusTrackingInfo {
  courier?: string;
  awb?: string;
  trackingUrl?: string;
  shipmentId?: string | number;
  orderId?: string | number;
  pickupLocation?: string;
}

const STATUS_TEMPLATES: Record<
  string,
  {
    badge: string;
    title: string;
    message: string;
    badgeBg: string;
    badgeColor: string;
    badgeBorder: string;
    icon: string;
  }
> = {
  Processing: {
    badge: "🧵 IN ARTISAN PROCESSING",
    title: "Your Order is Being Handcrafted",
    message: "Our master weavers and artisans are currently tailoring, finishing, and inspecting your royal couture garments.",
    badgeBg: "#FEF3C7",
    badgeColor: "#B45309",
    badgeBorder: "#F59E0B",
    icon: "🟡",
  },
  Shipped: {
    badge: "🚚 ORDER SHIPPED & DISPATCHED",
    title: "Your Luxury Parcel Is On Its Way!",
    message: "Your handcrafted attire has been carefully packed and handed over to courier logistics for doorstep express delivery.",
    badgeBg: "#DBEAFE",
    badgeColor: "#1D4ED8",
    badgeBorder: "#3B82F6",
    icon: "📦",
  },
  Delivered: {
    badge: "🎁 ORDER DELIVERED",
    title: "Package Delivered to Doorstep",
    message: "Your order has been safely delivered! We hope you adore your new Kaavu Styles collection.",
    badgeBg: "#DCFCE7",
    badgeColor: "#15803D",
    badgeBorder: "#22C55E",
    icon: "🎉",
  },
  Cancelled: {
    badge: "❌ ORDER CANCELLED",
    title: "Order Cancellation Notice",
    message: "Your order status has been updated to Cancelled. Please reach out to our team if you have any questions.",
    badgeBg: "#FFE4E6",
    badgeColor: "#BE123C",
    badgeBorder: "#F43F5E",
    icon: "ℹ️",
  },
  Pending: {
    badge: "⏳ ORDER CONFIRMATION PENDING",
    title: "Order Received",
    message: "Your order has been recorded and will proceed to processing shortly.",
    badgeBg: "#FAF4EB",
    badgeColor: "#8F6E3A",
    badgeBorder: "#E5C378",
    icon: "⏳",
  },
};

export function buildStatusUpdateEmailHtml(
  order: NormalizedOrderDetails,
  newStatus: string,
  tracking?: StatusTrackingInfo,
  isForTeam: boolean = false
): string {
  const cfg = STATUS_TEMPLATES[newStatus] || {
    badge: `📦 STATUS: ${newStatus.toUpperCase()}`,
    title: `Order Status: ${newStatus}`,
    message: `Your order status has been updated to ${newStatus}.`,
    badgeBg: "#FAF4EB",
    badgeColor: "#2B0B14",
    badgeBorder: "#E5C378",
    icon: "✨",
  };

  const formattedDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const fullAddress = [order.shippingAddress, order.city, order.postalCode]
    .filter(Boolean)
    .join(", ");

  const cleanPhone = order.customerPhone.replace(/[^0-9]/g, "");
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.startsWith("91") ? cleanPhone : "91" + cleanPhone}`
    : "";

  const itemsHtml = order.items
    .map(
      (it) => `
      <tr style="border-bottom: 1px solid #EAE0D5;">
        <td style="padding: 12px 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #1E1014;">
          <strong style="color: #2B0B14;">${it.name}</strong>
          <div style="font-size: 11px; color: #8F6E3A; margin-top: 3px;">
            Size: ${it.size || "Standard"} &nbsp;|&nbsp; Color: ${it.color || "Standard"}
          </div>
        </td>
        <td style="padding: 12px 10px; text-align: center; font-family: monospace; font-size: 13px; font-weight: bold;">
          ${it.quantity}
        </td>
        <td style="padding: 12px 10px; text-align: right; font-family: monospace; font-size: 13px; color: #800020; font-weight: bold;">
          ${formatInrPrice(it.price * it.quantity)}
        </td>
      </tr>
    `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order #${order.orderNumber} Status: ${newStatus}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F3EC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8F3EC; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; background-color: #FFFFFF; border: 2px solid #8F6E3A; box-shadow: 0 4px 20px rgba(43, 11, 20, 0.08);">
          
          <!-- Brand Header -->
          <tr>
            <td style="background-color: #2B0B14; padding: 26px 24px; text-align: center; border-bottom: 3px solid #E5C378;">
              <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 24px; letter-spacing: 0.22em; text-transform: uppercase; color: #FFFFFF; font-weight: normal;">
                KAAVU STYLES
              </h1>
              <p style="margin: 5px 0 0; font-size: 10px; letter-spacing: 0.28em; text-transform: uppercase; color: #E5C378; font-weight: bold;">
                For Every Version Of You
              </p>
            </td>
          </tr>

          <!-- Dynamic Status Banner -->
          <tr>
            <td style="background-color: #FAF4EB; padding: 22px 24px; border-bottom: 1px solid #E5C378; text-align: center;">
              <div style="display: inline-block; background-color: ${cfg.badgeBg}; color: ${cfg.badgeColor}; border: 1.5px solid ${cfg.badgeBorder}; font-size: 11px; font-weight: bold; letter-spacing: 0.16em; text-transform: uppercase; padding: 6px 16px; border-radius: 2px; margin-bottom: 12px;">
                ${cfg.badge}
              </div>
              <h2 style="margin: 0 0 6px; font-family: Georgia, 'Times New Roman', serif; font-size: 22px; color: #2B0B14;">
                ${cfg.title}
              </h2>
              <p style="margin: 0 0 6px; font-size: 13px; color: #4A3E39; max-width: 480px; margin-left: auto; margin-right: auto; line-height: 1.5;">
                ${cfg.message}
              </p>
              <p style="margin: 6px 0 0; font-size: 11px; color: #8F6E3A; font-weight: 600;">
                Order #${order.orderNumber} · Updated on ${formattedDate}
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 24px;">
              ${
                isForTeam
                  ? `<div style="background-color: #2B0B14; color: #E5C378; padding: 12px 16px; margin-bottom: 20px; font-size: 12px; font-weight: bold; letter-spacing: 0.12em; text-transform: uppercase;">
                      📢 Operations & Shipping Alert: Order #${order.orderNumber} updated to ${newStatus.toUpperCase()}
                    </div>`
                  : `<p style="margin: 0 0 16px; font-size: 14px; color: #1E1014; line-height: 1.5;">
                      Dear <strong>${order.customerName}</strong>, here is the latest update regarding your order with Kaavu Styles.
                    </p>`
              }

              <!-- Shipment Tracking Box (If Shipped or tracking info exists) -->
              ${
                tracking && (tracking.shipmentId || tracking.orderId || tracking.awb)
                  ? `
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 22px; background-color: #EFF6FF; border: 2px solid #3B82F6;">
                    <tr>
                      <td style="padding: 16px;">
                        <div style="font-size: 10px; font-weight: bold; letter-spacing: 0.16em; text-transform: uppercase; color: #1D4ED8; margin-bottom: 6px;">
                          🚚 Courier & Logistics Information
                        </div>
                        <div style="font-size: 13px; color: #1E3A8A; line-height: 1.6;">
                          <div><strong>Carrier:</strong> ${tracking.courier || "Shiprocket Express Logistics"}</div>
                          ${tracking.shipmentId ? `<div><strong>Shipment ID:</strong> <span style="font-family: monospace; font-weight: bold;">${tracking.shipmentId}</span></div>` : ""}
                          ${tracking.orderId ? `<div><strong>Shiprocket Order Ref:</strong> <span style="font-family: monospace;">${tracking.orderId}</span></div>` : ""}
                          ${tracking.pickupLocation ? `<div><strong>Origin Hub:</strong> ${tracking.pickupLocation}</div>` : ""}
                        </div>
                        <div style="margin-top: 10px;">
                          <a href="https://kaavustyles.com/orders" style="display: inline-block; background-color: #1D4ED8; color: #FFFFFF; padding: 8px 18px; text-decoration: none; font-size: 11px; font-weight: bold; letter-spacing: 0.12em; text-transform: uppercase;">
                            Track Parcel Live →
                          </a>
                        </div>
                      </td>
                    </tr>
                  </table>
                  `
                  : ""
              }

              <!-- Customer & Delivery Address Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 22px; background-color: #FAF6F0; border: 1px solid #E8DFD5;">
                <tr>
                  <td width="50%" valign="top" style="padding: 16px; border-right: 1px solid #E8DFD5;">
                    <div style="font-size: 10px; font-weight: bold; letter-spacing: 0.16em; text-transform: uppercase; color: #8F6E3A; margin-bottom: 6px;">
                      Customer Details
                    </div>
                    <div style="font-size: 14px; font-weight: bold; color: #2B0B14; margin-bottom: 4px;">
                      ${order.customerName}
                    </div>
                    <div style="font-size: 12px; color: #333333; margin-bottom: 3px;">
                      📧 <a href="mailto:${order.customerEmail}" style="color: #800020; text-decoration: none;">${order.customerEmail}</a>
                    </div>
                    ${
                      order.customerPhone
                        ? `<div style="font-size: 12px; color: #333333; margin-top: 4px;">
                            📞 <a href="tel:${order.customerPhone}" style="color: #800020; text-decoration: none; font-weight: bold;">${order.customerPhone}</a>
                            ${
                              whatsappUrl
                                ? `&nbsp;(<a href="${whatsappUrl}" target="_blank" style="color: #25D366; text-decoration: none; font-weight: bold;">WhatsApp</a>)`
                                : ""
                            }
                          </div>`
                        : ""
                    }
                  </td>
                  <td width="50%" valign="top" style="padding: 16px;">
                    <div style="font-size: 10px; font-weight: bold; letter-spacing: 0.16em; text-transform: uppercase; color: #8F6E3A; margin-bottom: 6px;">
                      Delivery Address
                    </div>
                    <div style="font-size: 13px; color: #2B0B14; line-height: 1.4;">
                      ${fullAddress || "Address provided during checkout"}
                    </div>
                    <div style="margin-top: 8px; font-size: 11px; font-weight: bold; color: #15803D;">
                      Payment: ${order.paymentStatus || "Paid"}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Order Items Table -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 20px; border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #2B0B14; color: #FFFFFF;">
                    <th align="left" style="padding: 10px; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;">Product</th>
                    <th align="center" style="padding: 10px; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;">Qty</th>
                    <th align="right" style="padding: 10px; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Total Row -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; background-color: #FAF4EB; border: 2px solid #E5C378;">
                <tr>
                  <td style="padding: 14px 16px; text-align: right;">
                    <span style="font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #6B5B52; font-weight: bold; margin-right: 12px;">
                      Order Total:
                    </span>
                    <span style="font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: bold; color: #800020;">
                      ${formatInrPrice(order.totalAmount)}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Actions -->
              <div style="text-align: center; margin: 20px 0 8px;">
                ${
                  isForTeam
                    ? `<a href="https://kaavustyles.com/admin/orders" style="display: inline-block; background-color: #2B0B14; color: #E5C378; padding: 12px 28px; text-decoration: none; font-size: 12px; font-weight: bold; letter-spacing: 0.18em; text-transform: uppercase; border: 1px solid #E5C378;">
                        Manage In Admin Portal →
                      </a>`
                    : `<a href="https://kaavustyles.com/orders" style="display: inline-block; background-color: #2B0B14; color: #E5C378; padding: 12px 28px; text-decoration: none; font-size: 12px; font-weight: bold; letter-spacing: 0.18em; text-transform: uppercase; border: 1px solid #E5C378;">
                        Track Order Status Online →
                      </a>`
                }
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #2B0B14; padding: 22px 24px; text-align: center; border-top: 2px solid #E5C378; color: #FFFFFF;">
              <p style="margin: 0 0 6px; font-size: 11px; color: #E5C378; font-weight: bold; letter-spacing: 0.14em; text-transform: uppercase;">
                Kaavu Styles Couture
              </p>
              <p style="margin: 0 0 8px; font-size: 11px; color: #D6CEC5; line-height: 1.4;">
                Handcrafted Sarees, Kurtis & Designer Ethnic Wear · Bengaluru, India
              </p>
              <p style="margin: 0; font-size: 11px; color: #D6CEC5;">
                Inquiries: <a href="mailto:kaavustyles@gmail.com" style="color: #E5C378; text-decoration: underline;">kaavustyles@gmail.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Send order status update notifications via Gmail SMTP
 * 1. Customer: order.customerEmail ("the order people")
 * 2. Store Admin: kaavustyles@gmail.com
 * 3. Shipping Team: vyshnavigowda@gmail.com / process.env.SHIPROCKET_EMAIL ("toshipping to")
 */
export async function sendStatusUpdateEmail(
  rawOrder: any,
  newStatus: string,
  trackingInfo?: StatusTrackingInfo
): Promise<{
  success: boolean;
  customerSent: boolean;
  adminSent: boolean;
  shippingSent: boolean;
  recipients: string[];
  error?: string;
}> {
  try {
    const order = normalizeOrderData(rawOrder);
    const transporter = getEmailTransporter();

    // Consolidate tracking info from argument or rawOrder.shiprocket
    const tracking: StatusTrackingInfo = {
      courier: trackingInfo?.courier || "Shiprocket Express",
      shipmentId: trackingInfo?.shipmentId || rawOrder?.shiprocket?.shipmentId,
      orderId: trackingInfo?.orderId || rawOrder?.shiprocket?.orderId,
      pickupLocation: trackingInfo?.pickupLocation || rawOrder?.shiprocket?.pickupLocation,
      trackingUrl: trackingInfo?.trackingUrl || "https://kaavustyles.com/orders",
    };

    let customerSent = false;
    let adminSent = false;
    let shippingSent = false;
    const sentRecipients: string[] = [];

    // 1. Send to Customer ("the order people")
    const isValidCustomerEmail =
      order.customerEmail &&
      order.customerEmail.includes("@") &&
      order.customerEmail.toLowerCase() !== ADMIN_NOTIFICATION_EMAIL.toLowerCase();

    if (isValidCustomerEmail) {
      try {
        let custSubject = `✨ Order #${order.orderNumber} Status: ${newStatus} - Kaavu Styles`;
        if (newStatus === "Shipped") {
          custSubject = `🚚 Your Kaavu Styles Order #${order.orderNumber} Has Shipped!`;
        } else if (newStatus === "Processing") {
          custSubject = `🧵 Order #${order.orderNumber} Is Being Handcrafted - Kaavu Styles`;
        } else if (newStatus === "Delivered") {
          custSubject = `🎉 Delivered! Your Kaavu Styles Order #${order.orderNumber} Has Arrived`;
        } else if (newStatus === "Cancelled") {
          custSubject = `ℹ️ Notice: Order #${order.orderNumber} Has Been Cancelled`;
        }

        const customerHtml = buildStatusUpdateEmailHtml(order, newStatus, tracking, false);
        await transporter.sendMail({
          from: `"Kaavu Styles" <${GMAIL_USER}>`,
          to: order.customerEmail,
          replyTo: ADMIN_NOTIFICATION_EMAIL,
          subject: custSubject,
          html: customerHtml,
        });
        customerSent = true;
        sentRecipients.push(order.customerEmail);
        console.log(`[Status Email] Customer update (${newStatus}) sent to ${order.customerEmail}`);
      } catch (custErr) {
        console.error(`[Status Email] Failed to send to customer ${order.customerEmail}:`, custErr);
      }
    }

    // 2. Send to Admin & Shipping Team ("toshipping to")
    const teamHtml = buildStatusUpdateEmailHtml(order, newStatus, tracking, true);
    const teamSubject = `📦 [ORDER STATUS: ${newStatus.toUpperCase()}] #${order.orderNumber} - ${order.customerName}`;

    // Store Admin
    try {
      await transporter.sendMail({
        from: `"Kaavu Styles Notifications" <${GMAIL_USER}>`,
        to: ADMIN_NOTIFICATION_EMAIL,
        replyTo: order.customerEmail || GMAIL_USER,
        subject: teamSubject,
        html: teamHtml,
      });
      adminSent = true;
      sentRecipients.push(ADMIN_NOTIFICATION_EMAIL);
      console.log(`[Status Email] Admin update (${newStatus}) sent to ${ADMIN_NOTIFICATION_EMAIL}`);
    } catch (adminErr) {
      console.error(`[Status Email] Failed to send to admin:`, adminErr);
    }

    // Shipping Team (if different from admin)
    if (
      SHIPPING_TEAM_EMAIL &&
      SHIPPING_TEAM_EMAIL.includes("@") &&
      SHIPPING_TEAM_EMAIL.toLowerCase() !== ADMIN_NOTIFICATION_EMAIL.toLowerCase()
    ) {
      try {
        await transporter.sendMail({
          from: `"Kaavu Styles Logistics" <${GMAIL_USER}>`,
          to: SHIPPING_TEAM_EMAIL,
          replyTo: ADMIN_NOTIFICATION_EMAIL,
          subject: teamSubject,
          html: teamHtml,
        });
        shippingSent = true;
        sentRecipients.push(SHIPPING_TEAM_EMAIL);
        console.log(`[Status Email] Shipping desk alert (${newStatus}) sent to ${SHIPPING_TEAM_EMAIL}`);
      } catch (shipErr) {
        console.error(`[Status Email] Failed to send to shipping desk:`, shipErr);
      }
    }

    return {
      success: customerSent || adminSent || shippingSent,
      customerSent,
      adminSent,
      shippingSent,
      recipients: sentRecipients,
    };
  } catch (error: any) {
    console.error("[Status Email] Error in sendStatusUpdateEmail:", error);
    return {
      success: false,
      customerSent: false,
      adminSent: false,
      shippingSent: false,
      recipients: [],
      error: error.message || "Status email dispatch failed",
    };
  }
}
