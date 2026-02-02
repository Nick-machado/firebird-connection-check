-- Update the trigger function to assign 'sem_acesso' to new users
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'sem_acesso');
  RETURN NEW;
END;
$$;

-- Create function to check if user has any access
CREATE OR REPLACE FUNCTION public.has_any_access(_user_id uuid)
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
      AND role != 'sem_acesso'
  )
$$;