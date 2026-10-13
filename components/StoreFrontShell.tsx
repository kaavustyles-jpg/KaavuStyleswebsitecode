"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import AuthModal from "@/components/AuthModal";
import CartDrawer from "@/components/CartDrawer";
import ToastNotification from "@/components/ToastNotification";
import SiteEntrance from "@/components/SiteEntrance";

export default function StoreFrontShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname.startsWith("/admin");
    }
    return pathname ? pathname.startsWith("/admin") : false;
  });

  useEffect(() => {
    const current = pathname || (typeof window !== "undefined" ? window.location.pathname : "");
    setIsAdmin(current.startsWith("/admin"));
  }, [pathname]);

  // When on ANY Admin route (/admin, /admin/login, /admin/dashboard, etc.),
  // NEVER render the storefront header (Navbar), footer, mobile bottom nav or site entrance.
  if (isAdmin || pathname?.startsWith("/admin")) {
    return (
      <>
        <main className="flex-grow min-w-0 w-full">{children}</main>
        <ToastNotification />
      </>
    );
  }

  return (
    <SiteEntrance>
      <Navbar />
      <main className="flex-grow min-w-0 w-full pb-16 lg:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav />
      <AuthModal />
      <CartDrawer />
      <ToastNotification />
    </SiteEntrance>
  );
}
