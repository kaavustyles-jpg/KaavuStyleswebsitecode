"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";

export default function AdminResponsive({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser } = useStore();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isLoginPage) {
      setAuthorized(true);
      return;
    }

    const savedAdmin = localStorage.getItem("ks_admin_user");
    const savedUser = localStorage.getItem("ks_user");
    let hasAdmin = false;

    try {
      if (savedAdmin) {
        const u = JSON.parse(savedAdmin);
        if (u.role === "admin") hasAdmin = true;
      } else if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u.role === "admin") hasAdmin = true;
      }
    } catch {
      hasAdmin = false;
    }

    if (currentUser?.role === "admin") {
      hasAdmin = true;
    }

    if (!hasAdmin) {
      setAuthorized(false);
      router.replace("/admin/login");
    } else {
      setAuthorized(true);
    }
  }, [pathname, isLoginPage, currentUser, router]);

  if (!isLoginPage && authorized === false) {
    return null;
  }

  return <div className="admin-responsive min-w-0 w-full">{children}</div>;
}
