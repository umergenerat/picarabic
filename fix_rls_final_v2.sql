-- Comprehensive RLS Fix for Profiles Table
-- Run this in the Supabase SQL Editor

-- 1. Reset: Drop all existing policies to avoid conflicts
-- We use a DO block to drop all policies dynamically to be thorough
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
    END LOOP;
END $$;

-- 2. Secure Admin Function
-- SECURITY DEFINER: Runs with privileges of the creator (admin), bypassing RLS
-- This prevents infinite recursion when RLS checks the 'profiles' table to see if user is admin
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

-- 3. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Define Policies

-- A. PUBLIC READ: Everyone can read basic profile info
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

-- B. USER SELF-SERVICE:
-- Users can INSERT their own profile during sign-up
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Users can UPDATE their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- C. ADMIN ACCESS:
-- Admins can do ANYTHING

CREATE POLICY "Admins can insert profiles"
ON profiles FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update profiles"
ON profiles FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete profiles"
ON profiles FOR DELETE
USING (is_admin());
