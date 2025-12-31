-- DIAGNOSTIC SCRIPT
-- Run this in Supabase SQL Editor to see exactly what is happening

SELECT 
    u.id, 
    u.email, 
    u.email_confirmed_at, 
    u.confirmed_at, 
    u.last_sign_in_at,
    u.raw_app_meta_data->>'provider' as provider,
    u.aud,
    u.role as auth_role,
    p.role as profile_role,
    p.status as profile_status,
    p.display_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'aitloutouaom@gmail.com';

-- This will tell us:
-- 1. If the user exists (should see 1 row)
-- 2. If it is confirmed (email_confirmed_at should not be null)
-- 3. If the role is 'authenticated' (auth_role)
-- 4. If the profile role is 'مدير' (profile_role)
