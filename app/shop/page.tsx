"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import ProductCard from "@/components/ProductCard";
import { Search, X, Sparkles, Filter, RefreshCw } from "lucide-react";

function ShopContent() {
  const searchParams = useSearchParams();
  const { products, categories, lifestyleTags } = useStore();

  const initialCat = searchParams.get("category") || "all";

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCat);
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"latest" | "price-low" | "price-high">("latest");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // TOGGLE: Set to true when you want to unhide the mobile filter button & drawer
  const SHOW_MOBILE_FILTER = false;

  // Category product count helper
  const getCategoryCount = (slug: string) => {
    if (slug === "all") return products.length;
    const catObj = categories.find((c) => c.slug === slug || c.id === slug);
    if (!catObj) return 0;
    return products.filter((p) => p.categoryId === catObj.id || p.category.toLowerCase() === catObj.name.toLowerCase()).length;
  };

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Search filter
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchName = product.name.toLowerCase().includes(q);
          const matchDesc = product.description.toLowerCase().includes(q);
          const matchCat = product.category.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchCat) return false;
        }

        // Category filter
        if (selectedCategory !== "all") {
          const catObj = categories.find((c) => c.slug === selectedCategory || c.id === selectedCategory);
          if (catObj && product.categoryId !== catObj.id && product.category.toLowerCase() !== catObj.name.toLowerCase()) {
            return false;
          }
        }

        // Lifestyle tag filter
        if (selectedTag !== "all") {
          if (!product.lifestyleTags.some((t) => t.toLowerCase() === selectedTag.toLowerCase())) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-low") return a.price - b.price;
        if (sortBy === "price-high") return b.price - a.price;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [products, categories, searchQuery, selectedCategory, selectedTag, sortBy]);

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedTag("all");
    setSearchQuery("");
    setSortBy("latest");
  };

  const hasActiveFilters = selectedCategory !== "all" || selectedTag !== "all" || searchQuery !== "" || sortBy !== "latest";

  return (
    <div className="w-full px-2 sm:px-4 lg:px-6 py-6 space-y-8">
      {/* 1. HERO BOUTIQUE HEADER (#2B0B14 BURGUNDY BACKGROUND) */}
      <div className="relative bg-[#2B0B14] border-y-2 border-gold/40 p-8 sm:p-14 text-center space-y-4 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#E5C378_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
          <div className="flex items-center justify-center space-x-2 text-[#E5C378]">
            <Sparkles className="w-4 h-4 text-[#E5C378]" />
            <span className="text-xs uppercase tracking-[0.4em] font-bold">
              The Kaavu Atelier
            </span>
            <Sparkles className="w-4 h-4 text-[#E5C378]" />
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl uppercase font-light text-white tracking-tight">
            Our Complete <span className="text-[#E5C378] italic font-normal">Collection</span>
          </h1>

          <div className="w-24 h-0.5 bg-gold mx-auto my-3" />

          <p className="text-xs sm:text-sm text-ivory-300 max-w-xl mx-auto font-sans leading-relaxed">
Discover versatile co-ord sets, chic western wear, elegant kurtis, and stylish salwar suits designed for every side of you.

 From polished office looks and comfortable daily wear to casual outings and coffee dates, Whatever the mood, wherever the moment, find your style with Kaavu Styles.          </p>
        </div>
      </div>

      {/* 2. CATEGORY PILL CAROUSEL WITH PRODUCT COUNTS (DESKTOP ONLY - MOBILE USES FLOATING FILTER BUTTON) */}
      <div className="hidden lg:block space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] uppercase tracking-[0.25em] text-gold font-semibold flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-gold" />
            <span>Select Category</span>
          </span>
          <span className="text-[11px] text-ink-muted uppercase tracking-wider">
            {categories.length} Collections
          </span>
        </div>

        <div className="flex items-center space-x-3 overflow-x-auto scrollbar-none pb-2 pt-1 text-xs">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-5 py-2.5 border transition-all whitespace-nowrap flex items-center space-x-2 ${
              selectedCategory === "all"
                ? "bg-crimson text-ivory border-crimson font-semibold shadow-md"
                : "bg-ivory border-ivory-300 text-ink hover:border-gold hover:bg-ivory-200"
            }`}
          >
            <span>All Categories</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedCategory === "all" ? "bg-ivory/20 text-ivory" : "bg-ivory-300 text-ink-muted"}`}>
              {products.length}
            </span>
          </button>

          {categories.map((cat) => {
            const count = getCategoryCount(cat.slug);
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-5 py-2.5 border transition-all whitespace-nowrap flex items-center space-x-2 ${
                  isSelected
                    ? "bg-crimson text-ivory border-crimson font-semibold shadow-md"
                    : "bg-ivory border-ivory-300 text-ink hover:border-gold hover:bg-ivory-200"
                }`}
              >
                <span>{cat.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${isSelected ? "bg-ivory/20 text-ivory" : "bg-ivory-300 text-ink-muted"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. TOOLBAR: SEARCH, LIFESTYLE TAGS & SORTING (DESKTOP ONLY) */}
      <div className="hidden lg:block bg-ivory-50 border border-ivory-300 p-5 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-lg border border-ivory-300 bg-ivory p-2.5 flex items-center focus-within:border-gold shadow-inner transition-colors">
            <Search className="w-4 h-4 text-gold mr-2.5 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search silk sarees, kurtis, lehenga, fusion wear..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-ink outline-none font-sans placeholder:text-ink-muted"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-ink-muted hover:text-crimson p-1">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Selector & Reset */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] uppercase tracking-wider text-gold font-semibold whitespace-nowrap">
                Sort By:
              </span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-ivory border border-ivory-300 px-4 py-2.5 text-xs text-ink outline-none uppercase tracking-wider focus:border-gold shadow-sm cursor-pointer"
              >
                <option value="latest">Latest Arrivals</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2.5 border border-crimson text-crimson hover:bg-crimson hover:text-ivory text-xs uppercase tracking-wider transition-all font-semibold flex items-center space-x-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Lifestyle Tag Filter Pills */}
        <div className="pt-3 border-t border-ivory-300 flex items-center space-x-2 overflow-x-auto scrollbar-none text-xs">
          <span className="text-[10px] uppercase tracking-[0.2em] text-gold font-semibold mr-1 flex-shrink-0">
            Lifestyle Tag:
          </span>

          <button
            onClick={() => setSelectedTag("all")}
            className={`px-3 py-1 text-[10px] uppercase tracking-wider transition-all whitespace-nowrap ${
              selectedTag === "all"
                ? "bg-gold text-ivory font-bold"
                : "bg-ivory-200 text-ink hover:bg-ivory-300"
            }`}
          >
            All Aesthetics
          </button>
          {lifestyleTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setSelectedTag(tag.name)}
              className={`px-3 py-1 text-[10px] uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedTag.toLowerCase() === tag.name.toLowerCase()
                  ? "bg-gold text-ivory font-bold"
                  : "bg-ivory-200 text-ink hover:bg-ivory-300"
              }`}
            >
              #{tag.name}
            </button>
          ))}
        </div>
      </div>

      {/* 4. RESULTS INFO BAR */}
      <div className="flex items-center justify-between border-b border-ivory-300 pb-3 text-xs uppercase tracking-wider text-ink-muted px-1">
        <span>
          Displaying <strong className="text-crimson font-semibold">{filteredProducts.length}</strong> {filteredProducts.length === 1 ? "Creation" : "Creations"}
        </span>
        {hasActiveFilters && (
          <span className="text-gold font-medium">Filtered View Active</span>
        )}
      </div>

      {/* 5. FULL-WIDTH PRODUCT GRID */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-ivory-50 border border-ivory-300 p-8 space-y-4 max-w-xl mx-auto shadow-sm">
          <p className="font-serif text-2xl text-ink uppercase">No Creations Found</p>
          <p className="text-xs text-ink-muted max-w-md mx-auto">
            We couldn't find any products matching your selected category or search filters.
          </p>
          <button
            onClick={clearFilters}
            className="px-8 py-3 bg-crimson hover:bg-crimson-800 text-ivory text-xs uppercase tracking-widest font-semibold transition-colors shadow-md"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4 sm:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* =========================================================================
          MOBILE FILTER (TEMPORARILY HIDDEN - SET SHOW_MOBILE_FILTER = true TO UNHIDE)
          ========================================================================= */}
      {SHOW_MOBILE_FILTER && (
        <>
          {/* FIXED MOBILE FILTER BUTTON (FLOATING BOTTOM CENTER) */}
          <div className="fixed bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 z-30 lg:hidden">
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="px-6 py-3 bg-[#2B0B14] text-[#E5C378] border-2 border-gold/60 rounded-full shadow-2xl flex items-center space-x-2 text-xs uppercase tracking-[0.2em] font-bold backdrop-blur-md cursor-pointer hover:scale-105 transition-transform"
            >
              <Filter className="w-4 h-4 text-[#E5C378]" />
              <span>Refine & Filter ({filteredProducts.length})</span>
              {hasActiveFilters && (
                <span className="w-2.5 h-2.5 rounded-full bg-crimson border border-gold" />
              )}
            </button>
          </div>

          {/* MOBILE FILTER SLIDE-UP SHEET */}
          {isMobileFilterOpen && (
            <div className="fixed inset-0 z-50 bg-ink/75 backdrop-blur-sm flex flex-col justify-end lg:hidden animate-fadeIn">
              <div className="bg-ivory border-t-2 border-gold rounded-t-2xl max-h-[85vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-ivory-300 pb-4">
                  <div className="flex items-center space-x-2 text-[#2B0B14]">
                    <Filter className="w-5 h-5 text-crimson" />
                    <h3 className="font-serif text-xl uppercase font-bold text-ink">Filter & Sort Ensembles</h3>
                  </div>
                  <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="p-1 text-ink-muted hover:text-crimson transition-colors cursor-pointer"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Search */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold">Search Keywords</label>
                  <div className="flex items-center border border-ivory-300 bg-ivory-50 p-3">
                    <Search className="w-4 h-4 text-gold mr-2 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Silk sarees, kurtis, lehengas..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent text-xs text-ink outline-none"
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold">Category</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => setSelectedCategory("all")}
                      className={`p-2.5 border text-center font-semibold text-xs cursor-pointer ${
                        selectedCategory === "all" ? "bg-crimson text-ivory border-crimson" : "bg-ivory border-ivory-300 text-ink"
                      }`}
                    >
                      All ({products.length})
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.slug)}
                        className={`p-2.5 border text-center font-semibold text-xs truncate cursor-pointer ${
                          selectedCategory === cat.slug ? "bg-crimson text-ivory border-crimson" : "bg-ivory border-ivory-300 text-ink"
                        }`}
                      >
                        {cat.name} ({getCategoryCount(cat.slug)})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="w-full bg-ivory border border-ivory-300 p-3 text-xs text-ink uppercase tracking-wider outline-none cursor-pointer"
                  >
                    <option value="latest">Latest Arrivals</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>

                {/* Lifestyle Tags */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold">Lifestyle Aesthetic</label>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      onClick={() => setSelectedTag("all")}
                      className={`px-3 py-1.5 border text-[10px] uppercase cursor-pointer ${
                        selectedTag === "all" ? "bg-gold text-ivory font-bold" : "bg-ivory-200 text-ink"
                      }`}
                    >
                      All Aesthetics
                    </button>
                    {lifestyleTags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => setSelectedTag(tag.name)}
                        className={`px-3 py-1.5 border text-[10px] uppercase cursor-pointer ${
                          selectedTag.toLowerCase() === tag.name.toLowerCase() ? "bg-gold text-ivory font-bold" : "bg-ivory-200 text-ink"
                        }`}
                      >
                        #{tag.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-ivory-300 flex items-center space-x-3">
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="py-3 px-4 border border-crimson text-crimson text-xs uppercase font-bold tracking-wider cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                  <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="flex-1 py-3.5 bg-crimson text-ivory text-xs uppercase font-bold tracking-[0.2em] shadow-md cursor-pointer"
                  >
                    Apply Filters ({filteredProducts.length})
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center text-xs uppercase text-gold tracking-widest font-semibold">Loading Catalog...</div>}>
      <ShopContent />
    </Suspense>
  );
}
