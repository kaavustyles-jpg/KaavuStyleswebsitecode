"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";
import ImageUploader from "@/components/ImageUploader";
import { useStore } from "@/context/StoreContext";
import type { Product } from "@/lib/mockData";
export default function ProductEditor({ productId }: { productId?: string }) {
 const { products, categories, addProduct, updateProduct, lifestyleTags, sizes, colors, isLoading } = useStore();
 const router = useRouter();
 const [editingId, setEditingId] = useState<string | null>(productId || null);
 const [saving, setSaving] = useState(false);
 const initialized = useRef(false);
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [category, setCategory] = useState(categories[0]?.name || "Royal Sarees");
  
  const [generalStock, setGeneralStock] = useState(0);
  const [sizeStock, setSizeStock] = useState<Record<string, number>>({});
  const [colorImages, setColorImages] = useState<Record<string, string[]>>({});
  const [saveError, setSaveError] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>(["S", "M", "L"]);
  const [selectedColors, setSelectedColors] = useState<string[]>(["Crimson Maroon", "Antique Gold"]);
  const [selectedTags, setSelectedTags] = useState<string[]>(["Festive", "Ethnic"]);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [isLatest, setIsLatest] = useState(true);
  const [isFeatured, setIsFeatured] = useState(true);


  const openEditModal = (p: Product) => {
    setEditingId(p.id);
    setName(p.name);
    setDescription(p.description);
    setPrice(p.price.toString());
    setOriginalPrice(p.originalPrice ? p.originalPrice.toString() : "");
    setCategory(p.category);
    setGeneralStock(p.stock);

    setSizeStock(p.sizeStock || {}); setColorImages(p.colorImages || {}); setSaveError("");
    setSelectedSizes(p.sizes);
    setSelectedColors(p.colors);
    setSelectedTags(p.lifestyleTags);
    setProductImages(p.images);
    setIsLatest(p.isLatest);
    setIsFeatured(p.isFeatured);

  };

  const ensureStorageUrls = async (urls: string[]): Promise<string[]> => {
    const hasDataUrl = urls.some((u) => typeof u === "string" && u.startsWith("data:image/"));
    if (!hasDataUrl) return urls;

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: urls, folder: "products", name: "product" }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.urls)) {
        return data.urls;
      }
    } catch (e) {
      console.warn("Storage upload fallback in ProductEditor:", e);
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);

    const catObj = categories.find((c) => c.name === category);
    if (!catObj) { setSaveError("Please select a category."); setSaving(false); return; }

    const finalImages = await ensureStorageUrls(productImages);
    const finalColorImages: Record<string, string[]> = {};
    for (const col of selectedColors) {
      finalColorImages[col] = await ensureStorageUrls(colorImages[col] || []);
    }

    const productPayload = {
      name,
      description,
      price: parseFloat(price) || 0,
      originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
      category,
      categoryId: catObj.id,
      stock: selectedSizes.length ? selectedSizes.reduce((sum, size) => sum + (sizeStock[size] ?? 0), 0) : generalStock,
      sizeStock: selectedSizes.length ? Object.fromEntries(selectedSizes.map(size => [size, sizeStock[size] ?? 0])) : {},
      colorImages: finalColorImages,
      sizes: selectedSizes,
      colors: selectedColors,
      lifestyleTags: selectedTags,
      images: finalImages.length > 0 ? finalImages : ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800"],
      isLatest,
      isFeatured,
    };

    setSaveError("");
    try {
    if (editingId) {
      await updateProduct(editingId, productPayload);
    } else {
      await addProduct(productPayload);
    }

    router.push("/admin/products");
    } catch (error) { setSaveError(error instanceof Error ? error.message : "Could not save product."); } finally { setSaving(false); }
  };

  const toggleSize = (s: string) => {
    setSelectedSizes((prev) =>
      prev.includes(s) ? prev.filter((item) => item !== s) : [...prev, s]
    );
  };

  const toggleColor = (c: string) => {
    setSelectedColors((prev) =>
      prev.includes(c) ? prev.filter((item) => item !== c) : [...prev, c]
    );
  };

  const toggleTag = (t: string) => {
    setSelectedTags((prev) =>
      prev.includes(t) ? prev.filter((item) => item !== t) : [...prev, t]
    );
  };

 useEffect(() => {
   if (isLoading || initialized.current) return;
   if (!productId) {
     if (categories[0]) setCategory(categories[0].name);
     initialized.current = true;
     return;
   }
   const product = products.find(value => value.id === productId);
   if (product) { openEditModal(product); initialized.current = true; }
 }, [productId, isLoading, products, categories]);
 return <div className="flex min-h-screen bg-ivory-100"><AdminSidebar /><div className="flex-1 min-w-0"><AdminHeader title={productId ? "Edit product" : "Add new product"} /><main className="max-w-6xl mx-auto p-5 sm:p-8 space-y-6"><Link href="/admin/products" className="text-sm text-crimson">← Back to products</Link><div><h1 className="font-serif text-3xl">{productId ? "Refine your product" : "Create a new product"}</h1><p className="text-sm text-ink-muted mt-2">Add details, allocate stock by size, and upload photos for each color.</p></div>{isLoading ? <p>Loading product editor…</p> : productId && !products.some(value => value.id === productId) ? <p>Product not found.</p> :             <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-2 gap-6 text-sm">
<section className="bg-white border border-ivory-300 rounded-xl p-6 sm:p-8 space-y-5"><h2 className="font-serif text-2xl">Product details</h2>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-ink-muted mb-1">
                  Product Name / Title
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kanjeevaram Crimson Silk Saree"
                  className="w-full border border-ivory-300 rounded p-2.5 text-xs text-ink outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-ink-muted mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Crafting details, weave type, silk purity..."
                  className="w-full border border-ivory-300 rounded p-2.5 text-xs text-ink outline-none focus:border-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-ink-muted mb-1">
                    Price (INR ₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full border border-ivory-300 rounded p-2.5 text-xs text-ink outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-ink-muted mb-1">
                    Original Price (MRP)
                  </label>
                  <input
                    type="number"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    className="w-full border border-ivory-300 rounded p-2.5 text-xs text-ink outline-none"
                  />
                </div>

              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-ink-muted mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-ivory-300 rounded p-2.5 text-xs text-ink outline-none uppercase"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              </section><section className="bg-white border border-ivory-300 rounded-xl p-6 sm:p-8 space-y-5"><h2 className="font-serif text-2xl">Sizes & inventory</h2>
              {/* Sizes Selection */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-ink-muted mb-1">
                  Available Sizes
                </label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((sz) => (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => toggleSize(sz.code)}
                      className={`px-3 py-1 text-xs border rounded ${
                        selectedSizes.includes(sz.code)
                          ? "bg-crimson text-ivory border-crimson font-semibold"
                          : "bg-ivory border-ivory-300 text-ink"
                      }`}
                    >
                      {sz.code}
                    </button>
                  ))}
                </div>
              </div>

              {selectedSizes.length === 0 && <label className="block rounded-lg border border-gold/30 bg-ivory-50 p-4 text-sm"><span className="font-medium">Stock quantity</span><p className="text-xs text-ink-muted mt-1 mb-3">No size selected. Enter the total units available.</p><input aria-label="General stock quantity" type="number" min="0" step="1" required value={generalStock} onChange={event => setGeneralStock(Math.max(0, Number(event.target.value)))} className="w-full rounded-md border border-ivory-300 bg-white p-3" /></label>}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{selectedSizes.map(size => <label key={size} className="text-xs">Stock for {size}<input type="number" min="0" step="1" required value={sizeStock[size] ?? 0} onChange={event => setSizeStock(prev => ({...prev, [size]: Math.max(0, Number(event.target.value))}))} className="mt-1 w-full border border-ivory-300 p-2" /></label>)}</div>
              <p className="text-xs text-ink-muted">Select sizes to manage individual quantities, or leave all sizes unselected to use general stock.</p>
              {editingId && <p className="text-xs break-all">Product ID: {editingId}</p>}
              {/* Lifestyle Tags Selection */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-ink-muted mb-1">
                  Lifestyle Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {lifestyleTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.name)}
                      className={`px-3 py-1 text-xs border rounded ${
                        selectedTags.includes(tag.name)
                          ? "bg-gold text-ivory border-gold font-semibold"
                          : "bg-ivory border-ivory-300 text-ink"
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>

              </section><section className="xl:col-span-2 bg-white border border-ivory-300 rounded-xl p-6 sm:p-8 space-y-5"><h2 className="font-serif text-2xl">Colors & photography</h2>
              {/* Colors Selection */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-ink-muted mb-1">
                  Available Colors
                </label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((col) => (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => toggleColor(col.name)}
                      className={`px-3 py-1 text-xs border rounded ${
                        selectedColors.includes(col.name)
                          ? "bg-ink text-ivory border-ink font-semibold"
                          : "bg-ivory border-ivory-300 text-ink"
                      }`}
                    >
                      {col.name}
                    </button>
                  ))}
                </div>
              </div>

              {selectedColors.map(color => <ImageUploader key={color} images={colorImages[color] || []} onChange={images => setColorImages(prev => ({...prev, [color]: images}))} label={`Photos for ${color}`} folder="products" />)}
              {saveError && <p role="alert" className="text-crimson">{saveError}</p>}
              {/* IMAGE FILE UPLOADER (Uploads directly to Supabase Storage images bucket) */}
              <ImageUploader
                images={productImages}
                onChange={setProductImages}
                label="Product Images (Select Image Files from Device)"
                folder="products"
              />

              <div className="flex items-center space-x-6 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isLatest}
                    onChange={(e) => setIsLatest(e.target.checked)}
                    className="accent-crimson"
                  />
                  <span>Mark as New Arrival</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="accent-crimson"
                  />
                  <span>Feature on Home Page</span>
                </label>
              </div>

              <button
                type="submit" disabled={saving}
                className="w-full py-3.5 bg-crimson text-ivory text-xs uppercase tracking-[0.24em] font-semibold shadow-md mt-4 hover:bg-crimson-800 transition-all"
              >
                {saving ? "Saving…" : editingId ? "Save changes" : "Create product"}
              </button>
</section>            </form>}</main></div></div>;
}
