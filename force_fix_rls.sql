-- FORCE FIX: Remove ALL policies on existing 'profiles' table to ensure no recursion remains.
-- Use this if specific DROP POLICY commands failed due to name mismatches.

DO $$
DECLARE
    pol record;
BEGIN
    -- Loop through all existing policies on 'profiles' and drop them one by one
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
    END LOOP;
END $$;

-- Enable RLS just in case
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Access (Safe, no recursion)
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

-- 2. User Self-Update (Safe, compares UUIDs)
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- 3. Admin Permissions - WRITE ONLY
-- Critical: These apply ONLY to Insert, Update, Delete. 
-- They use is_admin() which performs a SELECT.
-- The SELECT inside is_admin() will trigger the "Public profiles..." policy (true), NOT these policies.
-- This breaks the recursion loop.

CREATE POLICY "Admins can insert profiles" 
ON profiles FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Admins can update profiles" 
ON profiles FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can delete profiles" 
ON profiles FOR DELETE 
USING (is_admin());

-- Ensure is_admin is secure
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'مدير'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
