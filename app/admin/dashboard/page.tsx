"use client";

import React, { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  ShoppingBag,
  ClipboardList,
  Grid,
  DollarSign,
  ArrowUpRight,
  Ticket,
  Sliders,
  Image as ImageIcon,
  Database,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const {
    products,
    categories,
    orders,
    ordersError,
    banners,
    coupons,
    lifestyleTags,
    sizes,
    colors,
    instagramPosts,
  } = useStore();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const activeCouponsCount = coupons.filter((c) => c.isActive).length;
  const marqueeCouponsCount = coupons.filter((c) => c.isActive && c.showInNavbar).length;
  const inStockCount = products.filter((p) => p.stock > 5).length;
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;

  return (
    <div className="flex min-h-screen bg-[#FBF8F3]">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminHeader title="Admin Overview Dashboard" />

        <main className="p-6 sm:p-8 space-y-8">
          {ordersError && <p role="alert" className="rounded-lg bg-crimson/5 p-4 text-sm text-crimson">{ordersError} <Link href="/admin/login" className="underline">Sign in again</Link></p>}
          {/* Database Sync Status Banner (Rich Deep Burgundy Theme) */}
          <div className="bg-[#2B0B14] text-ivory p-5 border-2 border-gold/40 shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-gold/20 border border-gold/50 text-gold rounded-none">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-serif text-lg text-ivory uppercase flex items-center space-x-2">
                  <span>Store Catalog Statistics & DB Status</span>
                  <span className="px-2.5 py-0.5 bg-gold text-ink text-[10px] font-mono tracking-wider uppercase font-extrabold">
                    {isSupabaseConfigured ? "Supabase Cloud Active" : "Local Sync Active"}
                  </span>
                </h2>
                <p className="text-xs text-ivory-300 mt-1">
                  Real-time database count across products, orders, categories, coupons & attributes.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs font-bold text-gold bg-gold/10 px-4 py-2 border border-gold/30">
              <CheckCircle2 className="w-4 h-4 text-gold animate-pulse" />
              <span className="uppercase tracking-wider">Live Count Synchronized</span>
            </div>
          </div>

          {/* Primary Key Metrics Cards (Distinct Luxury Colors) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Revenue - Deep Velvet Burgundy */}
            <div className="bg-[#2B0B14] border-2 border-gold/40 p-6 space-y-3 shadow-md">
              <div className="flex items-center justify-between text-gold">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-ivory-300">
                  Total Sales Revenue
                </span>
                <div className="p-2 bg-gold/20 rounded-full">
                  <DollarSign className="w-5 h-5 text-gold" />
                </div>
              </div>
              <p className="font-sans text-3xl font-bold text-gold" suppressHydrationWarning>
                {isMounted ? formatPrice(totalSales) : "₹0"}
              </p>
              <p className="text-[10px] text-ivory-300 font-medium">From {isMounted ? orders.length : 0} completed orders</p>
            </div>

            {/* Total Orders - Warm Royal Ivory/Gold */}
            <div className="bg-[#FAF3E6] border-2 border-gold/60 p-6 space-y-3 shadow-md">
              <div className="flex items-center justify-between text-gold-700">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-900">
                  Total Orders
                </span>
                <div className="p-2 bg-gold/20 rounded-full">
                  <ClipboardList className="w-5 h-5 text-amber-800" />
                </div>
              </div>
              <p className="font-sans text-3xl font-bold text-ink" suppressHydrationWarning>
                {isMounted ? orders.length : 0}
              </p>
              <p className="text-[10px] text-amber-800 font-semibold">Customer checkout orders logged</p>
            </div>

            {/* Total Catalog Products - Soft Emerald */}
            <div className="bg-[#F3F9F5] border-2 border-emerald-300 p-6 space-y-3 shadow-md">
              <div className="flex items-center justify-between text-emerald-700">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-900">
                  Total Catalog Products
                </span>
                <div className="p-2 bg-emerald-100 rounded-full">
                  <ShoppingBag className="w-5 h-5 text-emerald-700" />
                </div>
              </div>
              <p className="font-sans text-3xl font-bold text-emerald-950" suppressHydrationWarning>
                {isMounted ? products.length : 0}
              </p>
              <p className="text-[10px] text-emerald-800 font-medium" suppressHydrationWarning>
                {isMounted ? `${inStockCount} In Stock · ${lowStockCount} Low · ${outOfStockCount} Out` : "Loading..."}
              </p>
            </div>

            {/* Active Coupons - Warm Amber Ticket */}
            <div className="bg-[#FCF7E8] border-2 border-amber-300 p-6 space-y-3 shadow-md">
              <div className="flex items-center justify-between text-amber-700">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-950">
                  Active Coupons
                </span>
                <div className="p-2 bg-amber-100 rounded-full">
                  <Ticket className="w-5 h-5 text-amber-700" />
                </div>
              </div>
              <p className="font-sans text-3xl font-bold text-crimson" suppressHydrationWarning>
                {isMounted ? activeCouponsCount : 0}
              </p>
              <p className="text-[10px] text-amber-900 font-semibold" suppressHydrationWarning>
                {isMounted ? `${marqueeCouponsCount} showing in Top Navbar Marquee` : ""}
              </p>
            </div>
          </div>

          {/* Secondary Entity Count Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-ivory p-4 border border-ivory-300 shadow-sm space-y-1">
              <span className="text-[10px] uppercase tracking-widest font-bold text-ink-muted">Categories</span>
              <p className="font-sans text-2xl font-bold text-ink" suppressHydrationWarning>
                {isMounted ? categories.length : 0}
              </p>
              <span className="text-[9px] text-gold uppercase font-bold">Catalog Taxonomies</span>
            </div>
            <div className="bg-ivory p-4 border border-ivory-300 shadow-sm space-y-1">
              <span className="text-[10px] uppercase tracking-widest font-bold text-ink-muted">Hero Banners</span>
              <p className="font-sans text-2xl font-bold text-ink" suppressHydrationWarning>
                {isMounted ? banners.length : 0}
              </p>
              <span className="text-[9px] text-gold uppercase font-bold">Homepage Slider</span>
            </div>
            <div className="bg-ivory p-4 border border-ivory-300 shadow-sm space-y-1">
              <span className="text-[10px] uppercase tracking-widest font-bold text-ink-muted">Attributes & Tags</span>
              <p className="font-sans text-2xl font-bold text-ink" suppressHydrationWarning>
                {isMounted ? lifestyleTags.length + sizes.length + colors.length : 0}
              </p>
              <span className="text-[9px] text-gold uppercase font-bold" suppressHydrationWarning>
                {isMounted ? `${lifestyleTags.length} Tags · ${sizes.length} Sizes · ${colors.length} Colors` : ""}
              </span>
            </div>
            <div className="bg-ivory p-4 border border-ivory-300 shadow-sm space-y-1">
              <span className="text-[10px] uppercase tracking-widest font-bold text-ink-muted">Instagram Feed</span>
              <p className="font-sans text-2xl font-bold text-ink" suppressHydrationWarning>
                {isMounted ? instagramPosts.length : 0}
              </p>
              <span className="text-[9px] text-gold uppercase font-bold">Social Showcase Posts</span>
            </div>
          </div>

          {/* Quick Management Links Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Link
              href="/admin/products"
              className="bg-ivory p-6 border-2 border-ivory-300 hover:border-crimson transition-all space-y-3 group shadow-sm hover:bg-ivory-200/50"
            >
              <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
                <h3 className="font-serif text-lg text-ink uppercase group-hover:text-crimson font-bold" suppressHydrationWarning>
                  Products <span className="font-sans font-bold">({isMounted ? products.length : 0})</span>
                </h3>
                <ArrowUpRight className="w-5 h-5 text-gold group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
              <p className="text-xs text-ink-muted">
                Add products, set stock levels, filter by availability, assign tags.
              </p>
            </Link>

            <Link
              href="/admin/coupons"
              className="bg-ivory p-6 border-2 border-ivory-300 hover:border-crimson transition-all space-y-3 group shadow-sm hover:bg-ivory-200/50"
            >
              <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
                <h3 className="font-serif text-lg text-ink uppercase group-hover:text-crimson font-bold" suppressHydrationWarning>
                  Coupons <span className="font-sans font-bold">({isMounted ? coupons.length : 0})</span>
                </h3>
                <ArrowUpRight className="w-5 h-5 text-gold group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
              <p className="text-xs text-ink-muted">
                Create percentage/fixed promo codes, copy codes & toggle marquee banners.
              </p>
            </Link>

            <Link
              href="/admin/orders"
              className="bg-ivory p-6 border-2 border-ivory-300 hover:border-crimson transition-all space-y-3 group shadow-sm hover:bg-ivory-200/50"
            >
              <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
                <h3 className="font-serif text-lg text-ink uppercase group-hover:text-crimson font-bold" suppressHydrationWarning>
                  Orders <span className="font-sans font-bold">({isMounted ? orders.length : 0})</span>
                </h3>
                <ArrowUpRight className="w-5 h-5 text-gold group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
              <p className="text-xs text-ink-muted">
                View customer order details, shipping addresses, & update statuses.
              </p>
            </Link>

            <Link
              href="/admin/banners"
              className="bg-ivory p-6 border-2 border-ivory-300 hover:border-crimson transition-all space-y-3 group shadow-sm hover:bg-ivory-200/50"
            >
              <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
                <h3 className="font-serif text-lg text-ink uppercase group-hover:text-crimson font-bold" suppressHydrationWarning>
                  Banners <span className="font-sans font-bold">({isMounted ? banners.length : 0})</span>
                </h3>
                <ArrowUpRight className="w-5 h-5 text-gold group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
              <p className="text-xs text-ink-muted">
                Upload home hero widescreen banner slides and manage Instagram feeds.
              </p>
            </Link>
          </div>

          {/* Recent Orders Table */}
          <div className="bg-ivory border border-ivory-300 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-ivory-300 pb-4">
              <h3 className="font-serif text-xl text-ink uppercase font-semibold">Recent Customer Orders</h3>
              <Link
                href="/admin/orders"
                className="text-xs text-crimson font-semibold uppercase tracking-wider hover:underline"
                suppressHydrationWarning
              >
                View All Orders ({isMounted ? orders.length : 0}) →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-ivory-300 uppercase tracking-wider text-[10px] text-ink-muted bg-ivory-200">
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ivory-200">
                  {!isMounted ? (
                    <tr>
                      <td data-label="" colSpan={5} className="py-6 text-center text-ink-muted">
                        Loading Order Log...
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td data-label="" colSpan={5} className="py-6 text-center text-ink-muted">
                        No customer orders recorded yet.
                      </td>
                    </tr>
                  ) : (
                    orders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="hover:bg-ivory-200/50">
                        <td data-label="Order #" className="py-3 px-4 font-mono font-semibold text-crimson">
                          #{order.orderNumber}
                        </td>
                        <td data-label="Customer" className="py-3 px-4 text-ink">
                          {order.customerName}
                          <span className="block text-[10px] text-ink-muted">{order.customerEmail}</span>
                        </td>
                        <td data-label="Total" className="py-3 px-4 font-semibold text-ink">
                          {formatPrice(order.totalAmount)}
                        </td>
                        <td data-label="Status" className="py-3 px-4">
                          <span className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded bg-gold/15 text-gold border border-gold/30">
                            {order.status}
                          </span>
                        </td>
                        <td data-label="Date" className="py-3 px-4 text-ink-muted text-[11px]">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "—"}
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
    </div>
  );
}

