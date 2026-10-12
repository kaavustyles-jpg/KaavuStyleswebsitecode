"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { useStore } from "@/context/StoreContext";
import { ShoppingBag, Heart, X, ChevronRight, Check, Sparkles } from "lucide-react";

export default function ToastNotification() {
  const { toastMessage, hideToast } = useStore();

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      hideToast();
    }, 3500);
    return () => clearTimeout(timer);
  }, [toastMessage, hideToast]);

  if (!toastMessage) return null;

  const isCart = toastMessage.type === "cart";
  const isWishlist = toastMessage.type === "wishlist";

  return (
    <div className="fixed top-4 right-4 sm:top-16 sm:right-6 z-[100] max-w-[280px] sm:max-w-xs animate-fadeIn transition-all duration-300">
      <div className="bg-[#2B0B14] border border-gold/70 text-ivory p-2.5 px-3 rounded-md shadow-2xl relative overflow-hidden flex items-center space-x-2.5 border-l-4 border-l-gold">
        {/* Progress Bar Timer */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold/20 overflow-hidden">
          <div className="h-full bg-gold animate-marquee" style={{ animationDuration: "3.5s" }} />
        </div>

        {/* Thumbnail Image */}
        {toastMessage.imageUrl ? (
          <div className="relative w-8 h-10 bg-ink rounded overflow-hidden border border-gold/40 flex-shrink-0 shadow-sm">
            <Image
              src={toastMessage.imageUrl}
              alt={toastMessage.title}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full border border-gold bg-crimson flex items-center justify-center text-gold flex-shrink-0 shadow-sm">
            {isCart && <ShoppingBag className="w-3.5 h-3.5 text-gold" />}
            {isWishlist && <Heart className="w-3.5 h-3.5 text-gold fill-current" />}
            {!isCart && !isWishlist && <Check className="w-3.5 h-3.5 text-gold" />}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 pr-4 space-y-0.5">
          <div className="flex items-center space-x-1">
            {isCart && <ShoppingBag className="w-3 h-3 text-gold flex-shrink-0" />}
            {isWishlist && <Heart className="w-3 h-3 text-gold fill-current flex-shrink-0" />}
            <h4 className="font-serif text-xs uppercase tracking-wider text-[#E5C378] font-medium truncate">
              {toastMessage.title}
            </h4>
          </div>
          <p className="text-[11px] text-ivory-200 font-sans truncate leading-tight">
            {toastMessage.message}
          </p>

          {/* Action Link */}
          {toastMessage.actionText && (
            <button
              onClick={() => {
                if (toastMessage.onAction) toastMessage.onAction();
                hideToast();
              }}
              className="inline-flex items-center space-x-0.5 text-[10px] uppercase tracking-wider text-gold font-bold hover:text-white pt-0.5 transition-colors cursor-pointer"
            >
              <span>{toastMessage.actionText}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={hideToast}
          className="absolute top-1.5 right-1.5 p-0.5 text-ivory-300 hover:text-white transition-colors cursor-pointer"
          title="Close Notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
