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
