-- Create a secure function to assign farmer role during signup
CREATE OR REPLACE FUNCTION public.assign_farmer_role(user_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (user_id_param, 'farmer')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.assign_farmer_role(UUID) TO authenticated;