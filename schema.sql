-- Kaavu Styles Supabase Database Schema

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    category_name TEXT,
    stock INT DEFAULT 10,
    sizes TEXT[] DEFAULT ARRAY['S', 'M', 'L', 'XL'],
    colors TEXT[] DEFAULT ARRAY['Crimson', 'Gold', 'Ivory'],
    lifestyle_tags TEXT[] DEFAULT ARRAY['Festive', 'Ethnic'],
    images TEXT[] NOT NULL,
    is_latest BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. HERO BANNERS TABLE
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    cta_text TEXT DEFAULT 'Explore Collections',
    cta_link TEXT DEFAULT '/shop',
    is_active BOOLEAN DEFAULT true,
    order_num INT DEFAULT 1,
    text_align TEXT DEFAULT 'left',
    text_color TEXT DEFAULT '#F8F3EC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    user_id UUID,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'Pending', -- Pending, Processing, Shipped, Delivered, Cancelled
    items JSONB NOT NULL,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. LIFESTYLE TAGS TABLE
CREATE TABLE IF NOT EXISTS public.lifestyle_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL
);

-- 6. SIZES TABLE
CREATE TABLE IF NOT EXISTS public.sizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL
);

-- 7. COLORS TABLE
CREATE TABLE IF NOT EXISTS public.colors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    hex TEXT NOT NULL
);

-- 8. INSTAGRAM POSTS TABLE
CREATE TABLE IF NOT EXISTS public.instagram_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_url TEXT NOT NULL,
    image_url TEXT NOT NULL,
    caption TEXT,
    order_num INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. COUPONS TABLE
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    discount_type TEXT DEFAULT 'percentage', -- 'percentage' or 'fixed'
    discount_value DECIMAL(10,2) NOT NULL,
    max_discount DECIMAL(10,2),
    min_order_value DECIMAL(10,2) DEFAULT 0,
    usage_limit INT,
    times_used INT DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lifestyle_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Create Public Read Policies for Storefront
CREATE POLICY "Allow Public Read Categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow Public Read Products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow Public Read Banners" ON public.banners FOR SELECT USING (true);
CREATE POLICY "Allow Public Insert Orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow Public Read Tags" ON public.lifestyle_tags FOR SELECT USING (true);
CREATE POLICY "Allow Public Read Sizes" ON public.sizes FOR SELECT USING (true);
CREATE POLICY "Allow Public Read Colors" ON public.colors FOR SELECT USING (true);
CREATE POLICY "Allow Public Read Instagram" ON public.instagram_posts FOR SELECT USING (true);
CREATE POLICY "Allow Public Read Coupons" ON public.coupons FOR SELECT USING (true);

-- Admin Full Access Policies (Allows full CRUD for authenticated service role or admin app)
CREATE POLICY "Allow Admin Full Categories" ON public.categories FOR ALL USING (true);
CREATE POLICY "Allow Admin Full Products" ON public.products FOR ALL USING (true);
CREATE POLICY "Allow Admin Full Banners" ON public.banners FOR ALL USING (true);
CREATE POLICY "Allow Admin Full Orders" ON public.orders FOR ALL USING (true);
CREATE POLICY "Allow Admin Full Tags" ON public.lifestyle_tags FOR ALL USING (true);
CREATE POLICY "Allow Admin Full Sizes" ON public.sizes FOR ALL USING (true);
CREATE POLICY "Allow Admin Full Colors" ON public.colors FOR ALL USING (true);
CREATE POLICY "Allow Admin Full Instagram" ON public.instagram_posts FOR ALL USING (true);
CREATE POLICY "Allow Admin Full Coupons" ON public.coupons FOR ALL USING (true);

