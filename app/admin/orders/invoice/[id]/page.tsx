"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/utils";
import { isSupabaseConfigured, mapDbOrderToOrder } from "@/lib/supabase";
import type { Order } from "@/lib/mockData";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Printer, Shield, CheckCircle, Mail, Phone, MapPin, Sparkles } from "lucide-react";

function numberToWords(num: number): string {
  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ",
    "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + "Hundred " + (n % 100 !== 0 ? "and " + inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + "Thousand " + (n % 1000 !== 0 ? inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + "Lakh " + (n % 100000 !== 0 ? inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + "Crore " + (n % 10000000 !== 0 ? inWords(n % 10000000) : "");
  }

  const rounded = Math.round(num);
  if (rounded === 0) return "Zero Rupees Only";
  return "Rupees " + inWords(rounded).trim() + " Only";
}

export default function AdminOrderInvoicePage() {
  const params = useParams();
  const { orders } = useStore();
  const [isMounted, setIsMounted] = useState(false);
  const [savedOrder, setSavedOrder] = useState<Order | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);
  const orderId = params?.id as string;

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      cancelled = true;
      controller.abort();
      setLoadError("Loading took too long. Please retry to load your invoice.");
      setLoadingInvoice(false);
    }, 12000);
    setSavedOrder(null);
    setLoadError("");
    setLoadingInvoice(true);
    async function loadInvoice() {
      try {
        if (!isSupabaseConfigured || !orderId) return;
        const column = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId) ? "id" : "order_number";
        // Use an independent read client so checkout/auth activity cannot block the invoice.
        const invoiceDb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
        const { data, error } = await invoiceDb.from("orders").select("*").eq(column, orderId).abortSignal(controller.signal).maybeSingle();
        if (error) throw error;
        if (!cancelled && data) setSavedOrder(mapDbOrderToOrder(data));
      } catch {
        if (!cancelled) setLoadError("Could not load this invoice. Please check your connection and retry.");
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setLoadingInvoice(false);
      }
    }
    void loadInvoice();
    return () => { cancelled = true; clearTimeout(timeout); controller.abort(); };
  }, [orderId, retry]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const order = savedOrder || orders.find((o) => o.id === orderId || o.orderNumber === orderId);

  const handlePrintOrDownload = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (!isMounted || (!order && loadingInvoice)) {
    return (
      <div className="min-h-screen bg-[#FBF8F3] flex items-center justify-center p-8">
        <p className="text-sm font-semibold text-ink-muted">Loading invoice…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FBF8F3] flex flex-col items-center justify-center p-8 space-y-4">
        <h2 className="font-serif text-2xl text-ink uppercase">{loadError ? "Invoice unavailable" : "Order Invoice Not Found"}</h2>
        <p className="text-xs text-ink-muted" role={loadError ? "alert" : undefined}>{loadError || `No matching order record found for ID #${orderId}.`}</p>
        {loadError && <button type="button" onClick={() => setRetry(value => value + 1)} className="px-6 py-2.5 border border-gold text-xs font-semibold">Retry loading invoice</button>}
        <Link
          href="/admin/orders"
          className="px-6 py-2.5 bg-crimson text-ivory text-xs uppercase tracking-wider font-semibold"
        >
          Back to Orders
        </Link>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#FBF8F3] p-4 sm:p-8 md:p-12 print:p-0 print:bg-white print:min-h-0">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
        }
      `}</style>

      {/* Top Action Header Bar (Hidden in Print View) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <Link
          href="/admin/orders"
          className="flex items-center space-x-2 text-xs uppercase tracking-wider font-bold text-ink hover:text-crimson transition-colors bg-ivory px-4 py-2 border border-ivory-300 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-gold" />
          <span>Back to Orders List</span>
        </Link>

        <button
          type="button"
          onClick={handlePrintOrDownload}
          className="w-full sm:w-auto px-8 py-3.5 bg-gold hover:bg-amber-600 text-ink text-xs uppercase tracking-[0.16em] font-extrabold flex items-center justify-center space-x-2 border-2 border-gold shadow-lg transition-all cursor-pointer"
        >
          <Printer className="w-4.5 h-4.5 text-ink" />
          <span>Print & Download A4 Invoice (PDF)</span>
        </button>
      </div>

      {/* High-End Luxury A4 Sheet Invoice Container Box */}
      <div className="max-w-4xl mx-auto bg-white border-2 border-gold shadow-2xl p-6 sm:p-10 space-y-6 text-black font-sans print:border-2 print:border-black print:p-6 print:w-full print:max-w-none print:shadow-none">
        
        {/* Brand Invoice Top Header Box */}
        <div className="border-b-2 border-gold pb-6 print:border-black flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-gold shadow-md bg-ivory flex-shrink-0 print:border-black">
              <Image
                src="/icon.jpeg"
                alt="Kaavu Styles Logo"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="space-y-0.5">
              <h1 className="font-serif text-2xl sm:text-3xl font-extrabold uppercase tracking-[0.12em] text-ink print:text-black">
                KAAVU STYLES
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold print:text-black">
                For Every Version Of You
              </p>
              <p className="text-[11px] text-gray-700 font-sans pt-0.5">
                Luxury Ethnic Wear & Couture Studio
              </p>
            </div>
          </div>

          <div className="text-right space-y-1 w-full sm:w-auto bg-[#FAF5EC] p-3.5 border border-gold/40 print:bg-gray-100 print:border-black">
            <div className="inline-block bg-[#2B0B14] text-gold px-3 py-1 font-bold text-xs uppercase tracking-widest border border-gold/40 print:bg-black print:text-white print:border-black">
              RETAIL INVOICE
            </div>
            <p className="font-mono text-sm font-extrabold text-crimson print:text-black pt-1">
              Invoice #: <span>INV-{order.orderNumber}</span>
            </p>
            <p className="text-[11px] font-mono text-gray-800">
              Date: {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "—"}
            </p>
          </div>
        </div>

        {/* Customer & Shipping Information Equal Width Box Grid */}
        <div className="border-2 border-gold grid grid-cols-1 sm:grid-cols-2 text-xs divide-y sm:divide-y-0 sm:divide-x-2 divide-gold print:border-black print:divide-black">
          <div className="p-4 space-y-1.5 bg-[#FAF8F5] print:bg-white">
            <p className="font-extrabold uppercase text-[10px] tracking-wider text-crimson print:text-black border-b border-gold/40 pb-1 print:border-black flex items-center space-x-1">
              <span>Billed To (Buyer Information)</span>
            </p>
            <p className="font-serif font-bold text-sm text-ink print:text-black pt-1">{order.customerName}</p>
            <p className="text-gray-800 font-mono text-[11px] flex items-center">
              <Mail className="w-3.5 h-3.5 text-gold mr-1.5 flex-shrink-0 print:hidden" />
              <span>{order.customerEmail}</span>
            </p>
            <p className="text-gray-800 font-mono text-[11px] flex items-center">
              <Phone className="w-3.5 h-3.5 text-gold mr-1.5 flex-shrink-0 print:hidden" />
              <span>Phone: {order.customerPhone}</span>
            </p>
          </div>

          <div className="p-4 space-y-1.5 bg-[#FAF8F5] print:bg-white">
            <p className="font-extrabold uppercase text-[10px] tracking-wider text-crimson print:text-black border-b border-gold/40 pb-1 print:border-black flex items-center space-x-1">
              <span>Shipped To (Consignee Destination)</span>
            </p>
            <p className="font-serif font-bold text-sm text-ink print:text-black pt-1">{order.customerName}</p>
            <p className="text-gray-800 text-[11px] flex items-start">
              <MapPin className="w-3.5 h-3.5 text-gold mr-1.5 flex-shrink-0 mt-0.5 print:hidden" />
              <span>{order.shippingAddress}, {order.city} - {order.postalCode}</span>
            </p>
            <p className="text-gray-800 font-mono text-[10px] pt-0.5">
              Fulfillment Status: <span className="font-bold text-crimson print:text-black uppercase">{order.status}</span>
            </p>
            <div className="pt-2 border-t border-gold/40 print:border-black text-[10px]">
              <p className="text-gray-800">
                <span className="font-semibold text-gray-700">Payment: </span>
                <span className="font-bold text-emerald-800 print:text-black uppercase mr-2">
                  {(order.paymentStatus === "Paid" || (!order.paymentStatus && (order.razorpayPaymentId || order.paymentId))) ? "PAID" : order.paymentStatus || "PENDING"}
                </span>
                <span className="font-mono text-gray-900 font-semibold">{order.razorpayPaymentId || order.paymentId || "—"}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Itemized Invoice Table Box */}
        <div className="border-2 border-gold print:border-black overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-gold bg-[#2B0B14] text-gold uppercase text-[10px] font-extrabold tracking-wider print:bg-black print:text-white print:border-black">
                <th className="p-3 border-r border-gold/40 print:border-gray-500 w-10 text-center">S.No</th>
                <th className="p-3 border-r border-gold/40 print:border-gray-500">Item Description</th>
                <th className="p-3 border-r border-gold/40 print:border-gray-500 w-28">Variant</th>
                <th className="p-3 border-r border-gold/40 print:border-gray-500 w-12 text-center">Qty</th>
                <th className="p-3 border-r border-gold/40 print:border-gray-500 w-20 text-right">Rate (₹)</th>
                <th className="p-3 text-right w-24">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/30 print:divide-black font-sans">
              {order.items.map((item, idx) => {
                const lineTotal = item.price * item.quantity;

                return (
                  <tr key={idx} className="text-[11px] hover:bg-[#FAF8F5]">
                    <td className="p-3 border-r border-gold/30 print:border-black text-center font-mono font-bold">{idx + 1}</td>
                    <td className="p-3 border-r border-gold/30 print:border-black font-serif font-bold text-ink print:text-black">
                      {item.name}
                    </td>
                    <td className="p-3 border-r border-gold/30 print:border-black text-gray-800 text-[10px]">
                      Size: <span className="font-semibold text-black">{item.size || "S"}</span> • Color: <span className="font-semibold text-black">{item.color || "Std"}</span>
                    </td>
                    <td className="p-3 border-r border-gold/30 print:border-black text-center font-mono font-bold">{item.quantity}</td>
                    <td className="p-3 border-r border-gold/30 print:border-black text-right font-mono">{formatPrice(item.price)}</td>
                    <td className="p-3 text-right font-mono font-extrabold text-crimson print:text-black">
                      {formatPrice(lineTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Order Total & Amount in Words Box */}
        <div className="border-2 border-gold grid grid-cols-1 sm:grid-cols-2 text-xs divide-y sm:divide-y-0 sm:divide-x-2 divide-gold print:border-black print:divide-black">
          <div className="p-5 space-y-3 bg-[#FAF8F5] print:bg-white">
            <div>
              <p className="font-extrabold uppercase text-[10px] tracking-wider text-crimson print:text-black border-b border-gold/30 pb-1 print:border-black">
                Amount in Words:
              </p>
              <p className="font-serif font-bold text-sm italic text-ink print:text-black pt-1">
                {numberToWords(order.totalAmount)}
              </p>
            </div>
            <div className="pt-2 border-t border-gold/30 text-[10px] text-gray-700 space-y-0.5 print:border-gray-400">
              <p className="font-bold text-ink print:text-black uppercase flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5 text-gold inline mr-1 print:hidden" />
                <span>Kaavu Styles Handcrafted Quality Assurance</span>
              </p>
              <p>Each luxury garment is handcrafted and undergoes a 100% quality inspection prior to shipment.</p>
            </div>
          </div>

          <div className="p-5 space-y-2 bg-white">
            <div className="flex justify-between text-sm font-extrabold text-ink pt-1 print:text-black">
              <span>TOTAL:</span>
              <span className="font-sans text-xl font-bold text-crimson print:text-black">{formatPrice(order.totalAmount)}</span>
            </div>
            <div className="pt-2 border-t border-gold/30 print:border-black space-y-1 font-sans text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment:</span>
                <span className="font-bold text-emerald-800 uppercase">
                  {(order.paymentStatus === "Paid" || (!order.paymentStatus && (order.razorpayPaymentId || order.paymentId))) ? "PAID" : order.paymentStatus || "PENDING"}
                </span>
              </div>
              <div className="flex justify-between items-center font-mono text-[10px]">
                <span className="text-gray-600 font-sans">Payment ID:</span>
                <span className="font-bold text-black">{order.razorpayPaymentId || order.paymentId || "—"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Terms, Guarantee & Authorized Signatory Box */}
        <div className="p-4 border-2 border-gold grid grid-cols-1 sm:grid-cols-2 text-[10px] text-gray-800 gap-4 print:border-black">
          <div className="space-y-1">
            <p className="font-extrabold uppercase text-ink print:text-black">Terms & Return Policy:</p>
            <ol className="list-decimal list-inside space-y-0.5 text-[10px]">
              <li>Strict No Return & No Replacement Policy: All sales are final. Handcrafted luxury couture garments cannot be returned, exchanged, or replaced.</li>
              <li>Handcrafted silk and embellished couture require specialized dry cleaning only.</li>
              <li>Subject to Bengaluru / Hyderabad Jurisdiction only.</li>
            </ol>
          </div>

          <div className="text-right flex flex-col justify-between items-end space-y-4">
            <p className="font-bold text-ink uppercase text-[11px] print:text-black">For KAAVU STYLES</p>
            <div className="pt-8 border-t-2 border-gold w-48 text-center font-mono font-bold text-[10px] uppercase text-black print:border-black">
              Authorised Signatory
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
