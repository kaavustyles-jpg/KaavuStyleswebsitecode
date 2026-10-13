import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-ivory px-4 text-center space-y-6">
      <span className="text-xs uppercase tracking-[0.35em] text-gold font-semibold">
        404 — Page Not Found
      </span>
      <h1 className="font-serif text-4xl sm:text-6xl text-ink uppercase font-light">
        The Page You Seek <br />
        <em className="text-crimson font-normal">Does Not Exist</em>
      </h1>
      <p className="text-xs sm:text-sm text-ink-muted max-w-md font-sans">
        The link you followed may be broken or the page may have been removed. Explore our latest Luxury Collectionss or return to the main boutique.
      </p>
      <div className="pt-4 flex flex-col sm:flex-row gap-4">
        <Link
          href="/"
          className="px-8 py-3.5 bg-crimson hover:bg-crimson-800 text-ivory text-xs uppercase tracking-[0.24em] font-semibold transition-all shadow-md"
        >
          Return To Home
        </Link>
        <Link
          href="/shop"
          className="px-8 py-3.5 border border-gold hover:border-crimson text-ink hover:text-crimson text-xs uppercase tracking-[0.24em] font-semibold transition-all"
        >
          Browse Catalog
        </Link>
      </div>
    </div>
  );
}
