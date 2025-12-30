-- Fix infinite recursion on profiles table by removing recursive policies
-- Run this entire script in the Supabase SQL Editor

BEGIN;

-- 1. Drop the problematic recursive policy (FOR ALL includes SELECT)
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- 2. Drop other policies to ensure a clean slate for Admins
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- 3. Ensure the public read policy exists (No recursion here as it uses TRUE)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);

-- 4. Re-create Admin policies specifically for WRITE operations (Avoiding SELECT)
-- Note: checks is_admin() which selects from profiles. Since these are INSERT/UPDATE/DELETE,
-- they don't trigger themselves. The SELECT inside is_admin() triggers the SELECT policy above (which is safe).
CREATE POLICY "Admins can insert profiles" ON profiles FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update profiles" ON profiles FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete profiles" ON profiles FOR DELETE USING (is_admin());

-- 5. Ensure regular users can still update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

COMMIT;
