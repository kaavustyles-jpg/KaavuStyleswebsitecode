import { NextRequest, NextResponse } from "next/server";
import { sendOrderNotificationEmail } from "@/lib/email-service";
import { paymentDb } from "@/lib/razorpay-server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let orderToNotify = body.order;

    if (!orderToNotify && body.orderId) {
      try {
        const db = paymentDb();
        const { data, error } = await db
          .from("orders")
          .select("*")
          .eq("id", body.orderId)
          .single();
        if (!error && data) {
          orderToNotify = data;
        }
      } catch (dbErr) {
        console.error("Could not fetch order from DB for notification:", dbErr);
      }
    }

    if (!orderToNotify) {
      return NextResponse.json({ error: "Order details or orderId required" }, { status: 400 });
    }

    const result = await sendOrderNotificationEmail(orderToNotify);
    return NextResponse.json({
      success: true,
      adminEmailSent: result.adminEmailSent,
      customerEmailSent: result.customerEmailSent,
      recipient: process.env.ORDER_NOTIFICATION_EMAIL || "kaavustyles@gmail.com",
    });
  } catch (error: any) {
    console.error("Error in /api/orders/notify:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to dispatch email notification" },
      { status: 500 }
    );
  }
}