-- SEED INITIAL SAMPLE DATA
INSERT INTO public.categories (name, slug, image_url) VALUES
('Royal Sarees', 'sarees', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800'),
('Designer Kurtis', 'kurtis', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800'),
('Bridal Lehengas', 'lehengas', 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800'),
('Indo-Western', 'indo-western', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800')
ON CONFLICT DO NOTHING;

INSERT INTO public.coupons (code, description, discount_type, discount_value, max_discount, min_order_value, usage_limit, times_used, valid_from, is_active) VALUES
('KAAVU10', 'Enjoy 10% Off on Orders Above ₹999/-', 'percentage', 10.00, 500.00, 999.00, NULL, 14, NOW(), true),
('SAVE20', 'Festive Season 20% Special Discount', 'percentage', 20.00, 1000.00, 2000.00, 100, 23, NOW(), true),
('WELCOME500', 'Flat ₹500 off on luxury sarees', 'fixed', 500.00, NULL, 4999.00, 50, 8, NOW(), true)
ON CONFLICT (code) DO NOTHING;

-- MIGRATION ALTER TABLE STATEMENTS (Run if updating an existing table)
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS text_align TEXT DEFAULT 'left';
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#F8F3EC';
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS mobile_image_url TEXT;


-- Size inventory and color galleries
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS size_stock JSONB NOT NULL DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS color_images JSONB NOT NULL DEFAULT '{}';

-- Existing products keep their shared stock until the admin allocates it by size.
CREATE OR REPLACE FUNCTION public.place_order_with_stock(order_data JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  item JSONB;
  product_row public.products%ROWTYPE;
  order_row public.orders%ROWTYPE;
  qty INTEGER;
  chosen_size TEXT;
  available INTEGER;
BEGIN
  IF jsonb_typeof(order_data->'items') IS DISTINCT FROM 'array' OR jsonb_array_length(order_data->'items') = 0 THEN
    RAISE EXCEPTION 'An order must contain products';
  END IF;
  -- Lock products in a consistent order; all reductions and insertion roll back on failure.
  PERFORM id FROM public.products WHERE id IN (
    SELECT (value->>'productId')::UUID FROM jsonb_array_elements(order_data->'items')
  ) ORDER BY id FOR UPDATE;
  FOR item IN SELECT value FROM jsonb_array_elements(order_data->'items') LOOP
    SELECT * INTO product_row FROM public.products WHERE id = (item->>'productId')::UUID;
    IF NOT FOUND THEN RAISE EXCEPTION 'Product no longer exists'; END IF;
    qty := (item->>'quantity')::INTEGER;
    chosen_size := item->>'size';
    IF qty IS NULL OR qty <= 0 OR (item->>'quantity')::NUMERIC <> qty THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
    IF chosen_size IS NULL OR NOT (chosen_size = ANY(CASE WHEN cardinality(product_row.sizes) > 0 THEN product_row.sizes ELSE ARRAY['Standard'] END)) THEN RAISE EXCEPTION 'Invalid size'; END IF;
    IF item->>'color' IS NULL OR NOT ((item->>'color') = ANY(CASE WHEN cardinality(product_row.colors) > 0 THEN product_row.colors ELSE ARRAY['Standard'] END)) THEN RAISE EXCEPTION 'Invalid color'; END IF;
    available := CASE WHEN product_row.size_stock <> '{}'::JSONB THEN COALESCE((product_row.size_stock->>chosen_size)::INTEGER, 0) ELSE product_row.stock END;
    IF available < qty OR product_row.stock < qty THEN RAISE EXCEPTION 'Insufficient stock for % (size %)', product_row.name, chosen_size; END IF;
    UPDATE public.products SET stock = stock - qty,
      size_stock = CASE WHEN size_stock <> '{}'::JSONB THEN jsonb_set(size_stock, ARRAY[chosen_size], to_jsonb(available - qty)) ELSE size_stock END
      WHERE id = product_row.id;
  END LOOP;
  INSERT INTO public.orders (order_number, customer_name, customer_email, customer_phone, shipping_address, city, postal_code, total_amount, status, items, ip_address)
  VALUES (
    COALESCE(
      NULLIF(order_data->>'orderNumber', ''),
      NULLIF(order_data->>'order_number', ''),
      (
        SELECT 'KAAVU' || LPAD((COALESCE(MAX(SUBSTRING(order_number FROM '[0-9]+')::BIGINT), 0) + 1)::TEXT, 5, '0')
        FROM public.orders
        WHERE order_number ~ '^KAAVU[0-9]+$'
      )
    ),
    order_data->>'customerName', order_data->>'customerEmail', order_data->>'customerPhone', order_data->>'shippingAddress', order_data->>'city', order_data->>'postalCode', (order_data->>'totalAmount')::NUMERIC, 'Pending', order_data->'items', order_data->>'ipAddress'
  )
  RETURNING * INTO order_row;
  RETURN to_jsonb(order_row);
END;
$$;

-- 10. SUPABASE STORAGE BUCKET FOR MEDIA ASSETS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'images',
    'images',
    true,
    10485760,
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

-- Storage bucket access policies
CREATE POLICY "Public Read Images" ON storage.objects FOR SELECT USING (bucket_id = 'images');
CREATE POLICY "Public Insert Images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images');
CREATE POLICY "Public Update Images" ON storage.objects FOR UPDATE USING (bucket_id = 'images');
CREATE POLICY "Public Delete Images" ON storage.objects FOR DELETE USING (bucket_id = 'images');


-- Shiprocket per-order parcel details
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shiprocket JSONB;
CREATE OR REPLACE FUNCTION public.claim_shiprocket_order(target_order_id UUID, parcel_details JSONB)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE claimed UUID;
BEGIN
  UPDATE public.orders SET shiprocket = parcel_details || jsonb_build_object('status', 'Creating', 'requestedAt', now())
  WHERE id = target_order_id AND shiprocket IS NULL
  RETURNING id INTO claimed;
  RETURN claimed IS NOT NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_shiprocket_order(UUID, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_shiprocket_order(UUID, JSONB) TO service_role;
NOTIFY pgrst, 'reload schema';


-- Private order access (applied after order functions are installed)
-- Deploy the authenticated admin endpoints before applying this migration.
BEGIN;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
-- Remove permissive order policies, including any added through the dashboard.
DO $$
DECLARE policy RECORD;
BEGIN
  FOR policy IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orders' LOOP
    EXECUTE format('DROP POLICY %I ON public.orders', policy.policyname);
  END LOOP;
END;
$$;
REVOKE ALL ON public.orders FROM anon, authenticated;
GRANT ALL ON public.orders TO service_role;
-- Inventory reduction/order insertion is only called after server payment verification.
REVOKE EXECUTE ON FUNCTION public.place_order_with_stock(JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.place_order_with_stock(JSONB) TO service_role;
-- Existing historical snapshots can be cleaned separately without losing their images.
CREATE OR REPLACE FUNCTION public.reject_inline_order_images()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(NEW.items) item WHERE item->>'image' LIKE 'data:%' OR item->>'image' LIKE 'blob:%') THEN
    RAISE EXCEPTION 'Order images must be permanent URLs';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS orders_permanent_image_urls ON public.orders;
CREATE TRIGGER orders_permanent_image_urls BEFORE INSERT OR UPDATE OF items ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.reject_inline_order_images();
COMMIT;
NOTIFY pgrst, 'reload schema';
