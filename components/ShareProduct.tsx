"use client";
import { useState } from "react";
import { Share2 } from "lucide-react";
import type { Product } from "@/lib/mockData";
export default function ShareProduct({ product, compact = false }: { product: Product; compact?: boolean }) {
  const [message, setMessage] = useState("");
  async function share() {
    const url = new URL(`/product/${encodeURIComponent(product.id)}`, window.location.origin).href;
    try {
      if (navigator.share) await navigator.share({ title: product.name, text: `Discover ${product.name} at Kaavu Styless`, url });
      else { await navigator.clipboard.writeText(url); setMessage("Link copied"); }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setMessage(url);
    }
  }
  return <div className="space-y-1"><button type="button" aria-label={`Share ${product.name}`} onClick={event => { event.stopPropagation(); share(); }} className={compact ? "p-2 rounded-full bg-ivory/90 text-ink shadow-md" : "inline-flex items-center gap-2 px-3 py-2 border border-ivory-300 rounded-lg text-xs hover:border-gold"}><Share2 className="w-4 h-4" />{!compact && "Share product"}</button>{message && <p role="status" className={compact ? "absolute right-0 top-full bg-ivory p-2 text-xs break-all w-40 shadow-md" : "text-xs break-all text-ink-muted"}>{message}</p>}</div>;
}
