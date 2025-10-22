-- Fix RLS policy on profiles table to restrict access
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

CREATE POLICY "Users can view own profile and admins can view all"
ON public.profiles
FOR SELECT
TO authenticated
USING ((auth.uid() = id) OR has_role(auth.uid(), 'admin'::app_role));