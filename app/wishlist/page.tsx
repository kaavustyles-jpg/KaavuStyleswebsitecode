"use client";

import React from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import ProductCard from "@/components/ProductCard";
import { Heart, ArrowRight, Trash2 } from "lucide-react";

export default function WishlistPage() {
  const { products, wishlist, clearWishlist } = useStore();

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="w-full space-y-10 pb-12">
      {/* FULL-WIDTH PAGE HEADER (#2B0B14 BURGUNDY BACKGROUND - NO SIDE MARGINS) */}
      <div className="relative w-full bg-[#2B0B14] border-y-2 border-gold/40 p-8 sm:p-14 text-center space-y-3 shadow-2xl overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-center space-x-2 text-[#E5C378] mb-1">
            <Heart className="w-5 h-5 fill-[#E5C378] text-[#E5C378]" />
            <span className="text-xs uppercase tracking-[0.35em] text-[#E5C378] font-bold">
              Saved Favorites
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl text-white uppercase font-light">
            My Wishlist
          </h1>
          <p className="text-xs sm:text-sm text-ivory-300 max-w-md mx-auto">
            Your personal curation of handpicked sarees, kurtis, and artisanal luxury wear.
          </p>

          {wishlistedProducts.length > 0 && (
            <div className="pt-4 flex items-center justify-center space-x-6 border-t border-gold/30 max-w-xs mx-auto">
              <span className="text-xs uppercase tracking-widest text-[#E5C378] font-semibold">
                {wishlistedProducts.length} {wishlistedProducts.length === 1 ? "Item" : "Items"} Saved
              </span>
              <button
                onClick={clearWishlist}
                className="text-xs uppercase tracking-widest text-white hover:text-[#E5C378] transition-colors flex items-center space-x-1 font-semibold cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(#E5C378_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none" />
      </div>

      {/* Wishlist Items Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {wishlistedProducts.length === 0 ? (
        <div className="text-center py-20 bg-ivory-50 border border-ivory-300 p-8 space-y-6 max-w-2xl mx-auto shadow-sm">
          <div className="w-16 h-16 bg-ivory-200 rounded-full flex items-center justify-center mx-auto text-gold border border-gold/40">
            <Heart className="w-8 h-8 text-gold" />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-2xl uppercase text-ink">Your Wishlist is Empty</h2>
            <p className="text-xs sm:text-sm text-ink-muted max-w-md mx-auto">
              Save items you love by tapping the heart icon on any product to easily revisit them later.
            </p>
          </div>
          <div>
            <Link
              href="/shop"
              className="inline-flex items-center space-x-2 px-8 py-3.5 bg-crimson hover:bg-crimson-800 text-ivory text-xs uppercase tracking-[0.24em] font-semibold transition-all shadow-luxury"
            >
              <span>Explore Collections</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlistedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
