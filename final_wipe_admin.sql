-- FINAL WIPE FOR ADMIN RECOVERY
-- Run this to clear the path for the frontend "Initialize Admin" feature

-- 1. Delete from profiles (public)
DELETE FROM public.profiles WHERE email = 'aitloutouaom@gmail.com';

-- 2. Delete from auth.users (auth)
DELETE FROM auth.users WHERE email = 'aitloutouaom@gmail.com';

-- Now the email is "free" to be used by the official signUp method.
