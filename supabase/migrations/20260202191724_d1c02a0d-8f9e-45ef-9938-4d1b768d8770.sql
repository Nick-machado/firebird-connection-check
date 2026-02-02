-- Add new role to enum (this needs to be committed first)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sem_acesso';