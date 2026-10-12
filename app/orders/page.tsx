"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/utils";
import { Package, Search, ShoppingBag, ArrowRight, CheckCircle2, Clock, Truck, AlertCircle, User as UserIcon } from "lucide-react";

export default function OrdersPage() {
  const { orders, currentUser, openAuthModal } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return (
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider rounded-full flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Delivered</span>
          </span>
        );
      case "shipped":
        return (
          <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold uppercase tracking-wider rounded-full flex items-center space-x-1">
            <Truck className="w-3.5 h-3.5" />
            <span>Shipped</span>
          </span>
        );
      case "processing":
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold uppercase tracking-wider rounded-full flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Processing</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold uppercase tracking-wider rounded-full flex items-center space-x-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Pending</span>
          </span>
        );
    }
  };

  // If user is not logged in, prompt to Sign In
  if (!currentUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center py-20 bg-ivory-50 border border-ivory-300 p-8 space-y-6 max-w-xl mx-auto shadow-luxury">
          <div className="w-16 h-16 bg-ivory-200 rounded-full flex items-center justify-center mx-auto text-burgundy border border-gold/40">
            <UserIcon className="w-8 h-8 text-gold" />
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-3xl uppercase text-ink">Sign In Required</h1>
            <p className="text-xs sm:text-sm text-ink-muted max-w-md mx-auto leading-relaxed">
              Please sign in to your Kaavu Styles account to view your order history, track shipments, and view receipts.
            </p>
          </div>
          <div>
            <button
              onClick={openAuthModal}
              className="px-8 py-3.5 bg-burgundy hover:bg-burgundy-600 text-ivory text-xs uppercase tracking-[0.24em] font-bold transition-all shadow-luxury"
            >
              Sign In / Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredOrders = orders.filter((order) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNum = order.orderNumber.toLowerCase().includes(q);
      const matchName = order.customerName.toLowerCase().includes(q);
      const matchEmail = order.customerEmail.toLowerCase().includes(q);
      const matchPhone = order.customerPhone.toLowerCase().includes(q);
      if (!matchNum && !matchName && !matchEmail && !matchPhone) return false;
    }

    if (selectedStatus !== "all" && order.status.toLowerCase() !== selectedStatus.toLowerCase()) {
      return false;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. PAGE HEADER */}
      <div className="bg-ivory-200 border border-ivory-300 p-8 sm:p-12 text-center space-y-3 shadow-luxury">
        <div className="flex items-center justify-center space-x-2 text-burgundy mb-1">
          <Package className="w-5 h-5 text-gold" />
          <span className="text-xs uppercase tracking-[0.35em] text-gold font-semibold">
            Track & Manage
          </span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl text-ink uppercase font-light">
          My Orders & <span className="text-burgundy font-normal italic">Tracking</span>
        </h1>
        <p className="text-xs sm:text-sm text-ink-muted max-w-md mx-auto">
          Look up order statuses, tracking details, and order receipts for your Kaavu Styles purchases.
        </p>
      </div>

      {/* 2. SEARCH & FILTER TOOLBAR */}
      <div className="bg-ivory-50 border border-ivory-300 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        {/* Order Search Box */}
        <div className="relative flex-1 max-w-md border border-ivory-300 bg-ivory p-2.5 flex items-center focus-within:border-gold">
          <Search className="w-4 h-4 text-gold mr-2.5" />
          <input
            type="text"
            placeholder="Search by Order # (e.g. KS-12345), Phone, or Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-ink outline-none"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto text-xs pb-1">
          <button
            onClick={() => setSelectedStatus("all")}
            className={`px-4 py-2 border transition-all font-bold tracking-wider ${
              selectedStatus === "all"
                ? "bg-crimson text-white border-gold shadow-md"
                : "bg-ivory border-ivory-300 text-ink hover:border-gold hover:bg-ivory-200"
            }`}
          >
            All Orders ({orders.length})
          </button>
          {["Pending", "Processing", "Shipped", "Delivered"].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-4 py-2 border transition-all whitespace-nowrap font-bold tracking-wider ${
                selectedStatus.toLowerCase() === st.toLowerCase()
                  ? "bg-crimson text-white border-gold shadow-md"
                  : "bg-ivory border-ivory-300 text-ink hover:border-gold hover:bg-ivory-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* 3. ORDERS LISTING */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-ivory-50 border border-ivory-300 p-8 space-y-6 max-w-2xl mx-auto shadow-sm">
          <div className="w-16 h-16 bg-ivory-200 rounded-full flex items-center justify-center mx-auto text-gold border border-gold/40">
            <Package className="w-8 h-8 text-gold" />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-2xl uppercase text-ink">No Orders Found</h2>
            <p className="text-xs sm:text-sm text-ink-muted max-w-md mx-auto">
              {searchQuery || selectedStatus !== "all"
                ? "No orders match your search criteria. Try adjusting your order number or status filter."
                : "You have not placed any orders yet. Explore our boutique collections to place your first order."}
            </p>
          </div>
          <div>
            <Link
              href="/shop"
              className="inline-flex items-center space-x-2 px-8 py-3.5 bg-burgundy hover:bg-burgundy-600 text-ivory text-xs uppercase tracking-[0.24em] font-semibold transition-all shadow-luxury"
            >
              <ShoppingBag className="w-4 h-4 text-gold" />
              <span>Explore Collection</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-ivory border border-ivory-300 shadow-luxury overflow-hidden"
            >
              {/* Card Header */}
              <div className="bg-ivory-200 border-b border-ivory-300 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-serif text-xl sm:text-2xl font-semibold text-burgundy">
                      Order #{order.orderNumber}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-xs text-ink-muted">
                    Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                <div className="sm:text-right">
                  <span className="text-[10px] uppercase tracking-wider text-gold font-semibold block">
                    Total Amount
                  </span>
                  <span className="font-sans text-xl font-bold text-burgundy">
                    {formatPrice(order.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Customer & Shipping Summary */}
              <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-ivory-300 text-xs bg-ivory-50">
                <div>
                  <span className="font-semibold text-gold uppercase tracking-wider block mb-1">
                    Customer Details
                  </span>
                  <p className="text-ink font-medium">{order.customerName}</p>
                  <p className="text-ink-muted">{order.customerEmail}</p>
                  <p className="text-ink-muted">Phone: {order.customerPhone}</p>
                </div>

                <div>
                  <span className="font-semibold text-gold uppercase tracking-wider block mb-1">
                    Delivery Address
                  </span>
                  <p className="text-ink-muted leading-relaxed">
                    {order.shippingAddress}, {order.city} {order.postalCode}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-gold uppercase tracking-wider block mb-1">
                    Payment Details
                  </span>
                  <p className="text-emerald-700 font-semibold uppercase tracking-wider">
                    {(order.paymentStatus === "Paid" || (!order.paymentStatus && (order.razorpayPaymentId || order.paymentId))) ? "Paid / Confirmed" : order.paymentStatus || "Pending"}
                  </p>
                  {(order.razorpayPaymentId || order.paymentId) && (
                    <p className="text-ink-muted text-[11px] font-mono">
                      Ref: {order.razorpayPaymentId || order.paymentId}
                    </p>
                  )}
                  <p className="text-ink-muted text-[11px]">Standard Express Delivery</p>
                </div>
              </div>

              {/* Order Items */}
              <div className="p-4 sm:p-6 space-y-4">
                <span className="text-xs uppercase tracking-wider text-gold font-semibold block">
                  Items Purchased ({order.items.length})
                </span>

                <div className="divide-y divide-ivory-200">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center space-x-4">
                        <div className="relative w-14 h-16 bg-ink border border-ivory-300 overflow-hidden flex-shrink-0">
                          <Image
                            src={item.image || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=600"}
                            alt={item.name || "Product"}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-serif text-base text-ink font-medium">
                            {item.name}
                          </h4>
                          <div className="flex items-center space-x-3 text-xs text-ink-muted mt-0.5">
                            <span>Size: {item.size}</span>
                            <span>•</span>
                            <span>Color: {item.color}</span>
                            <span>•</span>
                            <span>Qty: {item.quantity}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-sans text-sm font-semibold text-burgundy">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
