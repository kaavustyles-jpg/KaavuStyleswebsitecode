"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Product,
  Category,
  Banner,
  Order,
  LifestyleTag,
  SizeOption,
  ColorOption,
  InstagramPost,
  User,
  Coupon,
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_BANNERS,
  INITIAL_ORDERS,
  INITIAL_LIFESTYLE_TAGS,
  INITIAL_SIZES,
  INITIAL_COLORS,
  INITIAL_INSTAGRAM_POSTS,
  INITIAL_COUPONS,
} from "@/lib/mockData";
import { stockForSize, reduceInventory } from "@/lib/inventory";
import { getClientIp } from "@/lib/utils";
import {
  supabase,
  isSupabaseConfigured,
  mapDbProductToProduct,
  mapProductToDbRow,
  mapDbCategoryToCategory,
  mapDbBannerToBanner,
  mapDbOrderToOrder,
  mapDbTagToTag,
  mapDbSizeToSize,
  mapDbColorToColor,
  mapDbIgToIg,
} from "@/lib/supabase";

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

export interface ToastMessage {
  id: string;
  type: "cart" | "wishlist" | "info" | "success";
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  imageUrl?: string;
}

interface StoreContextType {
  products: Product[];
  categories: Category[];
  banners: Banner[];
  orders: Order[];
  lifestyleTags: LifestyleTag[];
  sizes: SizeOption[];
  colors: ColorOption[];
  instagramPosts: InstagramPost[];
  coupons: Coupon[];
  appliedCoupon: Coupon | null;
  cart: CartItem[];
  wishlist: string[];
  currentUser: User | null;
  isAuthModalOpen: boolean;
  isCartDrawerOpen: boolean;
  ipAddress: string;
  isLoading: boolean;
  isBannerLoading: boolean;
  toastMessage: ToastMessage | null;
  showToast: (toast: Omit<ToastMessage, "id">) => void;
  hideToast: () => void;

  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  getDiscountAmount: () => number;

  openAuthModal: () => void;
  closeAuthModal: () => void;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  login: (email: string, role?: "admin" | "customer", userName?: string) => boolean;
  logout: () => void;

  addToCart: (product: Product, size?: string, color?: string, qty?: number) => void;
  removeFromCart: (productId: string, size: string, color: string) => void;
  updateCartQty: (productId: string, size: string, color: string, qty: number) => void;
  clearCart: () => void;
  acceptPaidOrder: (order: Order) => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;

  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;

  // Admin Actions
  addProduct: (product: Omit<Product, "id" | "createdAt">) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  addCategory: (category: Omit<Category, "id">) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  addBanner: (banner: Omit<Banner, "id">) => Promise<void>;
  updateBanner: (id: string, banner: Partial<Banner>) => Promise<void>;
  deleteBanner: (id: string) => Promise<void>;

  addOrder: (orderData: Omit<Order, "id" | "orderNumber" | "createdAt">) => Promise<Order>;
  updateOrderStatus: (id: string, status: Order["status"]) => Promise<void>;

  addTag: (name: string) => Promise<void>;
  updateTag: (id: string, name: string) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;

  addSize: (name: string, code: string) => Promise<void>;
  updateSize: (id: string, name: string, code: string) => Promise<void>;
  deleteSize: (id: string) => Promise<void>;

  addColor: (name: string, hex: string) => Promise<void>;
  updateColor: (id: string, name: string, hex: string) => Promise<void>;
  deleteColor: (id: string) => Promise<void>;

  addInstagramPost: (postUrl: string, imageUrl: string, caption: string) => Promise<void>;
  deleteInstagramPost: (id: string) => Promise<void>;

