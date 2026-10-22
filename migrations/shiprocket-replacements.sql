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
