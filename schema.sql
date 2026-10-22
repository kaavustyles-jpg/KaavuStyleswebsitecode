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

-- 10. ADMIN CREDENTIALS TABLE (Single-Row Secure Admin Authentication)
CREATE TABLE IF NOT EXISTS public.admin_credentials (
    id TEXT PRIMARY KEY DEFAULT 'primary',
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default initial admin row
INSERT INTO public.admin_credentials (id, email, password, updated_at)
VALUES ('primary', 'admin@kaavustyle.com', 'Kaavu@admin123', NOW())
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Deny public access to admin credentials" ON public.admin_credentials;
CREATE POLICY "Deny public access to admin credentials"
    ON public.admin_credentials
    FOR ALL
    TO authenticated, anon
    USING (false);

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


-- Size and color inventory
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variant_stock JSONB NOT NULL DEFAULT '{}';


-- Existing products retain shared stock until an admin enters size/color allocations.
CREATE OR REPLACE FUNCTION public.place_order_with_stock(order_data JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  item JSONB;
  product_row public.products%ROWTYPE;
  order_row public.orders%ROWTYPE;
  qty INTEGER;
  chosen_size TEXT;
  chosen_color TEXT;
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
    chosen_color := item->>'color';
    IF qty IS NULL OR qty <= 0 OR (item->>'quantity')::NUMERIC <> qty THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
    IF chosen_size IS NULL OR NOT (chosen_size = ANY(CASE WHEN cardinality(product_row.sizes) > 0 THEN product_row.sizes ELSE ARRAY['Standard'] END)) THEN RAISE EXCEPTION 'Invalid size'; END IF;
    IF item->>'color' IS NULL OR NOT ((item->>'color') = ANY(CASE WHEN cardinality(product_row.colors) > 0 THEN product_row.colors ELSE ARRAY['Standard'] END)) THEN RAISE EXCEPTION 'Invalid color'; END IF;
    available := CASE WHEN product_row.variant_stock <> '{}'::JSONB THEN COALESCE((product_row.variant_stock->chosen_size->>chosen_color)::INTEGER, 0) WHEN product_row.size_stock <> '{}'::JSONB THEN COALESCE((product_row.size_stock->>chosen_size)::INTEGER, 0) ELSE product_row.stock END;
    IF available < qty OR product_row.stock < qty THEN RAISE EXCEPTION 'Insufficient stock for % (size %, color %)', product_row.name, chosen_size, chosen_color; END IF;
    UPDATE public.products SET stock = stock - qty,
      variant_stock = CASE WHEN variant_stock <> '{}'::JSONB THEN jsonb_set(variant_stock, ARRAY[chosen_size, chosen_color], to_jsonb(available - qty)) ELSE variant_stock END,
      size_stock = CASE WHEN size_stock <> '{}'::JSONB THEN jsonb_set(size_stock, ARRAY[chosen_size], to_jsonb((size_stock->>chosen_size)::INTEGER - qty)) ELSE size_stock END
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

REVOKE EXECUTE ON FUNCTION public.place_order_with_stock(JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.place_order_with_stock(JSONB) TO service_role;
NOTIFY pgrst, 'reload schema';


-- Reliable order confirmation (must be last)
-- Apply after product-variant-stock.sql and razorpay-payments.sql.
BEGIN;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variant_stock JSONB NOT NULL DEFAULT '{}';
CREATE TABLE IF NOT EXISTS public.order_number_counter (
  singleton BOOLEAN PRIMARY KEY DEFAULT true CHECK (singleton),
  last_number BIGINT NOT NULL CHECK (last_number >= 0)
);
ALTER TABLE public.order_number_counter ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.order_number_counter FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.order_number_counter TO service_role;
INSERT INTO public.order_number_counter(singleton, last_number)
SELECT true, COALESCE(MAX(substring(order_number FROM '^KAAVU([0-9]+)$')::BIGINT), 0) FROM public.orders
ON CONFLICT(singleton) DO UPDATE SET last_number = GREATEST(public.order_number_counter.last_number, EXCLUDED.last_number);

CREATE OR REPLACE FUNCTION public.next_kaavu_order_number()
RETURNS TEXT LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE number_value BIGINT;
BEGIN
  UPDATE public.order_number_counter SET last_number = last_number + 1 WHERE singleton RETURNING last_number INTO number_value;
  IF number_value IS NULL THEN RAISE EXCEPTION 'Order counter is not initialized'; END IF;
  RETURN 'KAAVU' || lpad(number_value::TEXT, GREATEST(5, length(number_value::TEXT)), '0');
END;
$$;
REVOKE ALL ON FUNCTION public.next_kaavu_order_number() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.next_kaavu_order_number() TO service_role;

-- Size/color-aware atomic inventory and order insertion.
CREATE OR REPLACE FUNCTION public.place_order_with_stock(order_data JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  item JSONB;
  product_row public.products%ROWTYPE;
  order_row public.orders%ROWTYPE;
  qty INTEGER;
  chosen_size TEXT;
  chosen_color TEXT;
  available INTEGER;
  assigned_number TEXT;
BEGIN
  IF jsonb_typeof(order_data->'items') IS DISTINCT FROM 'array' OR jsonb_array_length(order_data->'items') = 0 THEN
    RAISE EXCEPTION 'An order must contain products';
  END IF;
  assigned_number := public.next_kaavu_order_number();
  -- Lock products in a consistent order; all reductions and insertion roll back on failure.
  PERFORM id FROM public.products WHERE id IN (
    SELECT (value->>'productId')::UUID FROM jsonb_array_elements(order_data->'items')
  ) ORDER BY id FOR UPDATE;
  FOR item IN SELECT value FROM jsonb_array_elements(order_data->'items') LOOP
    SELECT * INTO product_row FROM public.products WHERE id = (item->>'productId')::UUID;
    IF NOT FOUND THEN RAISE EXCEPTION 'Product no longer exists'; END IF;
    qty := (item->>'quantity')::INTEGER;
    chosen_size := item->>'size';
    chosen_color := item->>'color';
    IF qty IS NULL OR qty <= 0 OR (item->>'quantity')::NUMERIC <> qty THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
    IF chosen_size IS NULL OR NOT (chosen_size = ANY(CASE WHEN cardinality(product_row.sizes) > 0 THEN product_row.sizes ELSE ARRAY['Standard'] END)) THEN RAISE EXCEPTION 'Invalid size'; END IF;
    IF item->>'color' IS NULL OR NOT ((item->>'color') = ANY(CASE WHEN cardinality(product_row.colors) > 0 THEN product_row.colors ELSE ARRAY['Standard'] END)) THEN RAISE EXCEPTION 'Invalid color'; END IF;
    available := CASE WHEN product_row.variant_stock <> '{}'::JSONB THEN COALESCE((product_row.variant_stock->chosen_size->>chosen_color)::INTEGER, 0) WHEN product_row.size_stock <> '{}'::JSONB THEN COALESCE((product_row.size_stock->>chosen_size)::INTEGER, 0) ELSE product_row.stock END;
    IF available < qty OR product_row.stock < qty THEN RAISE EXCEPTION 'Insufficient stock for % (size %, color %)', product_row.name, chosen_size, chosen_color; END IF;
    UPDATE public.products SET stock = stock - qty,
      variant_stock = CASE WHEN variant_stock <> '{}'::JSONB THEN jsonb_set(variant_stock, ARRAY[chosen_size, chosen_color], to_jsonb(available - qty)) ELSE variant_stock END,
      size_stock = CASE WHEN size_stock <> '{}'::JSONB THEN jsonb_set(size_stock, ARRAY[chosen_size], to_jsonb((size_stock->>chosen_size)::INTEGER - qty)) ELSE size_stock END
      WHERE id = product_row.id;
  END LOOP;
  INSERT INTO public.orders (order_number, customer_name, customer_email, customer_phone, shipping_address, city, postal_code, total_amount, status, items, ip_address)
  VALUES (
    assigned_number,
    order_data->>'customerName', order_data->>'customerEmail', order_data->>'customerPhone', order_data->>'shippingAddress', order_data->>'city', order_data->>'postalCode', (order_data->>'totalAmount')::NUMERIC, 'Pending', order_data->'items', order_data->>'ipAddress'
  )
  RETURNING * INTO order_row;
  RETURN to_jsonb(order_row);
END;
$$;


REVOKE EXECUTE ON FUNCTION public.place_order_with_stock(JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.place_order_with_stock(JSONB) TO service_role;

ALTER TABLE public.payment_attempts ADD COLUMN IF NOT EXISTS reconcile_after TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.payment_attempts ADD COLUMN IF NOT EXISTS last_reconciled_at TIMESTAMPTZ;
ALTER TABLE public.payment_attempts ADD COLUMN IF NOT EXISTS reconcile_error TEXT;
CREATE INDEX IF NOT EXISTS payment_attempts_pending_reconcile ON public.payment_attempts (reconcile_after) WHERE order_id IS NULL;

CREATE OR REPLACE FUNCTION public.finalize_razorpay_order(gateway_order_id TEXT, gateway_payment_id TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE attempt public.payment_attempts%ROWTYPE; result JSONB;
BEGIN
  SELECT * INTO attempt FROM public.payment_attempts WHERE razorpay_order_id = gateway_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown payment order'; END IF;
  IF attempt.order_id IS NOT NULL THEN
    IF attempt.razorpay_payment_id IS DISTINCT FROM gateway_payment_id THEN RAISE EXCEPTION 'Payment mismatch'; END IF;
    SELECT to_jsonb(o) INTO result FROM public.orders o WHERE id = attempt.order_id;
    IF result IS NULL THEN RAISE EXCEPTION 'Linked order is missing'; END IF;
    RETURN result || jsonb_build_object('_created', false);
  END IF;
  SELECT to_jsonb(o) INTO result FROM public.orders o WHERE razorpay_payment_id = gateway_payment_id OR razorpay_order_id = gateway_order_id;
  IF result IS NOT NULL THEN
    IF result->>'razorpay_order_id' IS DISTINCT FROM gateway_order_id OR result->>'razorpay_payment_id' IS DISTINCT FROM gateway_payment_id THEN RAISE EXCEPTION 'Payment linkage mismatch'; END IF;
    UPDATE public.payment_attempts SET order_id = (result->>'id')::UUID, razorpay_payment_id = gateway_payment_id, reconcile_error = NULL, last_reconciled_at = now() WHERE razorpay_order_id = gateway_order_id;
    RETURN result || jsonb_build_object('_created', false);
  END IF;
  result := public.place_order_with_stock(attempt.order_data - 'orderNumber' - 'order_number');
  UPDATE public.orders SET razorpay_order_id = gateway_order_id, razorpay_payment_id = gateway_payment_id, payment_status = 'Paid' WHERE id = (result->>'id')::UUID;
  UPDATE public.payment_attempts SET order_id = (result->>'id')::UUID, razorpay_payment_id = gateway_payment_id, reconcile_error = NULL, last_reconciled_at = now() WHERE razorpay_order_id = gateway_order_id;
  SELECT to_jsonb(o) INTO result FROM public.orders o WHERE id = (result->>'id')::UUID;
  RETURN result || jsonb_build_object('_created', true);
END;
$$;
REVOKE ALL ON FUNCTION public.finalize_razorpay_order(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_razorpay_order(TEXT, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.claim_payment_reconciliation(batch_size INTEGER DEFAULT 20)
RETURNS TABLE(razorpay_order_id TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT p.razorpay_order_id FROM public.payment_attempts p
    WHERE p.order_id IS NULL AND p.reconcile_after <= now() AND p.created_at < now() - interval '1 minute'
    ORDER BY p.reconcile_after, p.created_at LIMIT LEAST(GREATEST(batch_size, 1), 20)
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.payment_attempts p SET reconcile_after = now() + interval '10 minutes', last_reconciled_at = now()
  FROM candidates c WHERE p.razorpay_order_id = c.razorpay_order_id
  RETURNING p.razorpay_order_id, p.created_at;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_payment_reconciliation(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_payment_reconciliation(INTEGER) TO service_role;
COMMIT;
NOTIFY pgrst, 'reload schema';


-- Verified Shiprocket replacements
-- No orders or Shiprocket shipments are created by this migration.
CREATE OR REPLACE FUNCTION public.begin_shiprocket_attempt(target_order_id UUID, expected_shipping JSONB, parcel_details JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE existing public.orders%ROWTYPE; next_attempt INTEGER; next_shipping JSONB; reference TEXT; prior_history JSONB;
BEGIN
  SELECT * INTO existing FROM public.orders WHERE id = target_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF existing.shiprocket IS DISTINCT FROM expected_shipping THEN RAISE EXCEPTION 'Shipment changed. Reload this order'; END IF;
  IF existing.shiprocket IS NOT NULL AND COALESCE(existing.shiprocket->>'status','') NOT IN ('Cancelled','Mismatch','Failed') THEN
    RAISE EXCEPTION 'Refresh the existing shipment before creating a replacement';
  END IF;
  IF existing.status IN ('Cancelled','Delivered','Shipped') OR existing.payment_status IS DISTINCT FROM 'Paid' THEN RAISE EXCEPTION 'Order is not eligible for a new shipment'; END IF;
  next_attempt := COALESCE((existing.shiprocket->>'attemptNumber')::INTEGER, 0) + 1;
  reference := existing.order_number || '-' || replace(existing.id::TEXT, '-', '') || '-S' || next_attempt;
  IF length(reference) > 50 THEN RAISE EXCEPTION 'Shipment reference is too long'; END IF;
  prior_history := COALESCE(existing.shiprocket->'history', '[]'::JSONB);
  IF existing.shiprocket IS NOT NULL THEN prior_history := prior_history || jsonb_build_array(existing.shiprocket - 'history'); END IF;
  next_shipping := parcel_details || jsonb_build_object('status','Creating','reference',reference,'attemptNumber',next_attempt,'requestedAt',now(),'history',prior_history);
  UPDATE public.orders SET shiprocket = next_shipping WHERE id = target_order_id;
  RETURN next_shipping;
END;
$$;
REVOKE ALL ON FUNCTION public.begin_shiprocket_attempt(UUID, JSONB, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.begin_shiprocket_attempt(UUID, JSONB, JSONB) TO service_role;
NOTIFY pgrst, 'reload schema';
