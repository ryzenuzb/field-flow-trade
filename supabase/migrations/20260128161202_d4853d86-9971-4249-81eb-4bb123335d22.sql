-- Add sub_admin role to the enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sub_admin';

-- Create function to check if user is main admin (the first admin or specific email)
CREATE OR REPLACE FUNCTION public.is_main_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE p.user_id = _user_id
      AND ur.role = 'admin'
      AND p.email = 'admin@gmail.com'
  )
$$;

-- Create function to assign sub_admin role (only main admin can do this)
CREATE OR REPLACE FUNCTION public.assign_sub_admin_role(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is main admin
  IF NOT is_main_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only main admin can assign sub-admin role';
  END IF;
  
  -- Insert sub_admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'sub_admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Create function to remove sub_admin role
CREATE OR REPLACE FUNCTION public.remove_sub_admin_role(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is main admin
  IF NOT is_main_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only main admin can remove sub-admin role';
  END IF;
  
  -- Remove sub_admin role
  DELETE FROM public.user_roles
  WHERE user_id = target_user_id AND role = 'sub_admin';
END;
$$;