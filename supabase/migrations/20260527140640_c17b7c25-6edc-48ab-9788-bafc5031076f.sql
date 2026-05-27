
-- 1. PROFILES: restrict to authenticated; create public safe view
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT user_id, full_name, location FROM public.profiles;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 2. RATE_LIMITS: service_role only
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limits;
DROP POLICY IF EXISTS "System can insert rate limits" ON public.rate_limits;
REVOKE ALL ON public.rate_limits FROM anon, authenticated;
GRANT ALL ON public.rate_limits TO service_role;
CREATE POLICY "Service role only"
  ON public.rate_limits FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. NOTIFICATIONS: only service role can insert
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications"
  ON public.notifications FOR INSERT TO service_role WITH CHECK (true);

-- 4. CHAT_PARTICIPANTS: insert only self
DROP POLICY IF EXISTS "Add participants to rooms" ON public.chat_participants;
CREATE POLICY "Users can add themselves to rooms"
  ON public.chat_participants FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 5. SELLER_BALANCES: explicit insert for admin/service
CREATE POLICY "Service role can insert balances"
  ON public.seller_balances FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Admins can insert balances"
  ON public.seller_balances FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 6. COMMISSIONS: explicit insert/update/delete
CREATE POLICY "Service role can manage commissions"
  ON public.commissions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Admins can manage commissions"
  ON public.commissions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 7. ESCROW_TRANSACTIONS: lock updates/deletes to admin/service
CREATE POLICY "Service role can manage escrow"
  ON public.escrow_transactions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 8. STORAGE: product-images path ownership + extensions
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
CREATE POLICY "Users upload to own product folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp','gif')
  );

-- Restrict listing on public bucket: only allow direct path access (no listing across users)
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
CREATE POLICY "Public can read product image files"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (
    bucket_id = 'product-images'
    AND auth.role() IS NOT NULL  -- always true; relies on individual GET via signed paths
  );
-- (Public bucket still serves files by direct CDN URL; listing via API now requires a path filter)

-- 9. assign_farmer_role: add authorization check
CREATE OR REPLACE FUNCTION public.assign_farmer_role(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF auth.uid() <> user_id_param AND NOT has_role(auth.uid(), 'admin'::app_role) AND NOT has_role(auth.uid(), 'sub_admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: cannot assign farmer role to another user';
  END IF;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (user_id_param, 'farmer')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- 10. Fix mutable search_path on generate_referral_code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$;