  addCoupon: (coupon: Omit<Coupon, "id" | "timesUsed">) => Promise<void>;
  updateCoupon: (id: string, coupon: Partial<Coupon>) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [banners, setBanners] = useState<Banner[]>(INITIAL_BANNERS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [lifestyleTags, setLifestyleTags] = useState<LifestyleTag[]>(INITIAL_LIFESTYLE_TAGS);
  const [sizes, setSizes] = useState<SizeOption[]>(INITIAL_SIZES);
  const [colors, setColors] = useState<ColorOption[]>(INITIAL_COLORS);
  const [instagramPosts, setInstagramPosts] = useState<InstagramPost[]>(INITIAL_INSTAGRAM_POSTS);
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("ks_coupons");
        if (saved !== null) {
          return JSON.parse(saved);
        }
      } catch (e) {
        console.warn("Could not parse ks_coupons from localStorage:", e);
      }
    }
    return INITIAL_COUPONS;
  });
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedCart = localStorage.getItem("ks_cart");
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          if (Array.isArray(parsedCart) && parsedCart.length > 0) {
            return parsedCart
              .map((item: any) => {
                const prodId = item.productId || item.product?.id;
                const fullProduct =
                  INITIAL_PRODUCTS.find((p) => p.id === prodId) || item.product;
                if (!fullProduct || !fullProduct.id) return null;
                return {
                  product: fullProduct,
                  quantity: item.quantity || 1,
                  selectedSize: item.selectedSize || "Standard",
                  selectedColor: item.selectedColor || "Standard",
                };
              })
              .filter(Boolean) as CartItem[];
          }
        }
      } catch (err) {
        console.warn("Could not load initial cart from localStorage:", err);
      }
    }
    return [];
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedWishlist = localStorage.getItem("ks_wishlist");
        if (savedWishlist) {
          const parsed = JSON.parse(savedWishlist);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (err) {
        console.warn("Could not load initial wishlist from localStorage:", err);
      }
    }
    return [];
  });

  const [customerUser, setCustomerUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedUser = localStorage.getItem("ks_user");
        if (savedUser) { const user = JSON.parse(savedUser); return user.role === "customer" ? user : null; }
      } catch (e) {
        console.warn("Could not load ks_user from localStorage:", e);
      }
    }
    return null;
  });
  const [adminUser, setAdminUser] = useState<User | null>(() => {
    try {
      if (typeof window === "undefined") return null;
      const saved = localStorage.getItem("ks_admin_user") || localStorage.getItem("ks_user");
      if (!saved) return null;
      const user = JSON.parse(saved);
      return user.role === "admin" ? user : null;
    } catch { return null; }
  });
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;
  const currentUser = isAdminRoute ? adminUser : customerUser;

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [ipAddress, setIpAddress] = useState("127.0.0.1");
  const [isLoading, setIsLoading] = useState(true);
  const [isBannerLoading, setIsBannerLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);

  const showToast = (toastData: Omit<ToastMessage, "id">) => {
    const id = "toast-" + Date.now();
    setToastMessage({ id, ...toastData });
  };

  const hideToast = () => setToastMessage(null);

  // Load from Supabase Database (or fallback to LocalStorage/Seed)
  useEffect(() => {
    if (typeof window === "undefined") return;
    setIpAddress(getClientIp());

    let cancelled = false;
    async function loadBanners() {
      try {
        if (isSupabaseConfigured) {
          const { data, error } = await supabase.from("banners").select("*").order("order_num", { ascending: true });
          if (!cancelled && !error && data) setBanners(data.map(mapDbBannerToBanner));
        } else {
          const saved = localStorage.getItem("ks_banners");
          if (!cancelled && saved) setBanners(JSON.parse(saved));
        }
      } catch (error) {
        console.error("Error loading banners:", error);
      } finally {
        if (!cancelled) setIsBannerLoading(false);
      }
    }
    loadBanners();

    async function loadDataFromSupabase() {
      setIsLoading(true);
      try {
        if (isSupabaseConfigured) {
          // Fetch all store collections concurrently in parallel
          const [
            { data: pData, error: pErr },
            { data: cData, error: cErr },
            { data: oData, error: oErr },
            { data: tData },
            { data: sData },
            { data: colData },
            { data: igData },
          ] = await Promise.all([
            supabase.from("products").select("*").order("created_at", { ascending: false }).then(result => {
              if (!cancelled && !result.error && result.data) setProducts(result.data.map(mapDbProductToProduct));
              return result;
            }),
            supabase.from("categories").select("*").order("name", { ascending: true }).then(result => {
              if (!cancelled && !result.error && result.data) setCategories(result.data.map(mapDbCategoryToCategory));
              return result;
            }),
            supabase.from("orders").select("*").order("created_at", { ascending: false }),
            supabase.from("lifestyle_tags").select("*"),
            supabase.from("sizes").select("*"),
            supabase.from("colors").select("*"),
            supabase.from("instagram_posts").select("*").then(result => {
              if (!cancelled && !result.error && result.data) setInstagramPosts(result.data.map(mapDbIgToIg));
              return result;
            }),
          ]);

          if (!pErr && pData && pData.length > 0) setProducts(pData.map(mapDbProductToProduct));
          if (!cErr && cData && cData.length > 0) setCategories(cData.map(mapDbCategoryToCategory));
          if (!oErr && oData && oData.length > 0) setOrders(oData.map(mapDbOrderToOrder));
          if (tData && tData.length > 0) setLifestyleTags(tData.map(mapDbTagToTag));
          if (sData && sData.length > 0) setSizes(sData.map(mapDbSizeToSize));
          if (colData && colData.length > 0) setColors(colData.map(mapDbColorToColor));
          if (igData && igData.length > 0) setInstagramPosts(igData.map(mapDbIgToIg));
        } else {
          // LocalStorage fallback
          const savedProducts = localStorage.getItem("ks_products");
          if (savedProducts) setProducts(JSON.parse(savedProducts));

          const savedCategories = localStorage.getItem("ks_categories");
          if (savedCategories) setCategories(JSON.parse(savedCategories));

          const savedOrders = localStorage.getItem("ks_orders");
          if (savedOrders) setOrders(JSON.parse(savedOrders));

          const savedCoupons = localStorage.getItem("ks_coupons");
          if (savedCoupons) setCoupons(JSON.parse(savedCoupons));
        }
      } catch (err) {
        console.error("Error connecting to Supabase database:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDataFromSupabase();
    return () => { cancelled = true; };
  }, []);

  // Save Cart & Wishlist locally with QuotaExceeded error prevention
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // Store compact cart payload without heavy multi-megabyte base64 image strings
        const lightCart = cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
          product: {
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            category: item.product.category,
            images: [item.product.images[0] || ""],
          },
        }));
        localStorage.setItem("ks_cart", JSON.stringify(lightCart));
      } catch (err) {
        console.warn("localStorage quota exceeded for ks_cart, retrying with minimal payload:", err);
        try {
          localStorage.removeItem("ks_cart");
          const minimalCart = cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor,
          }));
          localStorage.setItem("ks_cart", JSON.stringify(minimalCart));
        } catch (retryErr) {
          console.error("Failed to save cart to localStorage:", retryErr);
        }
      }
    }
  }, [cart]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ks_wishlist", JSON.stringify(wishlist));
    }
  }, [wishlist]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (customerUser) {
        localStorage.setItem("ks_user", JSON.stringify(customerUser));
      } else {
        localStorage.removeItem("ks_user");
      }
    }
  }, [customerUser]);

  useEffect(() => {
    if (adminUser) localStorage.setItem("ks_admin_user", JSON.stringify(adminUser));
    else localStorage.removeItem("ks_admin_user");
  }, [adminUser]);

  // Auth Actions
  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const openCartDrawer = () => setIsCartDrawerOpen(true);
  const closeCartDrawer = () => setIsCartDrawerOpen(false);

  const login = (email: string, role: "admin" | "customer" = "customer", userName?: string) => {
    const isAdmin = role === "admin";
    const displayName = userName?.trim()
      ? userName.trim()
      : isAdmin
      ? "Admin User"
      : email.split("@")[0];

    const user: User = {
      id: "usr-" + Date.now(),
      name: displayName,
      email,
      role: isAdmin ? "admin" : "customer",
    };
    if (isAdmin) setAdminUser(user);
    else setCustomerUser(user);
    closeAuthModal();
    return true;
  };

  const logout = () => {
    if (isAdminRoute) setAdminUser(null);
    else setCustomerUser(null);
  };

  // Cart Actions
  const addToCart = (product: Product, size?: string, color?: string, qty: number = 1) => {
    const selectedSize = size || product.sizes[0] || "Standard";
    const selectedColor = color || product.colors[0] || "Standard";

    const latest = products.find(p => p.id === product.id) || product;
    const alreadyInBag = cart.filter(item => item.product.id === product.id && (latest.sizeStock ? item.selectedSize === selectedSize : true)).reduce((sum, item) => sum + item.quantity, 0);
    if (!Number.isInteger(qty) || qty <= 0 || alreadyInBag + qty > stockForSize(latest, selectedSize)) {
      showToast({ type: "info", title: "Stock unavailable", message: `Only ${stockForSize(latest, selectedSize)} available for this size.` });
      return;
    }
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedSize === selectedSize &&
          item.selectedColor === selectedColor
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += qty;
        return updated;
      } else {
        return [
          ...prev,
          {
            product,
            quantity: qty,
            selectedSize,
            selectedColor,
          },
        ];
      }
    });

    showToast({
      type: "cart",
      title: "Added to Shopping Bag ✨",
      message: `${product.name} (${selectedSize})`,
      actionText: "View Cart",
      onAction: () => setIsCartDrawerOpen(true),
      imageUrl: product.images[0],
    });
  };

  const removeFromCart = (productId: string, size: string, color: string) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(
            item.product.id === productId &&
            item.selectedSize === size &&
            item.selectedColor === color
          )
      )
    );
  };

  const updateCartQty = (productId: string, size: string, color: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId, size, color);
      return;
    }
    const product = products.find(value => value.id === productId);
    const otherQuantity = cart.filter(item => item.product.id === productId && (product?.sizeStock ? item.selectedSize === size : true) && !(item.selectedSize === size && item.selectedColor === color)).reduce((sum, item) => sum + item.quantity, 0);
    if (!product || !Number.isInteger(qty) || qty + otherQuantity > stockForSize(product, size)) {
      showToast({ type: "info", title: "Stock unavailable", message: "This quantity is not available for the selected size." });
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (
          item.product.id === productId &&
          item.selectedSize === size &&
          item.selectedColor === color
        ) {
          return { ...item, quantity: qty };
        }
        return item;
      })
    );
  };

  const clearCart = () => setCart([]);
  const acceptPaidOrder = (order: Order) => {
    setOrders(previous => [order, ...previous.filter(item => item.id !== order.id)]);
    clearCart();
    setAppliedCoupon(null);
    void supabase.from("products").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setProducts(data.map(mapDbProductToProduct));
    });
  };

  const getCartTotal = () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const getCartItemCount = () => cart.reduce((count, item) => count + item.quantity, 0);

  const toggleWishlist = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    setWishlist((prev) => {
      const isAlreadyIn = prev.includes(productId);
      if (isAlreadyIn) {
        if (product) {
          showToast({
            type: "wishlist",
            title: "Removed from Wishlist",
            message: `${product.name} removed from your wishlist.`,
            imageUrl: product.images[0],
          });
        }
        return prev.filter((id) => id !== productId);
      } else {
        if (product) {
          showToast({
            type: "wishlist",
            title: "Saved to Wishlist ❤️",
            message: `${product.name} saved to your luxury wishlist.`,
            actionText: "View Wishlist",
            onAction: () => {
              if (typeof window !== "undefined") window.location.href = "/wishlist";
            },
            imageUrl: product.images[0],
          });
        }
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const clearWishlist = () => setWishlist([]);

  // --- SUPABASE CRUD ACTIONS ---

  // Admin Product Actions
  const addProduct = async (productData: Omit<Product, "id" | "createdAt">) => {
    const tempId = "prod-" + Date.now();
    const tempProduct: Product = {
      ...productData,
      id: tempId,
      createdAt: new Date().toISOString(),
    };

    // Update local state instantly
    setProducts((prev) => [tempProduct, ...prev]);

    // Persist to Supabase Database
    if (isSupabaseConfigured) {
      try {
        const dbRow = mapProductToDbRow(productData);
        const { data, error } = await supabase.from("products").insert([dbRow]).select();
        if (error) {
          throw new Error(error.message);
        } else if (data && data[0]) {
          const insertedProduct = mapDbProductToProduct(data[0]);
          setProducts((prev) => prev.map((p) => (p.id === tempId ? insertedProduct : p)));
        }
      } catch (err) {
        console.error("Error inserting product into Supabase:", err);
        setProducts(prev => prev.filter(p => p.id !== tempId));
        throw err;
      }
    } else {
      try {
        localStorage.setItem("ks_products", JSON.stringify([tempProduct, ...products]));
      } catch (err) {
        console.error("Quota error saving products to localStorage:", err);
      }
    }
  };

  const updateProduct = async (id: string, updatedFields: Partial<Product>) => {
    const previous = products.find(product => product.id === id);
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updatedFields } : p)));

    if (isSupabaseConfigured) {
      try {
        const updateRow: any = {};
        if (updatedFields.name) updateRow.name = updatedFields.name;
        if (updatedFields.description) updateRow.description = updatedFields.description;
        if (updatedFields.price !== undefined) updateRow.price = updatedFields.price;
        if (updatedFields.originalPrice !== undefined) updateRow.original_price = updatedFields.originalPrice;
        if (updatedFields.category) updateRow.category_name = updatedFields.category;
        if (updatedFields.stock !== undefined) updateRow.stock = updatedFields.stock;
        if (updatedFields.sizeStock) updateRow.size_stock = updatedFields.sizeStock;
        if (updatedFields.colorImages) updateRow.color_images = updatedFields.colorImages;
        if (updatedFields.sizes) updateRow.sizes = updatedFields.sizes;
        if (updatedFields.colors) updateRow.colors = updatedFields.colors;
        if (updatedFields.lifestyleTags) updateRow.lifestyle_tags = updatedFields.lifestyleTags;
        if (updatedFields.images) updateRow.images = updatedFields.images;
        if (updatedFields.isLatest !== undefined) updateRow.is_latest = updatedFields.isLatest;
        if (updatedFields.isFeatured !== undefined) updateRow.is_featured = updatedFields.isFeatured;

        const { error } = await supabase.from("products").update(updateRow).eq("id", id);
        if (error) throw new Error(error.message);
      } catch (err) {
        console.error("Error updating product in Supabase:", err);
        if (previous) setProducts(prev => prev.map(product => product.id === id ? previous : product));
        throw err;
      }
    } else {
      localStorage.setItem("ks_products", JSON.stringify(products.map(product => product.id === id ? { ...product, ...updatedFields } : product)));
    }
  };

  const deleteProduct = async (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (isSupabaseConfigured) {
      try {
        await supabase.from("products").delete().eq("id", id);
      } catch (err) {
        console.error("Error deleting product from Supabase:", err);
      }
    }
  };

  // Admin Category Actions
  const addCategory = async (categoryData: Omit<Category, "id">) => {
    const tempCategory: Category = { ...categoryData, id: "cat-" + Date.now() };
    setCategories((prev) => [...prev, tempCategory]);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("categories")
          .insert([{ name: categoryData.name, slug: categoryData.slug, image_url: categoryData.imageUrl }])
          .select();
        if (!error && data && data[0]) {
          setCategories((prev) => prev.map((c) => (c.id === tempCategory.id ? mapDbCategoryToCategory(data[0]) : c)));
        }
      } catch (err) {
        console.error("Error adding category to Supabase:", err);
      }
    }
  };

  const deleteCategory = async (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    if (isSupabaseConfigured) {
      try {
        await supabase.from("categories").delete().eq("id", id);
      } catch (err) {
        console.error("Error deleting category from Supabase:", err);
      }
    }
  };

  const updateCategory = async (id: string, fields: Partial<Category>) => {
    if (isSupabaseConfigured) {
      const row = { name: fields.name, image_url: fields.imageUrl };
      const { error } = await supabase.from("categories").update(row).eq("id", id);
      if (error) throw new Error(error.message);
    }
    const updated = categories.map(category => category.id === id ? { ...category, ...fields } : category);
    if (!isSupabaseConfigured) localStorage.setItem("ks_categories", JSON.stringify(updated));
    setCategories(updated);
  };

  // Admin Banner Actions
  const addBanner = async (bannerData: Omit<Banner, "id">) => {
    const tempBanner: Banner = { ...bannerData, id: "banner-" + Date.now() };
    setBanners((prev) => [...prev, tempBanner]);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("banners")
          .insert([
            {
              title: bannerData.title,
              subtitle: bannerData.subtitle,
              image_url: bannerData.imageUrl,
              ...(bannerData.mobileImageUrl ? { mobile_image_url: bannerData.mobileImageUrl } : {}),
              cta_text: bannerData.ctaText,
              cta_link: bannerData.ctaLink,
              is_active: bannerData.isActive,
              order_num: bannerData.orderNum,
              text_align: bannerData.textAlign || "left",
              text_color: bannerData.textColor || "#F8F3EC",
            },
          ])
          .select();
        if (!error && data && data[0]) {
          setBanners((prev) => prev.map((b) => (b.id === tempBanner.id ? mapDbBannerToBanner(data[0]) : b)));
        }
        if (error) throw new Error(error.message);
      } catch (err) {
        console.error("Error adding banner to Supabase:", err);
        setBanners(prev => prev.filter(b => b.id !== tempBanner.id));
        throw err;
      }
    }
  };

  const updateBanner = async (id: string, fields: Partial<Banner>) => {
    const previous = banners.find(b => b.id === id);
    setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, ...fields } : b)));
    if (isSupabaseConfigured) {
      try {
        const updateObj: any = {};
        if (fields.isActive !== undefined) updateObj.is_active = fields.isActive;
        if (fields.title) updateObj.title = fields.title;
        if (fields.imageUrl) updateObj.image_url = fields.imageUrl;
        if (fields.mobileImageUrl !== undefined) updateObj.mobile_image_url = fields.mobileImageUrl || null;
        if (fields.subtitle !== undefined) updateObj.subtitle = fields.subtitle;
        if (fields.ctaText !== undefined) updateObj.cta_text = fields.ctaText;
        if (fields.ctaLink !== undefined) updateObj.cta_link = fields.ctaLink;
        if (fields.textAlign) updateObj.text_align = fields.textAlign;
        if (fields.textColor) updateObj.text_color = fields.textColor;
        const { error } = await supabase.from("banners").update(updateObj).eq("id", id);
        if (error) throw new Error(error.message);
      } catch (err) {
        console.error("Error updating banner in Supabase:", err);
        if (previous) setBanners(prev => prev.map(b => b.id === id ? previous : b));
        throw err;
      }
    }
  };

  const deleteBanner = async (id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
    if (isSupabaseConfigured) {
      try {
        await supabase.from("banners").delete().eq("id", id);
      } catch (err) {
        console.error("Error deleting banner from Supabase:", err);
      }
    }
  };

  // Order Actions
  const addOrder = async (orderData: Omit<Order, "id" | "orderNumber" | "createdAt">): Promise<Order> => {
    let newOrder: Order;
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.rpc("place_order_with_stock", { order_data: orderData });
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Order was not saved. Please try again.");
      newOrder = mapDbOrderToOrder(data);
      const { data: refreshed } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (refreshed) setProducts(refreshed.map(mapDbProductToProduct));
    } else {
      const updated = reduceInventory(products, orderData.items);
      newOrder = { ...orderData, id: "ord-" + Date.now(), orderNumber: "KS-" + Date.now(), createdAt: new Date().toISOString() };
      localStorage.setItem("ks_products", JSON.stringify(updated));
      localStorage.setItem("ks_orders", JSON.stringify([newOrder, ...orders]));
      setProducts(updated);
    }
    setOrders(prev => [newOrder, ...prev]);
    clearCart();
    return newOrder;
  };

  const updateOrderStatus = async (id: string, status: Order["status"]) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    if (isSupabaseConfigured) {
      try {
        await supabase.from("orders").update({ status }).eq("id", id);
      } catch (err) {
        console.error("Error updating order status in Supabase:", err);
      }
    }
  };

  // Attribute Actions
  const addTag = async (name: string) => {
    const tempTag: LifestyleTag = {
      id: "tag-" + Date.now(),
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
    };
    setLifestyleTags((prev) => [...prev, tempTag]);
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from("lifestyle_tags").insert([{ name: tempTag.name, slug: tempTag.slug }]).select();
        if (!error && data && data[0]) {
          setLifestyleTags((prev) => prev.map((t) => (t.id === tempTag.id ? mapDbTagToTag(data[0]) : t)));
        }
      } catch (err) {
        console.error("Error adding tag to Supabase:", err);
      }
    }
  };

  const updateTag = async (id: string, name: string) => {
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    setLifestyleTags((prev) => prev.map((t) => (t.id === id ? { ...t, name, slug } : t)));
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from("lifestyle_tags").update({ name, slug }).eq("id", id);
        if (error) console.error("Error updating tag in Supabase:", error);
      } catch (err) {
        console.error("Error updating tag in Supabase:", err);
      }
    }
  };

  const deleteTag = async (id: string) => {
    setLifestyleTags((prev) => prev.filter((t) => t.id !== id));
    if (isSupabaseConfigured) {
      try {
        await supabase.from("lifestyle_tags").delete().eq("id", id);
      } catch (err) {
        console.error("Error deleting tag from Supabase:", err);
      }
    }
  };

  const addSize = async (name: string, code: string) => {
    const tempId = "size-" + Date.now();
    const newSize: SizeOption = { id: tempId, name, code };
    setSizes((prev) => [...prev, newSize]);
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from("sizes").insert([{ name, code }]).select();
        if (!error && data && data[0]) {
          setSizes((prev) => prev.map((s) => (s.id === tempId ? mapDbSizeToSize(data[0]) : s)));
        }
      } catch (err) {
        console.error("Error adding size to Supabase:", err);
      }
    }
  };

  const updateSize = async (id: string, name: string, code: string) => {
    setSizes((prev) => prev.map((s) => (s.id === id ? { ...s, name, code } : s)));
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from("sizes").update({ name, code }).eq("id", id);
        if (error) console.error("Error updating size in Supabase:", error);
      } catch (err) {
        console.error("Error updating size in Supabase:", err);
      }
    }
  };

  const deleteSize = async (id: string) => {
    setSizes((prev) => prev.filter((s) => s.id !== id));
    if (isSupabaseConfigured) {
      try {
        await supabase.from("sizes").delete().eq("id", id);
      } catch (err) {
        console.error("Error deleting size from Supabase:", err);
      }
    }
  };

  const addColor = async (name: string, hex: string) => {
    const tempId = "col-" + Date.now();
    const newColor: ColorOption = { id: tempId, name, hex };
    setColors((prev) => [...prev, newColor]);
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from("colors").insert([{ name, hex }]).select();
        if (!error && data && data[0]) {
          setColors((prev) => prev.map((c) => (c.id === tempId ? mapDbColorToColor(data[0]) : c)));
        }
      } catch (err) {
        console.error("Error adding color to Supabase:", err);
      }
    }
  };

  const updateColor = async (id: string, name: string, hex: string) => {
    setColors((prev) => prev.map((c) => (c.id === id ? { ...c, name, hex } : c)));
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from("colors").update({ name, hex }).eq("id", id);
        if (error) console.error("Error updating color in Supabase:", error);
      } catch (err) {
        console.error("Error updating color in Supabase:", err);
      }
    }
  };

  const deleteColor = async (id: string) => {
    setColors((prev) => prev.filter((c) => c.id !== id));
    if (isSupabaseConfigured) {
      try {
        await supabase.from("colors").delete().eq("id", id);
      } catch (err) {
        console.error("Error deleting color from Supabase:", err);
      }
    }
  };

  // Instagram Actions
  const addInstagramPost = async (postUrl: string, imageUrl: string, caption: string) => {
    const newPost: InstagramPost = {
      id: "ig-" + Date.now(),
      postUrl,
      imageUrl,
      caption,
      orderNum: instagramPosts.length + 1,
    };
    setInstagramPosts((prev) => [...prev, newPost]);
    if (isSupabaseConfigured) {
      try {
        await supabase.from("instagram_posts").insert([
          { post_url: postUrl, image_url: imageUrl, caption, order_num: newPost.orderNum },
        ]);
      } catch (err) {
        console.error("Error adding instagram post to Supabase:", err);
      }
    }
  };

  const deleteInstagramPost = async (id: string) => {
    setInstagramPosts((prev) => prev.filter((p) => p.id !== id));
    if (isSupabaseConfigured) {
      try {
        await supabase.from("instagram_posts").delete().eq("id", id);
      } catch (err) {
        console.error("Error deleting instagram post from Supabase:", err);
      }
    }
  };

  // Coupon Handlers
  const applyCoupon = (code: string): { success: boolean; message: string } => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: "Please enter a valid coupon code." };
    }

    const found = coupons.find((c) => c.code.toUpperCase() === cleanCode);
    if (!found) {
      return { success: false, message: `Coupon code "${cleanCode}" is invalid.` };
    }

    if (!found.isActive) {
      return { success: false, message: `Coupon code "${found.code}" is currently inactive.` };
    }

    const subtotal = getCartTotal();
    if (found.minOrderValue > 0 && subtotal < found.minOrderValue) {
      return {
        success: false,
        message: `Minimum order value of ₹${found.minOrderValue} required for coupon ${found.code}.`,
      };
    }

    const now = new Date();
    if (found.validFrom) {
      const validFromDate = new Date(found.validFrom);
      if (now < validFromDate) {
        return { success: false, message: `Coupon code "${found.code}" is not valid yet.` };
      }
    }

    if (found.validUntil) {
      const validUntilDate = new Date(found.validUntil);
      if (now > validUntilDate) {
        return { success: false, message: `Coupon code "${found.code}" has expired.` };
      }
    }

    if (found.usageLimit && found.timesUsed >= found.usageLimit) {
      return { success: false, message: `Coupon code "${found.code}" usage limit has been reached.` };
    }

    setAppliedCoupon(found);
    return { success: true, message: `Coupon ${found.code} applied successfully!` };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const getDiscountAmount = () => {
    if (!appliedCoupon) return 0;
    const subtotal = getCartTotal();
    if (subtotal === 0) return 0;

    if (appliedCoupon.discountType === "percentage") {
      let discount = (subtotal * appliedCoupon.discountValue) / 100;
      if (appliedCoupon.maxDiscount && discount > appliedCoupon.maxDiscount) {
        discount = appliedCoupon.maxDiscount;
      }
      return Math.round(discount);
    } else {
      return Math.min(subtotal, appliedCoupon.discountValue);
    }
  };

  const addCoupon = async (couponData: Omit<Coupon, "id" | "timesUsed">) => {
    const newCoupon: Coupon = {
      ...couponData,
      id: `coup-${Date.now()}`,
      timesUsed: 0,
    };
    setCoupons((prev) => {
      const updated = [newCoupon, ...prev];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("ks_coupons", JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });
  };

  const updateCoupon = async (id: string, updatedFields: Partial<Coupon>) => {
    setCoupons((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, ...updatedFields } : c));
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("ks_coupons", JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });
    if (appliedCoupon && appliedCoupon.id === id) {
      setAppliedCoupon((prev) => (prev ? { ...prev, ...updatedFields } : null));
    }
  };

  const deleteCoupon = async (id: string) => {
    setCoupons((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("ks_coupons", JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });

    if (appliedCoupon && appliedCoupon.id === id) {
      setAppliedCoupon(null);
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from("coupons").delete().eq("id", id);
      } catch (err) {
        console.error("Error deleting coupon from Supabase:", err);
      }
    }
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        banners,
        orders,
        lifestyleTags,
        sizes,
        colors,
        instagramPosts,
        coupons,
        appliedCoupon,
        cart,
        wishlist,
        currentUser,
        isAuthModalOpen,
        isCartDrawerOpen,
        ipAddress,
        isLoading,
        isBannerLoading,
        toastMessage,
        showToast,
        hideToast,

        applyCoupon,
        removeCoupon,
        getDiscountAmount,

        openAuthModal,
        closeAuthModal,
        openCartDrawer,
        closeCartDrawer,
        login,
        logout,

        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        acceptPaidOrder,
        getCartTotal,
        getCartItemCount,

        toggleWishlist,
        isInWishlist,
        clearWishlist,

        addProduct,
        updateProduct,
        deleteProduct,

        addCategory,
        updateCategory,
        deleteCategory,

        addBanner,
        updateBanner,
        deleteBanner,

        addOrder,
        updateOrderStatus,

        addTag,
        updateTag,
        deleteTag,

        addSize,
        updateSize,
        deleteSize,

        addColor,
        updateColor,
        deleteColor,

        addInstagramPost,
        deleteInstagramPost,

        addCoupon,
        updateCoupon,
        deleteCoupon,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
