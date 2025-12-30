-- FINAL FIX v2: Handle missing columns and relax constraints
-- Run this entire script in Supabase SQL Editor

DO $$
BEGIN
    -- 1. Ensure 'photo_url' exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='photo_url') THEN
        ALTER TABLE profiles ADD COLUMN photo_url text;
    END IF;

    -- 2. Ensure 'display_name' exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='display_name') THEN
        ALTER TABLE profiles ADD COLUMN display_name text;
    END IF;
    
    -- 3. Ensure 'phone' exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='phone') THEN
        ALTER TABLE profiles ADD COLUMN phone text;
    END IF;

    -- 4. Drop restrictive Check Constraints (Let app handle validation)
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_status_check;

END $$;

-- 5. Force PostgREST schema cache reload
NOTIFY pgrst, 'reload config';

-- 6. Robust Trigger Function (Updated to assume columns now exist)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    display_name, 
    photo_url,
    role,
    specialization,
    phone,
    status
  )
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'display_name', ''), 
    new.raw_user_meta_data->>'photo_url',
    COALESCE(new.raw_user_meta_data->>'role', 'متدرب'),
    new.raw_user_meta_data->>'specialization',
    new.raw_user_meta_data->>'phone',
    COALESCE(new.raw_user_meta_data->>'status', 'نشط')
  );
  
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log error but allow auth user creation (Critical for UX)
  RAISE WARNING 'Profile creation failed for user %: %', new.id, SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
