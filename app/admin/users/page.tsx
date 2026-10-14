"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import { useStore } from "@/context/StoreContext";
import { RegisteredUser, Order } from "@/lib/mockData";
import { formatPrice } from "@/lib/utils";
import {
  Users,
  UserPlus,
  Search,
  Mail,
  Phone,
  ShoppingBag,
  DollarSign,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  Calendar,
  Download,
  Trash2,
  X,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Package,
  Clock,
  Sparkles,
} from "lucide-react";

interface AggregatedUser extends RegisteredUser {
  orderCount: number;
  totalSpent: number;
  lastOrderDate?: string;
  orders: Order[];
}

export default function AdminUsersPage() {
  const { registeredUsers, orders, registerUser, deleteRegisteredUser } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "buyers" | "new">("all");
  const [sortBy, setSortBy] = useState<"orders-desc" | "spent-desc" | "recent" | "name">("orders-desc");
  const [isMounted, setIsMounted] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Modal states
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  // Selected User Orders View Modal
  const [selectedUserForOrders, setSelectedUserForOrders] = useState<AggregatedUser | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Merge registered users with any customers who placed orders
  const aggregatedUsers: AggregatedUser[] = useMemo(() => {
    const userMap = new Map<string, AggregatedUser>();

    // 1. Seed with registered users
    registeredUsers.forEach((u) => {
      const emailKey = u.email.trim().toLowerCase();
      userMap.set(emailKey, {
        ...u,
        orderCount: 0,
        totalSpent: 0,
        orders: [],
      });
    });

    // 2. Aggregate from orders
    orders.forEach((ord) => {
      const emailKey = ord.customerEmail ? ord.customerEmail.trim().toLowerCase() : "";
      if (!emailKey) return;

      const existing = userMap.get(emailKey);
      if (existing) {
        existing.orders.push(ord);
        existing.orderCount += 1;
        existing.totalSpent += Number(ord.totalAmount) || 0;
        if (!existing.phone && ord.customerPhone) {
          existing.phone = ord.customerPhone;
        }
        if (
          !existing.lastOrderDate ||
          new Date(ord.createdAt).getTime() > new Date(existing.lastOrderDate).getTime()
        ) {
          existing.lastOrderDate = ord.createdAt;
        }
      } else {
        // Customer who bought but isn't explicitly in registeredUsers table yet
        userMap.set(emailKey, {
          id: "cust-order-" + ord.id,
          name: ord.customerName || emailKey.split("@")[0],
          email: emailKey,
          phone: ord.customerPhone || "",
          role: "customer",
          createdAt: ord.createdAt || new Date().toISOString(),
          orderCount: 1,
          totalSpent: Number(ord.totalAmount) || 0,
          lastOrderDate: ord.createdAt,
          orders: [ord],
        });
      }
    });

    return Array.from(userMap.values());
  }, [registeredUsers, orders]);

  // Key Metric Calculations
  const totalUsersCount = aggregatedUsers.length;
  const activeBuyersCount = aggregatedUsers.filter((u) => u.orderCount > 0).length;
  const newRegistrationsCount = aggregatedUsers.filter((u) => u.orderCount === 0).length;
  const totalOrdersSum = aggregatedUsers.reduce((sum, u) => sum + u.orderCount, 0);
  const totalSpentSum = aggregatedUsers.reduce((sum, u) => sum + u.totalSpent, 0);

  // Filtered & Sorted Users
  const filteredUsers = useMemo(() => {
    let list = [...aggregatedUsers];

    // Filter by type
    if (filterType === "buyers") {
      list = list.filter((u) => u.orderCount > 0);
    } else if (filterType === "new") {
      list = list.filter((u) => u.orderCount === 0);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.replace(/\s+/g, "").includes(q.replace(/\s+/g, ""))
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "orders-desc") {
        return b.orderCount - a.orderCount || b.totalSpent - a.totalSpent;
      }
      if (sortBy === "spent-desc") {
        return b.totalSpent - a.totalSpent;
      }
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "recent") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });

    return list;
  }, [aggregatedUsers, filterType, searchQuery, sortBy]);

  const handleCopy = (text: string, label: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2000);
    }
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    setAddLoading(true);
    try {
      await registerUser(newName, newEmail, newPhone);
      setAddSuccess(true);
      setTimeout(() => {
        setNewName("");
        setNewEmail("");
        setNewPhone("");
        setAddLoading(false);
        setAddSuccess(false);
        setIsAddUserOpen(false);
      }, 1000);
    } catch (err) {
      console.error("Error creating user:", err);
      setAddLoading(false);
    }
  };

  const handleDeleteUser = async (user: AggregatedUser) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to remove ${user.name} (${user.email}) from registered users?`
    );
    if (!confirmDelete) return;

    try {
      await deleteRegisteredUser(user.id, user.email);
    } catch (e) {
      console.error("Failed to delete user:", e);
    }
  };

  // Export Users CSV
  const handleExportCSV = () => {
    if (!aggregatedUsers.length) return;

    const headers = [
      "User ID",
      "Full Name",
      "Email Address",
      "Phone Number",
      "Role",
      "Order Count",
      "Total Spent (INR)",
      "Registered Date",
      "Last Order Date",
    ];

    const rows = aggregatedUsers.map((u) => [
      `"${u.id}"`,
      `"${u.name.replace(/"/g, '""')}"`,
      `"${u.email}"`,
      `"${u.phone || ""}"`,
      `"${u.role || "customer"}"`,
      u.orderCount,
      u.totalSpent,
      `"${new Date(u.createdAt).toLocaleDateString("en-IN")}"`,
      `"${u.lastOrderDate ? new Date(u.lastOrderDate).toLocaleDateString("en-IN") : "No Orders"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `kaavu-styles-registered-users-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCleanPhone = (phoneStr: string) => {
    return phoneStr.replace(/[^0-9]/g, "");
  };

  return (
    <div className="flex min-h-screen bg-[#FBF8F3]">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminHeader title="Registered Users & Customers" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header Banner & Action Buttons */}
          <div className="bg-[#2B0B14] text-ivory p-6 border-2 border-gold/40 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-gold/20 border border-gold/50 text-gold rounded-none">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <h2 className="font-serif text-lg sm:text-xl text-ivory uppercase tracking-wide flex items-center space-x-2">
                  <span>Registered Users & Customer Hub</span>
                  <span className="px-2.5 py-0.5 bg-gold text-ink text-[10px] font-mono tracking-wider uppercase font-extrabold">
                    Live Data
                  </span>
                </h2>
                <p className="text-xs text-ivory-300 mt-1 max-w-xl">
                  Inspect registered buyer accounts, phone numbers, contact info, and track individual order counts.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-gold/15 hover:bg-gold/25 border border-gold/50 text-gold text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                title="Download user directory in CSV spreadsheet format"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddUserOpen(true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-crimson hover:bg-crimson-800 border border-gold text-ivory text-xs font-bold uppercase tracking-wider transition-colors shadow-md cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-gold" />
                <span>Add Customer</span>
              </button>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Total Users */}
            <div className="bg-ivory border-2 border-ivory-300 p-5 space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-ink-muted">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold">
                  Total Registered Users
                </span>
                <Users className="w-4 h-4 text-gold" />
              </div>
              <p className="font-sans text-3xl font-bold text-ink" suppressHydrationWarning>
                {isMounted ? totalUsersCount : 0}
              </p>
              <span className="text-[10px] text-gold font-semibold block uppercase tracking-wider">
                All Customer Records
              </span>
            </div>

            {/* Active Buyers */}
            <div className="bg-emerald-50/70 border-2 border-emerald-300 p-5 space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-emerald-800">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold">
                  Active Buyers (≥1 Order)
                </span>
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="font-sans text-3xl font-bold text-emerald-900" suppressHydrationWarning>
                {isMounted ? activeBuyersCount : 0}
              </p>
              <span className="text-[10px] text-emerald-700 font-semibold block">
                {isMounted && totalUsersCount > 0
                  ? `${Math.round((activeBuyersCount / totalUsersCount) * 100)}% conversion rate`
                  : "0% conversion"}
              </span>
            </div>

            {/* Total Orders Generated */}
            <div className="bg-amber-50/70 border-2 border-amber-300 p-5 space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-amber-900">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold">
                  Total Orders Generated
                </span>
                <Package className="w-4 h-4 text-amber-600" />
              </div>
              <p className="font-sans text-3xl font-bold text-amber-800" suppressHydrationWarning>
                {isMounted ? totalOrdersSum : 0}
              </p>
              <span className="text-[10px] text-amber-700 font-semibold block uppercase">
                {isMounted && activeBuyersCount > 0
                  ? `${(totalOrdersSum / activeBuyersCount).toFixed(1)} Orders / Buyer`
                  : "0 Orders / Buyer"}
              </span>
            </div>

            {/* Total Customer Revenue */}
            <div className="bg-[#2B0B14] border-2 border-gold/40 p-5 space-y-2 shadow-sm text-ivory">
              <div className="flex items-center justify-between text-gold">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-ivory-300">
                  Total Lifetime Spent
                </span>
                <DollarSign className="w-4 h-4 text-gold" />
              </div>
              <p className="font-sans text-2xl sm:text-3xl font-bold text-gold" suppressHydrationWarning>
                {isMounted ? formatPrice(totalSpentSum) : "₹0"}
              </p>
              <span className="text-[10px] text-ivory-300 font-medium block">
                Across all buyer purchases
              </span>
            </div>
          </div>

          {/* Search, Filter Tabs & Sort Controls */}
          <div className="bg-ivory border border-ivory-300 p-4 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Filter Tabs */}
              <div className="flex items-center space-x-1.5 p-1 bg-ivory-200 border border-ivory-300 rounded overflow-x-auto text-xs font-sans">
                <button
                  type="button"
                  onClick={() => setFilterType("all")}
                  className={`px-3 py-1.5 rounded uppercase tracking-wider font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    filterType === "all"
                      ? "bg-[#2B0B14] text-gold shadow-sm"
                      : "text-ink-muted hover:text-ink hover:bg-ivory-300/60"
                  }`}
                >
                  All Users ({totalUsersCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("buyers")}
                  className={`px-3 py-1.5 rounded uppercase tracking-wider font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    filterType === "buyers"
                      ? "bg-[#2B0B14] text-gold shadow-sm"
                      : "text-ink-muted hover:text-ink hover:bg-ivory-300/60"
                  }`}
                >
                  Buyers ({activeBuyersCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("new")}
                  className={`px-3 py-1.5 rounded uppercase tracking-wider font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    filterType === "new"
                      ? "bg-[#2B0B14] text-gold shadow-sm"
                      : "text-ink-muted hover:text-ink hover:bg-ivory-300/60"
                  }`}
                >
                  New (0 Orders) ({newRegistrationsCount})
                </button>
              </div>

              {/* Sort Selector */}
              <div className="flex items-center space-x-2">
                <label className="text-xs uppercase tracking-wider text-ink-muted font-bold flex items-center space-x-1 whitespace-nowrap">
                  <ArrowUpDown className="w-3.5 h-3.5 text-gold" />
                  <span>Sort By:</span>
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-ivory border border-ivory-300 px-3 py-1.5 text-xs text-ink rounded font-sans focus:outline-none focus:border-gold cursor-pointer"
                >
                  <option value="orders-desc">Order Count (High to Low)</option>
                  <option value="spent-desc">Total Spent (High to Low)</option>
                  <option value="recent">Recently Registered</option>
                  <option value="name">Customer Name (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gold" />
              <input
                type="text"
                placeholder="Search registered users by customer name, email address, or phone number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-ivory-50 border border-ivory-300 rounded text-xs text-ink placeholder:text-ink-muted/70 focus:outline-none focus:border-gold shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-crimson p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Users Table (Desktop) & Cards (Mobile) */}
          <div className="bg-ivory border-2 border-ivory-300 shadow-sm overflow-hidden">
            {/* Header info bar */}
            <div className="px-5 py-3.5 border-b border-ivory-300 bg-ivory-200 flex justify-between items-center text-xs text-ink">
              <span className="font-bold uppercase tracking-[0.15em] text-ink">
                Showing {filteredUsers.length} of {totalUsersCount} Customer Accounts
              </span>
              {copiedText && (
                <span className="text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded text-[11px] font-semibold animate-fadeIn">
                  ✓ Copied {copiedText}
                </span>
              )}
            </div>

            {filteredUsers.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-ivory-200 border-2 border-dashed border-gold/50 mx-auto flex items-center justify-center text-gold">
                  <Users className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-lg text-ink">No Registered Users Found</h3>
                  <p className="text-xs text-ink-muted max-w-md mx-auto">
                    {searchQuery
                      ? `No customer matches the query "${searchQuery}". Clear your search or try another keyword.`
                      : "No registered customers found in this filter category."}
                  </p>
                </div>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="px-4 py-2 bg-[#2B0B14] text-gold text-xs font-bold uppercase tracking-wider rounded border border-gold/40 cursor-pointer"
                  >
                    Clear Search Query
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* 1. DESKTOP TABLE */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs text-ink">
                    <thead className="bg-[#2B0B14] text-ivory uppercase tracking-[0.16em] text-[10px] font-bold border-b border-gold/40">
                      <tr>
                        <th className="py-3.5 px-4">Customer Name</th>
                        <th className="py-3.5 px-4">Email Address</th>
                        <th className="py-3.5 px-4">Phone Number</th>
                        <th className="py-3.5 px-4 text-center">Order Count</th>
                        <th className="py-3.5 px-4">Total Spent</th>
                        <th className="py-3.5 px-4">Registered Date</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ivory-300">
                      {filteredUsers.map((user) => {
                        const cleanPhone = getCleanPhone(user.phone || "");
                        const initials = user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2) || "U";

                        return (
                          <tr
                            key={user.email}
                            className="hover:bg-ivory-100/80 transition-colors"
                          >
                            {/* Customer Name */}
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-9 h-9 rounded-full bg-[#2B0B14] text-gold border border-gold/60 font-serif font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                                  {initials}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-ink truncate text-sm">
                                    {user.name}
                                  </p>
                                  <span className="text-[10px] text-ink-muted uppercase tracking-wider">
                                    {user.role === "admin" ? "Store Administrator" : "Customer"}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Email */}
                            <td className="py-4 px-4 font-mono text-xs">
                              <div className="flex items-center space-x-2">
                                <a
                                  href={`mailto:${user.email}`}
                                  className="text-ink hover:text-crimson hover:underline truncate max-w-[180px]"
                                  title={`Email ${user.email}`}
                                >
                                  {user.email}
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(user.email, "email")}
                                  className="text-ink-muted hover:text-gold p-1 transition-colors"
                                  title="Copy email address"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                            {/* Phone */}
                            <td className="py-4 px-4 font-mono text-xs">
                              {user.phone ? (
                                <div className="flex items-center space-x-2">
                                  <a
                                    href={`tel:${user.phone}`}
                                    className="text-ink hover:text-gold font-medium truncate"
                                  >
                                    {user.phone}
                                  </a>
                                  {cleanPhone && (
                                    <a
                                      href={`https://wa.me/${cleanPhone.startsWith("91") ? cleanPhone : "91" + cleanPhone}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Open WhatsApp chat with this customer"
                                      className="text-emerald-600 hover:text-emerald-700 p-1 bg-emerald-50 rounded border border-emerald-200 transition-colors"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(user.phone, "phone")}
                                    className="text-ink-muted hover:text-gold p-1 transition-colors"
                                    title="Copy phone number"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-ink-muted italic text-[11px]">Not provided</span>
                              )}
                            </td>

                            {/* Order Count Badge */}
                            <td className="py-4 px-4 text-center">
                              {user.orderCount > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedUserForOrders(user)}
                                  className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm hover:bg-emerald-200 transition-colors cursor-pointer"
                                  title="Click to view customer's order history"
                                >
                                  <ShoppingBag className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>{user.orderCount} {user.orderCount === 1 ? "Order" : "Orders"}</span>
                                </button>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-ivory-200 text-ink-muted border border-ivory-300">
                                  <span>0 Orders (New)</span>
                                </span>
                              )}
                            </td>

                            {/* Total Spent */}
                            <td className="py-4 px-4 font-semibold text-ink text-sm">
                              {user.totalSpent > 0 ? (
                                <span className="text-crimson font-bold">
                                  {formatPrice(user.totalSpent)}
                                </span>
                              ) : (
                                <span className="text-ink-muted">₹0</span>
                              )}
                            </td>

                            {/* Registered Date */}
                            <td className="py-4 px-4 text-ink-muted text-xs whitespace-nowrap">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                                <span>{new Date(user.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                {user.orderCount > 0 ? (
                                  <Link
                                    href={`/admin/orders?search=${encodeURIComponent(user.email)}`}
                                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-[#2B0B14] text-gold hover:bg-crimson hover:text-ivory text-xs font-bold uppercase tracking-wider rounded border border-gold/40 transition-colors"
                                    title="Filter order listing for this user"
                                  >
                                    <span>View Orders</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </Link>
                                ) : (
                                  <button
                                    type="button"
                                    disabled
                                    className="px-2.5 py-1.5 bg-ivory-200 text-ink-muted/60 text-xs font-medium rounded border border-ivory-300 cursor-not-allowed"
                                  >
                                    No Orders
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(user)}
                                  className="p-1.5 text-ink-muted hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                  title="Remove customer from list"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 2. MOBILE CARDS VIEW */}
                <div className="md:hidden divide-y divide-ivory-300">
                  {filteredUsers.map((user) => {
                    const cleanPhone = getCleanPhone(user.phone || "");
                    const initials = user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || "U";

                    return (
                      <div key={user.email} className="p-4 space-y-3 bg-ivory">
                        {/* Top row: Avatar, Name & Order Count */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-[#2B0B14] text-gold border border-gold/60 font-serif font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-ink text-sm truncate">
                                {user.name}
                              </h4>
                              <p className="text-[10px] text-ink-muted uppercase tracking-wider">
                                {user.role === "admin" ? "Administrator" : "Customer"} · Since{" "}
                                {new Date(user.createdAt).toLocaleDateString("en-IN", {
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                          </div>

                          {/* Order Badge */}
                          <div>
                            {user.orderCount > 0 ? (
                              <button
                                type="button"
                                onClick={() => setSelectedUserForOrders(user)}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm"
                              >
                                <ShoppingBag className="w-3 h-3 text-emerald-700" />
                                <span>{user.orderCount} {user.orderCount === 1 ? "Order" : "Orders"}</span>
                              </button>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-ivory-200 text-ink-muted border border-ivory-300">
                                0 Orders
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Contact details */}
                        <div className="bg-ivory-50 border border-ivory-300 p-2.5 rounded space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-ink-muted">Email:</span>
                            <div className="flex items-center space-x-1.5">
                              <a
                                href={`mailto:${user.email}`}
                                className="font-mono text-ink hover:text-crimson truncate max-w-[190px]"
                              >
                                {user.email}
                              </a>
                              <button
                                type="button"
                                onClick={() => handleCopy(user.email, "email")}
                                className="text-ink-muted hover:text-gold p-0.5"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-ink-muted">Phone:</span>
                            {user.phone ? (
                              <div className="flex items-center space-x-2">
                                <a
                                  href={`tel:${user.phone}`}
                                  className="font-mono font-medium text-ink hover:text-gold"
                                >
                                  {user.phone}
                                </a>
                                {cleanPhone && (
                                  <a
                                    href={`https://wa.me/${cleanPhone.startsWith("91") ? cleanPhone : "91" + cleanPhone}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-emerald-600 bg-emerald-50 p-1 rounded border border-emerald-200"
                                    title="WhatsApp chat"
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="text-ink-muted italic text-[11px]">Not provided</span>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-ivory-200">
                            <span className="text-[10px] uppercase font-bold text-ink-muted">Total Spent:</span>
                            <span className="font-bold text-crimson text-xs">
                              {formatPrice(user.totalSpent)}
                            </span>
                          </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          {user.orderCount > 0 ? (
                            <Link
                              href={`/admin/orders?search=${encodeURIComponent(user.email)}`}
                              className="flex-1 inline-flex items-center justify-center space-x-1.5 py-2 bg-[#2B0B14] text-gold text-xs font-bold uppercase tracking-wider rounded border border-gold/40"
                            >
                              <span>View {user.orderCount} Orders</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          ) : (
                            <div className="flex-1 py-1.5 text-center text-xs text-ink-muted italic">
                              No orders placed yet
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user)}
                            className="p-2 text-ink-muted hover:text-rose-600 bg-ivory-100 rounded border border-ivory-300"
                            title="Delete customer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* MODAL 1: ADD NEW USER */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-ink/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-ivory border-2 border-gold shadow-2xl max-w-md w-full overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="bg-[#2B0B14] p-4 text-ivory border-b border-gold/40 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-gold" />
                <h3 className="font-serif text-base uppercase tracking-wider text-ivory">
                  Register New Customer
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUserOpen(false)}
                className="text-ivory/70 hover:text-ivory p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddUserSubmit} className="p-6 space-y-4">
              {addSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold rounded flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Customer registered successfully!</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted mb-1">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meenakshi Sundaram"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 bg-ivory-50 border border-ivory-300 rounded text-xs text-ink focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full p-2.5 bg-ivory-50 border border-ivory-300 rounded text-xs text-ink focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full p-2.5 bg-ivory-50 border border-ivory-300 rounded text-xs text-ink focus:outline-none focus:border-gold"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 border border-ivory-300 text-xs font-bold uppercase tracking-wider text-ink-muted hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2.5 bg-[#2B0B14] hover:bg-crimson border border-gold text-gold hover:text-ivory text-xs font-bold uppercase tracking-wider transition-colors shadow cursor-pointer disabled:opacity-50"
                >
                  {addLoading ? "Saving..." : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: USER ORDER HISTORY POPUP */}
      {selectedUserForOrders && (
        <div className="fixed inset-0 z-50 bg-ink/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-ivory border-2 border-gold shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="bg-[#2B0B14] p-4 text-ivory border-b border-gold/40 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base uppercase tracking-wider text-ivory">
                  {selectedUserForOrders.name}'s Order History
                </h3>
                <p className="text-[11px] text-gold font-sans mt-0.5">
                  {selectedUserForOrders.email} · {selectedUserForOrders.orderCount} Total Orders
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForOrders(null)}
                className="text-ivory/70 hover:text-ivory p-1.5 rounded-full hover:bg-ink-light"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Orders list */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-3 divide-y divide-ivory-300">
              {selectedUserForOrders.orders.map((ord) => (
                <div key={ord.id} className="pt-3 first:pt-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-xs text-ink block">
                        {ord.orderNumber}
                      </span>
                      <span className="text-[10px] text-ink-muted flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-gold" />
                        <span>
                          {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-sm text-crimson block">
                        {formatPrice(ord.totalAmount)}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                          ord.status === "Delivered"
                            ? "bg-emerald-100 text-emerald-800"
                            : ord.status === "Cancelled"
                            ? "bg-rose-100 text-rose-800"
                            : ord.status === "Shipped"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="bg-ivory-50 border border-ivory-300 p-2.5 rounded text-xs text-ink space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                      Items Ordered ({ord.items.length}):
                    </p>
                    <div className="space-y-1">
                      {ord.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-[11px]">
                          <span className="truncate max-w-[320px]">
                            {item.quantity}× {item.name} ({item.size} / {item.color})
                          </span>
                          <span className="font-mono text-ink-muted">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Link
                      href={`/admin/orders/invoice/${ord.id}`}
                      target="_blank"
                      className="text-xs text-gold hover:text-crimson font-bold uppercase tracking-wider inline-flex items-center space-x-1"
                    >
                      <span>Print 4×6 Invoice</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 bg-ivory-200 border-t border-ivory-300 flex justify-between items-center">
              <span className="text-xs text-ink font-bold">
                Total Lifetime: {formatPrice(selectedUserForOrders.totalSpent)}
              </span>
              <button
                type="button"
                onClick={() => setSelectedUserForOrders(null)}
                className="px-4 py-1.5 bg-[#2B0B14] text-gold font-bold text-xs uppercase tracking-wider rounded border border-gold/40 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
