"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, ArrowLeft } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App Router Error Caught:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center bg-ivory text-ink space-y-6">
      <div className="space-y-2">
        <span className="text-xs uppercase tracking-[0.35em] text-gold font-semibold">
          Kaavu Styless
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl uppercase font-light">
          Something Went Wrong
        </h1>
        <p className="text-xs text-ink-muted max-w-md mx-auto leading-relaxed">
          An unexpected error occurred while loading this page. Please try refreshing or return to the main storefront.
        </p>
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-crimson text-ivory text-xs uppercase tracking-[0.2em] font-semibold flex items-center space-x-2 shadow-sm hover:bg-crimson-800 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Refreshing</span>
        </button>

        <Link
          href="/"
          className="px-6 py-3 border border-gold text-gold hover:bg-gold hover:text-ivory text-xs uppercase tracking-[0.2em] font-semibold transition-all flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go to Home</span>
        </Link>
      </div>
    </div>
  );
}
