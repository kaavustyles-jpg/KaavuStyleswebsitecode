"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import {
  LayoutDashboard,
  ShoppingBag,
  Grid,
  ClipboardList,
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
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (mobileOpen) { dialog.current?.showModal(); const previous = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { dialog.current?.close(); document.body.style.overflow = previous; }; } }, [mobileOpen]);
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    { name: "Hero Banners", href: "/admin/banners", icon: ImageIcon },
    { name: "Coupons & Offers", href: "/admin/coupons", icon: Ticket },
    { name: "Tags, Sizes & Colors", href: "/admin/attributes", icon: Tag },
    { name: "Instagram Links", href: "/admin/instagram", icon: Instagram },
  ];

  const panel = (
    <aside className="hidden lg:flex sticky top-0 h-screen w-64 flex-shrink-0 bg-ink text-ivory flex-col justify-between border-r border-gold/30 z-40 overflow-y-auto">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-ink-light bg-ink-light/40 sticky top-0 bg-ink z-10">
          <Link href="/admin/dashboard" className="flex items-center space-x-3">
            <div className="relative w-10 h-10 rounded-full border border-gold overflow-hidden flex-shrink-0">
              <Image src="/icon.jpeg" alt="Icon" fill className="object-cover" />
            </div>
            <div>
              <span className="font-serif text-lg tracking-[0.16em] uppercase text-ivory block leading-tight">
                Kaavu Admin
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-gold font-sans block mt-0.5">
                Management Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 text-xs uppercase tracking-[0.15em] font-sans">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded transition-colors ${
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
          <span className="truncate">{isMounted && currentUser?.email ? currentUser.email : "Admin Mode Active"}</span>
        </div>

        <Link
          href="/"
          className="flex items-center space-x-2 text-xs text-ivory/70 hover:text-ivory transition-colors pt-2 border-t border-ink-light"
        >
          <ArrowLeft className="w-4 h-4 text-gold flex-shrink-0" />
          <span>View Live Storefront</span>
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
    </aside>
  );
  return <>{panel}<button type="button" aria-label="Open admin navigation" aria-haspopup="dialog" onClick={() => setMobileOpen(true)} className="lg:hidden fixed left-3 top-3 z-40 bg-ivory rounded-lg p-2.5 border border-ivory-300"><Menu className="w-5 h-5" /></button><dialog ref={dialog} aria-label="Admin navigation" onCancel={() => setMobileOpen(false)} onClose={() => setMobileOpen(false)} onClick={event => { if(event.target === event.currentTarget) setMobileOpen(false); }} className="admin-nav-dialog fixed inset-y-0 left-0 right-auto m-0 w-[min(85vw,320px)] h-dvh max-h-none p-0 bg-ink border-0 backdrop:bg-ink/60"><button type="button" aria-label="Close admin navigation" onClick={() => setMobileOpen(false)} className="absolute right-2 top-2 z-50 p-2 text-ivory"><X className="w-5 h-5" /></button>{panel}</dialog></>;
}
