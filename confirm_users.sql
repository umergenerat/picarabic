-- SQL Script to manually confirm all untrusted users
-- Run this in your Supabase SQL Editor to bypass "Email not confirmed" errors

UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    last_sign_in_at = COALESCE(last_sign_in_at, NOW())
WHERE email_confirmed_at IS NULL;

-- Also update existing profiles if they exist
UPDATE public.profiles
SET status = 'نشط'
WHERE status IS NULL OR status = '';
