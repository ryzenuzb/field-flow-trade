INSERT INTO storage.buckets (id, name, public) VALUES ('soil-documents', 'soil-documents', false);

CREATE POLICY "Admins can upload soil documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'soil-documents' AND (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR 
    public.has_role(auth.uid(), 'sub_admin'::public.app_role)
  )
);

CREATE POLICY "Admins can view all soil documents" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'soil-documents' AND (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR 
    public.has_role(auth.uid(), 'sub_admin'::public.app_role)
  )
);

CREATE POLICY "Farmers can view own soil documents" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'soil-documents' AND (
    (storage.foldername(name))[1] = auth.uid()::text
  )
);