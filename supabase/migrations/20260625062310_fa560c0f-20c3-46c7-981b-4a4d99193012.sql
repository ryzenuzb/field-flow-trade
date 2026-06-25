
-- 1) chat_participants: remove self-insert policy; only SECURITY DEFINER RPCs add participants
DROP POLICY IF EXISTS "Users can add themselves to rooms" ON public.chat_participants;

-- 2) escrow_transactions: remove buyer INSERT policy; rely on service_role only
DROP POLICY IF EXISTS "System can create escrow on order" ON public.escrow_transactions;

-- 3) storage: clarify product-images public read policy
DROP POLICY IF EXISTS "Public can read product image files" ON storage.objects;
CREATE POLICY "Public can read product image files"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'product-images');

-- 4) profiles: restrict full read to owner and admins; public_profiles view remains for marketplace
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'sub_admin'::app_role)
  );
