-- Allow farmers to delete their own products
CREATE POLICY "Farmers can delete own products"
ON public.products
FOR DELETE
TO authenticated
USING (auth.uid() = seller_id);