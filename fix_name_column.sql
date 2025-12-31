-- SQL Fix for missing 'name' column and NOT NULL constraint error
-- Run this in your Supabase SQL Editor

DO $$
BEGIN
    -- 1. Ensure 'name' column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='name') THEN
        ALTER TABLE profiles ADD COLUMN name text;
    END IF;

    -- 2. Synchronize data: populate 'name' from 'display_name' where it's missing
    UPDATE profiles SET name = display_name WHERE name IS NULL OR name = '';

    -- 3. If there's still a NOT NULL constraint, and some values are null, 
    -- we might need to satisfy it with a default or the email.
    -- (Only run if you want to make it strictly NOT NULL later)
    -- UPDATE profiles SET name = split_part(email, '@', 1) WHERE name IS NULL OR name = '';

END $$;

-- 4. Update the Trigger Function to populate both 'name' and 'display_name'
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    name,
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
    COALESCE(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'photo_url',
    COALESCE(new.raw_user_meta_data->>'role', 'متدرب'),
    new.raw_user_meta_data->>'specialization',
    new.raw_user_meta_data->>'phone',
    COALESCE(new.raw_user_meta_data->>'status', 'نشط')
  );
  
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Profile creation failed for user %: %', new.id, SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
