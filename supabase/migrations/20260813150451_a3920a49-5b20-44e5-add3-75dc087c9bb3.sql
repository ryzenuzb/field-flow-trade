DROP POLICY IF EXISTS "Anyone can view active payment settings" ON public.payment_settings;

CREATE POLICY "Authenticated users can view active payment settings"
ON public.payment_settings
FOR SELECT
TO authenticated
USING (is_active = true);

REVOKE ALL ON public.payment_settings FROM anon;
GRANT SELECT ON public.payment_settings TO authenticated;
GRANT ALL ON public.payment_settings TO service_role;