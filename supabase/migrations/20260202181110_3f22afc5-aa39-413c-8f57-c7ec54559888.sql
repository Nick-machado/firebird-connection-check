-- Create function to check if user can view all data (admin or consultor)
CREATE OR REPLACE FUNCTION public.can_view_all_data(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'consultor')
  )
$$;

-- Create function to get user's sector (returns NULL for admin/consultor)
CREATE OR REPLACE FUNCTION public.get_user_sector(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN role IN ('gerente_varejo', 'varejo') THEN 'varejo'
    WHEN role IN ('gerente_industria', 'industria') THEN 'industria'
    WHEN role IN ('gerente_exportacao', 'exportacao') THEN 'exportacao'
    ELSE NULL
  END
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Create function to check if user is a manager
CREATE OR REPLACE FUNCTION public.is_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'gerente_varejo', 'gerente_industria', 'gerente_exportacao')
  )
$$;

-- Update trigger to use 'varejo' as default for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'varejo');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update the profile policy to include consultor
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins and consultors can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.can_view_all_data(auth.uid()));