"use client";

import React, { useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import AdminListCard from "@/components/AdminListCard";
import ShiprocketOrderDialog from "@/components/ShiprocketOrderDialog";
import { useStore } from "@/context/StoreContext";
import { Order } from "@/lib/mockData";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { ClipboardList, Eye, X, MapPin, Phone, Mail, Globe, Printer } from "lucide-react";

export default function AdminOrdersPage() {
  const { orders, updateOrderStatus } = useStore();
  const [shippingOrder, setShippingOrder] = useState<Order | null>(null);
  const [shippingUpdates, setShippingUpdates] = useState<Record<string, Order["shiprocket"]>>({});
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Current Month Calculations
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const totalOrdersCount = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  const thisMonthOrders = orders.filter((o) => {
    if (!o.createdAt) return false;
    const d = new Date(o.createdAt);
    return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const thisMonthOrdersCount = thisMonthOrders.length;
  const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  const pendingCount = orders.filter((o) => o.status === "Pending").length;
  const processingCount = orders.filter((o) => o.status === "Processing").length;
  const deliveredCount = orders.filter((o) => o.status === "Delivered").length;

  const handleStatusChange = (orderId: string, newStatus: Order["status"]) => {
    updateOrderStatus(orderId, newStatus);
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  };

  const handlePrintInvoice = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const filteredOrders = orders.map(order => shippingUpdates[order.id] ? { ...order, shiprocket: shippingUpdates[order.id] } : order).filter((o) => {
    const matchesStatus = statusFilter === "All" || o.status.toLowerCase() === statusFilter.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      !searchQuery ||
      o.orderNumber.toLowerCase().includes(query) ||
      o.customerName.toLowerCase().includes(query) ||
      o.customerEmail.toLowerCase().includes(query) ||
      o.customerPhone.includes(query) ||
      (o.razorpayPaymentId && o.razorpayPaymentId.toLowerCase().includes(query)) ||
      (o.paymentId && o.paymentId.toLowerCase().includes(query));

    return matchesStatus && matchesQuery;
  });

  return (
    <div className="flex min-h-screen bg-ivory-100">
      <div className="print:hidden">
        <AdminSidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="print:hidden">
          <AdminHeader title="Order Listing & Tracking" />
        </div>

        <main className="p-6 sm:p-8 space-y-6 print:p-0 print:m-0">
          {/* Top Key Order & Revenue Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
            {/* Total Orders Card */}
            <div className="bg-ivory border-2 border-ivory-300 p-5 space-y-2 shadow-sm">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-ink-muted">
                Total Orders (All-Time)
              </span>
              <p className="font-sans text-3xl font-bold text-ink" suppressHydrationWarning>
                {isMounted ? totalOrdersCount : 0}
              </p>
              <span className="text-[10px] text-gold font-semibold block">
                {isMounted ? `${deliveredCount} Delivered · ${pendingCount} Pending` : ""}
              </span>
            </div>

            {/* This Month Orders Card */}
            <div className="bg-amber-50/70 border-2 border-amber-300 p-5 space-y-2 shadow-sm">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-900">
                This Month's Orders
              </span>
              <p className="font-sans text-3xl font-bold text-amber-800" suppressHydrationWarning>
                {isMounted ? thisMonthOrdersCount : 0}
              </p>
              <span className="text-[10px] text-amber-700 font-semibold block uppercase">
                {now.toLocaleString("en-IN", { month: "long" })} {currentYear}
              </span>
            </div>

            {/* Total Revenue Card */}
            <div className="bg-ivory border-2 border-ivory-300 p-5 space-y-2 shadow-sm">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-ink-muted">
                Total Sales Revenue
              </span>
              <p className="font-sans text-3xl font-bold text-crimson" suppressHydrationWarning>
                {isMounted ? formatPrice(totalRevenue) : "₹0"}
              </p>
              <span className="text-[10px] text-emerald-700 font-semibold block">Lifetime Revenue Logged</span>
            </div>

            {/* This Month Revenue Card */}
            <div className="bg-emerald-50/70 border-2 border-emerald-300 p-5 space-y-2 shadow-sm">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-900">
                This Month's Revenue
              </span>
              <p className="font-sans text-3xl font-bold text-emerald-800" suppressHydrationWarning>
                {isMounted ? formatPrice(thisMonthRevenue) : "₹0"}
              </p>
              <span className="text-[10px] text-emerald-700 font-semibold block uppercase">
                Current Month Total
              </span>
            </div>
          </div>

          {/* Search & Status Filter Controls */}
          <div className="bg-ivory p-4 border border-ivory-300 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 print:hidden">
            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="text"
                placeholder="Search orders by Order #, Name, Email or Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-white border border-ivory-300 p-2.5 text-xs text-ink outline-none focus:border-gold font-medium"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-ivory-300 bg-white p-2.5 text-xs text-ink uppercase tracking-wider outline-none focus:border-gold font-bold"
              >
                <option value="All">All Statuses ({orders.length})</option>
                <option value="Pending">Pending ({pendingCount})</option>
                <option value="Processing">Processing ({processingCount})</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered ({deliveredCount})</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="text-xs font-semibold text-ink-muted">
              Showing {filteredOrders.length} of {orders.length} orders
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-ivory border border-ivory-300 shadow-sm overflow-hidden print:hidden">
            <div className="lg:hidden space-y-3 p-3">
{!isMounted ? <p className="p-6 text-center text-ink-muted">Loading orders…</p> : filteredOrders.length === 0 ? <p className="p-6 text-center text-ink-muted">No orders match your filters.</p> : filteredOrders.map(o => <AdminListCard key={o.id} title={o.orderNumber} subtitle={o.customerName} badge={o.status}>
<div className="flex justify-between gap-3"><span className="text-ink-muted">Total</span><strong className="font-sans font-semibold text-crimson">{formatPrice(o.totalAmount)}</strong></div>
<div className="flex justify-between items-center text-xs py-1.5 border-y border-ivory-300">
  <span className="text-ink-muted">Payment:</span>
  <div className="flex items-center space-x-2">
    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
      (o.paymentStatus === "Paid" || (!o.paymentStatus && (o.razorpayPaymentId || o.paymentId))) ? "bg-emerald-100 text-emerald-800" : o.paymentStatus === "Failed" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
    }`}>
      {(o.paymentStatus === "Paid" || (!o.paymentStatus && (o.razorpayPaymentId || o.paymentId))) ? "Paid" : o.paymentStatus || "Pending"}
    </span>
    <span className="font-mono text-[11px] text-ink">{o.razorpayPaymentId || o.paymentId || "—"}</span>
  </div>
</div>
<p className="text-xs text-ink-muted">{o.items.reduce((sum,item) => sum + item.quantity,0)} items · {new Date(o.createdAt).toLocaleDateString('en-IN')}</p>
<div className="bg-white border border-ivory-300 rounded-lg p-3 space-y-1"><p className="font-medium">{o.customerName}</p><p className="text-xs text-ink-muted break-all">{o.customerEmail}</p><p className="text-xs text-ink-muted">{o.customerPhone}</p></div>
<label className="block text-xs text-ink-muted">Order status<select aria-label={`Status for ${o.orderNumber}`} value={o.status} onChange={event => handleStatusChange(o.id,event.target.value as Order['status'])} className="block w-full mt-2 p-3 border border-ivory-300 rounded-lg bg-white">{['Pending','Processing','Shipped','Delivered','Cancelled'].map(status => <option key={status}>{status}</option>)}</select></label>
<button onClick={() => setShippingOrder(o)} className="w-full border border-gold rounded-lg py-3 text-xs">{o.shiprocket?.orderId ? "View shipment" : "Shipping · enter parcel details"}</button>
<button onClick={() => setSelectedOrder(o)} className="w-full bg-crimson text-ivory rounded-lg py-3 text-xs">View details & invoice</button>
</AdminListCard>)}
</div><div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-ivory-300 uppercase tracking-wider text-[10px] text-ink-muted bg-ivory-200">
                    <th className="py-3.5 px-4">Order #</th>
                    <th className="py-3.5 px-4">Customer Details</th>
                    <th className="py-3.5 px-4">Items Count</th>
                    <th className="py-3.5 px-4">Total Amount</th>
                    <th className="py-3.5 px-4 min-w-[170px]">Payment</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ivory-200">
                  {!isMounted ? (
                    <tr>
                      <td data-label="" colSpan={8} className="py-8 text-center text-ink-muted font-semibold">
                        Loading Orders Log...
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td data-label="" colSpan={8} className="py-8 text-center text-ink-muted font-semibold">
                        No orders matching the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-ivory-200/50">
                        <td data-label="Order #" className="py-3 px-4 font-mono font-bold text-crimson">
                          #{o.orderNumber}
                        </td>
                        <td data-label="Customer Details" className="py-3 px-4">
                          <span className="font-semibold text-ink block">{o.customerName}</span>
                          <span className="text-[10px] text-ink-muted font-mono block">{o.customerEmail}</span>
                          <span className="text-[10px] text-gold block">{o.customerPhone}</span>
                        </td>
                        <td data-label="Items Count" className="py-3 px-4 text-ink font-semibold">
                          {o.items.reduce((sum, item) => sum + item.quantity, 0)} items
                        </td>
                        <td data-label="Total Amount" className="py-3 px-4 font-sans text-sm font-semibold text-crimson">
                          {formatPrice(o.totalAmount)}
                        </td>
                        <td data-label="Payment" className="py-3 px-4">
                          <div className="space-y-1">
                            <div>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                (o.paymentStatus === "Paid" || (!o.paymentStatus && (o.razorpayPaymentId || o.paymentId)))
                                  ? "bg-emerald-100 text-emerald-800"
                                  : o.paymentStatus === "Failed"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}>
                                {(o.paymentStatus === "Paid" || (!o.paymentStatus && (o.razorpayPaymentId || o.paymentId))) ? "Paid" : o.paymentStatus || "Pending"}
                              </span>
                            </div>
                            <span className="font-mono text-[11px] text-ink-muted block whitespace-nowrap">
                              {o.razorpayPaymentId || o.paymentId || "—"}
                            </span>
                          </div>
                        </td>
                        <td data-label="Status" className="py-3 px-4">
                          <select
                            value={o.status}
                            onChange={(e: any) => handleStatusChange(o.id, e.target.value)}
                            className="bg-ivory-50 border border-ivory-300 text-[10px] font-semibold uppercase tracking-wider p-1.5 rounded text-gold outline-none cursor-pointer"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td data-label="Date" className="py-3 px-4 text-ink-muted text-[11px]">
                          {o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN") : "—"}
                        </td>
                        <td data-label="Actions" className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button type="button" onClick={() => setShippingOrder(o)} className="px-3 py-1.5 border border-gold rounded text-[10px] font-semibold">{o.shiprocket?.orderId ? "Shipment" : "Shipping"}</button>
                            <Link
                              href={`/admin/orders/invoice/${o.id}`}
                              target="_blank"
                              className="px-3 py-1.5 bg-gold hover:bg-amber-600 text-ink text-[10px] uppercase font-extrabold tracking-wider rounded flex items-center space-x-1 cursor-pointer border border-gold shadow-sm transition-all"
                              title="Open Dedicated Invoice Page & Download PDF"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Invoice</span>
                            </Link>
                            <button
                              onClick={() => setSelectedOrder(o)}
                              className="px-3 py-1.5 bg-ivory-200 hover:bg-crimson hover:text-ivory text-ink border border-ivory-300 text-[10px] uppercase font-semibold tracking-wider rounded flex items-center space-x-1 cursor-pointer transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Details</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {shippingOrder && <ShiprocketOrderDialog key={shippingOrder.id} order={shippingOrder} onClose={() => setShippingOrder(null)} onSaved={shipping => setShippingUpdates(previous => ({ ...previous, [shippingOrder.id]: shipping }))} />}

      {/* Order Details & Printable Invoice Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-ink/75 backdrop-blur-sm overflow-y-auto p-4 sm:p-8 flex justify-center items-start pt-20 sm:pt-24 print:static print:p-0 print:bg-white print:overflow-visible">
          <div className="relative w-full max-w-4xl bg-ivory border-2 border-gold shadow-2xl p-6 sm:p-10 space-y-6 mb-16 print:border-none print:shadow-none print:p-0 print:w-full print:max-w-none print:my-0 print:text-black">
            {/* Printable Brand Invoice Header */}
            <div className="border-b-2 border-gold pb-5 print:border-black flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-[0.3em] font-extrabold text-gold block print:text-black">
                  KAAVU STYLES • LUXURY ETHNIC WEAR STUDIO
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-ink uppercase tracking-wide print:text-black mt-0.5">
                  OFFICIAL RETAIL INVOICE
                </h3>
                <p className="text-xs text-ink-muted font-mono mt-1 print:text-gray-700">
                  Invoice No: <span className="font-bold text-crimson print:text-black">INV-{selectedOrder.orderNumber}</span> • Date: {new Date(selectedOrder.createdAt).toLocaleDateString("en-IN")}
                </p>
              </div>

              <div className="flex items-center space-x-3 print:hidden">
                <Link
                  href={`/admin/orders/invoice/${selectedOrder.id}`}
                  target="_blank"
                  className="px-5 py-2.5 bg-gold hover:bg-amber-600 text-ink text-xs uppercase tracking-wider font-extrabold flex items-center space-x-2 border border-gold shadow-md transition-all cursor-pointer"
                  title="Open Dedicated Full Page Invoice"
                >
                  <Printer className="w-4 h-4 text-ink" />
                  <span>Open Full Invoice Page</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 text-ink hover:text-crimson border border-ivory-300 bg-ivory-200 transition-colors cursor-pointer"
                  title="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Customer & Delivery Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-ivory-200/90 p-5 border border-ivory-300 text-xs print:bg-gray-50 print:border-gray-300">
              <div className="space-y-1.5">
                <p className="font-bold text-ink uppercase tracking-wider text-[10px] text-gold print:text-black">
                  Billed To / Client Details
                </p>
                <p className="font-serif text-sm font-bold text-ink print:text-black">{selectedOrder.customerName}</p>
                <p className="text-ink-muted flex items-center font-mono print:text-gray-800">
                  <Mail className="w-3.5 h-3.5 text-gold mr-1.5 flex-shrink-0 print:hidden" /> {selectedOrder.customerEmail}
                </p>
                <p className="text-ink-muted flex items-center font-mono print:text-gray-800">
                  <Phone className="w-3.5 h-3.5 text-gold mr-1.5 flex-shrink-0 print:hidden" /> {selectedOrder.customerPhone}
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="font-bold text-ink uppercase tracking-wider text-[10px] text-gold print:text-black">
                  Shipping Destination & Payment Details
                </p>
                <p className="text-ink font-medium flex items-start print:text-black">
                  <MapPin className="w-3.5 h-3.5 text-gold mr-1.5 flex-shrink-0 mt-0.5 print:hidden" />
                  <span>{selectedOrder.shippingAddress}, {selectedOrder.city} - {selectedOrder.postalCode}</span>
                </p>
                <p className="text-ink-muted text-[11px] print:text-gray-800">
                  Order Status: <span className="font-bold uppercase text-crimson print:text-black">{selectedOrder.status}</span>
                </p>
                <div className="pt-2 border-t border-ivory-300 space-y-1">
                  <p className="text-[11px] text-ink print:text-gray-800">
                    <span className="text-ink-muted">Payment: </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mr-2 ${
                      (selectedOrder.paymentStatus === "Paid" || (!selectedOrder.paymentStatus && (selectedOrder.razorpayPaymentId || selectedOrder.paymentId)))
                        ? "bg-emerald-100 text-emerald-800"
                        : selectedOrder.paymentStatus === "Failed"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      {(selectedOrder.paymentStatus === "Paid" || (!selectedOrder.paymentStatus && (selectedOrder.razorpayPaymentId || selectedOrder.paymentId))) ? "Paid" : selectedOrder.paymentStatus || "Pending"}
                    </span>
                    <span className="font-mono text-ink font-semibold">
                      {selectedOrder.razorpayPaymentId || selectedOrder.paymentId || "—"}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="space-y-3">
              <h4 className="font-serif text-base text-ink uppercase font-bold tracking-wider print:text-black">
                Itemized Purchased Items
              </h4>
              <div className="border border-ivory-300 overflow-hidden print:border-gray-400">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-ink text-ivory uppercase tracking-wider text-[10px] print:bg-gray-200 print:text-black">
                      <th className="p-3">#</th>
                      <th className="p-3">Item Description</th>
                      <th className="p-3">Variant Details</th>
                      <th className="p-3">Qty</th>
                      <th className="p-3">Unit Rate</th>
                      <th className="p-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ivory-300 print:divide-gray-300">
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-ivory-100/80">
                        <td data-label="#" className="p-3 font-mono font-bold">{idx + 1}</td>
                        <td data-label="Item Description" className="p-3 font-serif font-semibold text-ink print:text-black">
                          {item.name}
                        </td>
                        <td data-label="Variant Details" className="p-3 text-ink-muted text-[11px]">
                          Size: <span className="font-semibold text-ink print:text-black">{item.size || "Standard"}</span> • Color: <span className="font-semibold text-ink print:text-black">{item.color || "Default"}</span>
                        </td>
                        <td data-label="Qty" className="p-3 font-bold font-mono">{item.quantity}</td>
                        <td data-label="Unit Rate" className="p-3 font-mono">{formatPrice(item.price)}</td>
                        <td data-label="Line Total" className="p-3 text-right font-mono font-bold text-crimson print:text-black">
                          {formatPrice(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Calculation Row */}
              <div className="bg-ivory-200 p-5 border border-ivory-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print:bg-white print:border-gray-400">
                <div className="text-[11px] text-ink-muted space-y-0.5 max-w-sm">
                  <p className="font-bold uppercase text-ink print:text-black">Kaavu Styles Quality Assurance</p>
                  <p>Handcrafted in India. Certified 100% quality inspected before dispatch.</p>
                </div>
                <div className="text-right space-y-1.5 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-ivory-300">
                  <div className="text-sm font-bold uppercase tracking-wider text-ink flex justify-between sm:justify-end space-x-6 border-t border-ivory-300 pt-1.5 print:border-black">
                    <span>Grand Total Amount:</span>
                    <span className="font-sans text-2xl font-bold text-crimson print:text-black">
                      {formatPrice(selectedOrder.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Print Footer Notice & Digital Stamp */}
            <div className="pt-4 border-t border-ivory-300 flex flex-col sm:flex-row gap-3 justify-between sm:items-center text-[10px] text-ink-muted print:text-black">
              <div>
                <p className="font-bold uppercase text-ink print:text-black">Kaavu Styles Control Center</p>
                <p>Contact: kaavustyles@gmail.com</p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-gold print:text-black uppercase">Official Computer Generated Invoice</p>
                <p>Authorized Digital Audit Stamp</p>
              </div>
            </div>

            <div className="pt-2 print:hidden flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-8 py-3 bg-ink hover:bg-burgundy text-ivory text-xs uppercase tracking-[0.2em] font-semibold shadow-md transition-colors cursor-pointer"
              >
                Close Order Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
