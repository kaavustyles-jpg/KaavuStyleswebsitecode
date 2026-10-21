-- Optional database integration test. Run after reliable-order-confirmation.sql.
-- All fixture data, inventory changes and counter increments are rolled back.
BEGIN;
DO $$
DECLARE product_id UUID; first_order JSONB; repeated_order JSONB; second_order JSONB;
  first_gateway TEXT := 'test_order_' || gen_random_uuid();
  second_gateway TEXT := 'test_order_' || gen_random_uuid();
  failed_gateway TEXT := 'test_order_' || gen_random_uuid();
  payload JSONB; initial_counter BIGINT; remaining INTEGER;
BEGIN
  SELECT last_number INTO initial_counter FROM public.order_number_counter WHERE singleton;
  INSERT INTO public.products(name, price, stock, sizes, colors, size_stock, variant_stock, images)
  VALUES ('Rollback-only stock fixture', 100, 6, ARRAY['Free Size'], ARRAY['Wine Maroon', 'Blush Pink'], '{"Free Size":6}', '{"Free Size":{"Wine Maroon":4,"Blush Pink":2}}', ARRAY['/icon.jpeg']) RETURNING id INTO product_id;
  payload := jsonb_build_object('orderNumber','KAAVU00001','customerName','Test','customerEmail','test@example.com','customerPhone','9999999999','shippingAddress','Test','city','Test','postalCode','560060','totalAmount',100,'items',jsonb_build_array(jsonb_build_object('productId',product_id,'name','Test','price',100,'quantity',1,'size','Free Size','color','Wine Maroon','image','/icon.jpeg')));
  INSERT INTO public.payment_attempts(razorpay_order_id, amount, order_data) VALUES (first_gateway,10000,payload),(second_gateway,10000,payload),(failed_gateway,10000,payload);
  first_order := public.finalize_razorpay_order(first_gateway, 'payment_' || first_gateway);
  repeated_order := public.finalize_razorpay_order(first_gateway, 'payment_' || first_gateway);
  IF first_order->>'id' IS DISTINCT FROM repeated_order->>'id' THEN RAISE EXCEPTION 'Retry created a different order'; END IF;
  SELECT stock INTO remaining FROM public.products WHERE id = product_id;
  IF remaining <> 5 THEN RAISE EXCEPTION 'Retry deducted stock twice'; END IF;
  second_order := public.finalize_razorpay_order(second_gateway, 'payment_' || second_gateway);
  IF first_order->>'order_number' = second_order->>'order_number' OR second_order->>'order_number' !~ '^KAAVU[0-9]{5,}$' THEN RAISE EXCEPTION 'Invalid or duplicate order number'; END IF;
  IF (SELECT last_number FROM public.order_number_counter WHERE singleton) <> initial_counter + 2 THEN RAISE EXCEPTION 'Incorrect counter advance'; END IF;
  UPDATE public.products SET stock = 0 WHERE id = product_id;
  BEGIN
    PERFORM public.finalize_razorpay_order(failed_gateway, 'payment_' || failed_gateway);
    RAISE EXCEPTION 'Expected insufficient stock' USING ERRCODE = 'Z0001';
  EXCEPTION WHEN SQLSTATE 'Z0001' THEN RAISE;
    WHEN OTHERS THEN
      IF SQLERRM NOT LIKE 'Insufficient stock%' THEN RAISE; END IF;
  END;
  IF (SELECT last_number FROM public.order_number_counter WHERE singleton) <> initial_counter + 2 THEN RAISE EXCEPTION 'Failed transaction consumed a number'; END IF;
  IF (SELECT order_id FROM public.payment_attempts WHERE razorpay_order_id = failed_gateway) IS NOT NULL THEN RAISE EXCEPTION 'Failed order linked'; END IF;
  RAISE NOTICE 'Order numbering, repeated confirmation and rollback checks passed';
END;
$$;
ROLLBACK;
