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
