import { createClient } from "@supabase/supabase-js";
import { Product, Category, Banner, Order, LifestyleTag, SizeOption, ColorOption, InstagramPost, Coupon } from "./mockData";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://iajmqlindigkluuxhvmd.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const isSupabaseConfigured =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://your-project.supabase.co";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Data Converters for DB snake_case <-> JS camelCase
export function mapDbProductToProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    price: Number(row.price),
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    category: row.category_name || "General",
    categoryId: row.category_id || "",
    stock: row.stock ?? 10,
    sizeStock: row.size_stock && Object.keys(row.size_stock).length ? row.size_stock : undefined,
    colorImages: row.color_images || {},
    sizes: row.sizes || ["S", "M", "L"],
    colors: row.colors || [],
    lifestyleTags: row.lifestyle_tags || ["Festive", "Ethnic"],
    images: row.images && row.images.length > 0 ? row.images : ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800"],
    isLatest: row.is_latest ?? true,
    isFeatured: row.is_featured ?? false,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function mapProductToDbRow(p: Omit<Product, "id" | "createdAt">) {
  return {
    name: p.name,
    description: p.description,
    price: p.price,
    original_price: p.originalPrice || null,
    category_name: p.category,
    category_id: p.categoryId || null,
    stock: p.stock,
    size_stock: p.sizeStock || {},
    color_images: p.colorImages || {},
    sizes: p.sizes,
    colors: p.colors,
    lifestyle_tags: p.lifestyleTags,
    images: p.images,
    is_latest: p.isLatest,
    is_featured: p.isFeatured,
  };
}

export function mapDbCategoryToCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    imageUrl: row.image_url || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800",
  };
}

export function mapDbBannerToBanner(row: any): Banner {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle || "",
    imageUrl: row.image_url,
    mobileImageUrl: row.mobile_image_url || undefined,
    ctaText: row.cta_text || "EXPLORE COLLECTION",
    ctaLink: row.cta_link || "/shop",
    isActive: row.is_active ?? true,
    orderNum: row.order_num || 1,
    textAlign: row.text_align || "left",
    textColor: row.text_color || "#F8F3EC",
  };
}

export function mapDbOrderToOrder(row: any): Order {
  const pId = row.razorpay_payment_id || row.payment_id || row.gateway_payment_id || row.payment_reference || "";
  const pStatus = row.payment_status || (pId ? "Paid" : (row.status === "Cancelled" ? "Failed" : "Pending"));
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    shippingAddress: row.shipping_address,
    city: row.city,
    postalCode: row.postal_code,
    totalAmount: Number(row.total_amount),
    status: row.status || "Pending",
    items: row.items || [],
    ipAddress: row.ip_address || "",
    razorpayPaymentId: pId,
    paymentId: pId,
    paymentStatus: pStatus,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function mapDbTagToTag(row: any): LifestyleTag {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
  };
}

export function mapDbSizeToSize(row: any): SizeOption {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
  };
}

export function mapDbColorToColor(row: any): ColorOption {
  return {
    id: row.id,
    name: row.name,
    hex: row.hex,
  };
}

export function mapDbIgToIg(row: any): InstagramPost {
  return {
    id: row.id,
    postUrl: row.post_url,
    imageUrl: row.image_url,
    caption: row.caption || "",
    orderNum: row.order_num || 1,
  };
}

export function mapDbCouponToCoupon(row: any): Coupon {
  return {
    id: row.id,
    code: row.code,
    description: row.description || "",
    discountType: row.discount_type || "percentage",
    discountValue: Number(row.discount_value || 0),
    maxDiscount: row.max_discount ? Number(row.max_discount) : null,
    minOrderValue: Number(row.min_order_value || 0),
    usageLimit: row.usage_limit ? Number(row.usage_limit) : null,
    timesUsed: Number(row.times_used || 0),
    validFrom: row.valid_from || new Date().toISOString(),
    validUntil: row.valid_until || null,
    isActive: row.is_active ?? true,
    showInNavbar: row.show_in_navbar ?? false,
  };
}
