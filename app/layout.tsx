import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import CartDrawer from "@/components/CartDrawer";
import ToastNotification from "@/components/ToastNotification";
import SiteEntrance from "@/components/SiteEntrance";

import MobileBottomNav from "@/components/MobileBottomNav";

export const metadata: Metadata = {
  title: "Kaavu Styles | For Every Version Of You",
  description:
    "Luxury clothing brand featuring royal  designer kurtis.",
  icons: {
    icon: "/icon.jpeg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Jost:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-ivory text-ink min-h-screen flex flex-col font-sans selection:bg-crimson selection:text-ivory">
        <StoreProvider>
          <SiteEntrance>
          <Navbar />
          <main className="flex-grow min-w-0 w-full pb-16 lg:pb-0">{children}</main>
          <Footer />
          <MobileBottomNav />
          <AuthModal />
          <CartDrawer />
          <ToastNotification />
          </SiteEntrance>
        </StoreProvider>
      </body>
    </html>
  );
}
