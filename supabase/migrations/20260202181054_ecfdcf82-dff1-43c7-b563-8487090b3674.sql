-- Add new values to existing enum (must be separate statements)
ALTER TYPE public.app_role ADD VALUE 'consultor';
ALTER TYPE public.app_role ADD VALUE 'gerente_varejo';
ALTER TYPE public.app_role ADD VALUE 'varejo';
ALTER TYPE public.app_role ADD VALUE 'gerente_industria';
ALTER TYPE public.app_role ADD VALUE 'industria';
ALTER TYPE public.app_role ADD VALUE 'gerente_exportacao';
ALTER TYPE public.app_role ADD VALUE 'exportacao';