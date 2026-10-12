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
