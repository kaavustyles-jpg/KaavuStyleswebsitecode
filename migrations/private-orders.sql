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
