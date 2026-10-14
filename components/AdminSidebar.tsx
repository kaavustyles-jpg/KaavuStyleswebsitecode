"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import {
  LayoutDashboard,
  ShoppingBag,
  Grid,
  ClipboardList,
  Users,
  Image as ImageIcon,
  Tag,
  Instagram,
  LogOut,
  ArrowLeft,
  Shield,
  Ticket,
  Menu,
  X,
} from "lucide-react";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, currentUser } = useStore();
  const [isMounted, setIsMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleSignOut = () => {
    logout();
    if (typeof window !== "undefined") {
      localStorage.removeItem("ks_admin_user");
      try {
        const savedUser = localStorage.getItem("ks_user");
        if (savedUser && JSON.parse(savedUser).role === "admin") {
          localStorage.removeItem("ks_user");
        }
      } catch {}
    }
    router.replace("/admin/login");
  };

  const links = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Categories", href: "/admin/categories", icon: Grid },
    { name: "Products", href: "/admin/products", icon: ShoppingBag },
    { name: "Inventory", href: "/admin/inventory", icon: ClipboardList },
    { name: "Order Listing", href: "/admin/orders", icon: ClipboardList },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Hero Banners", href: "/admin/banners", icon: ImageIcon },
    { name: "Coupons & Offers", href: "/admin/coupons", icon: Ticket },
    { name: "Tags, Sizes & Colors", href: "/admin/attributes", icon: Tag },
    { name: "Instagram Links", href: "/admin/instagram", icon: Instagram },
  ];

  const renderNavContent = () => (
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Brand Header */}
        <div className="p-5 sm:p-6 border-b border-ink-light bg-ink-light/40 sticky top-0 bg-ink z-10">
          <Link href="/admin/dashboard" className="flex items-center space-x-3">
            <div className="relative w-10 h-10 rounded-full border border-gold overflow-hidden flex-shrink-0 bg-ivory">
              <Image src="/icon.jpeg" alt="Kaavu Styles" fill className="object-cover" />
            </div>
            <div className="min-w-0">
              <span className="font-serif text-base sm:text-lg tracking-[0.14em] uppercase text-ivory block leading-tight truncate">
                Kaavu Styles
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-gold font-sans block mt-0.5 font-bold">
                Seller & Admin Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 sm:p-4 space-y-1 text-xs uppercase tracking-[0.15em] font-sans">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center space-x-3 px-3.5 py-2.5 sm:py-3 rounded transition-colors ${
                  isActive
                    ? "bg-crimson text-ivory font-semibold shadow-sm"
                    : "text-ivory/80 hover:bg-ink-light hover:text-gold"
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-gold" : "text-ivory/60"}`} />
                <span className="truncate">{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / User info */}
      <div className="p-4 border-t border-ink-light bg-ink-light/20 space-y-3 sticky bottom-0 bg-ink z-10">
        <div className="flex items-center space-x-2 text-xs text-gold">
          <Shield className="w-4 h-4 flex-shrink-0" />
          <span className="truncate text-[11px] font-sans">
            {isMounted && currentUser?.email ? currentUser.email : "admin@kaavustyle.com"}
          </span>
        </div>

        <Link
          href="/"
          target="_blank"
          className="flex items-center space-x-2 text-xs text-ivory/70 hover:text-ivory transition-colors pt-2 border-t border-ink-light"
        >
          <ArrowLeft className="w-4 h-4 text-gold flex-shrink-0" />
          <span>View Live Store</span>
        </Link>

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center space-x-2 text-xs text-crimson-100 hover:text-crimson transition-colors pt-1 cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-crimson flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. DESKTOP PERMANENT SIDEBAR */}
      <aside className="hidden lg:flex sticky top-0 h-screen w-64 flex-shrink-0 bg-ink text-ivory flex-col justify-between border-r border-gold/30 z-40 overflow-y-auto">
        {renderNavContent()}
      </aside>

      {/* 2. MOBILE HAMBURGER BUTTON (Fixed Top Left) */}
      <button
        type="button"
        aria-label="Open seller admin navigation"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed left-3 top-3.5 z-40 bg-ivory rounded-lg p-2.5 border border-ivory-300 shadow-md hover:bg-ivory-200 transition-colors"
      >
        <Menu className="w-5 h-5 text-ink" />
      </button>

      {/* 3. MOBILE SLIDE-OVER DRAWER */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden animate-fadeIn">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-ink/75 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer container */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-ink text-ivory shadow-2xl z-50 flex flex-col justify-between border-r-2 border-gold/50 animate-slideRight">
            {/* Close button */}
            <button
              type="button"
              aria-label="Close admin navigation"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 z-20 p-1.5 text-ivory/70 hover:text-ivory rounded-full bg-ink-light"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Navigation Body */}
            <div className="h-full overflow-y-auto">
              {renderNavContent()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
