-- FIX TRIGGER: Ensure user metadata (role, specialization, etc.) is copied to profiles table
-- Run this in Supabase SQL Editor

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
    new.raw_user_meta_data->>'display_name', 
    new.raw_user_meta_data->>'photo_url',
    COALESCE(new.raw_user_meta_data->>'role', 'متدرب'),
    new.raw_user_meta_data->>'specialization',
    new.raw_user_meta_data->>'phone',
    COALESCE(new.raw_user_meta_data->>'status', 'نشط')
  );
  return new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
