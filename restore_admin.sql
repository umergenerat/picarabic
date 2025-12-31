-- SQL Script to Restore Admin Profile
-- Run this in your Supabase SQL Editor if the admin cannot login or see the admin page

DO $$
DECLARE
    admin_id uuid;
    admin_email text := 'aitloutouaom@gmail.com';
BEGIN
    -- 1. Find the admin user ID from auth.users
    SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;

    IF admin_id IS NOT NULL THEN
        -- 2. Force confirm in auth.users
        UPDATE auth.users 
        SET email_confirmed_at = NOW(), 
            confirmed_at = NOW()
        WHERE id = admin_id;

        -- 3. Ensure profile exists and has 'مدير' role
        INSERT INTO public.profiles (id, email, name, display_name, role, status)
        VALUES (admin_id, admin_email, 'المدير', 'المدير', 'مدير', 'نشط')
        ON CONFLICT (id) DO UPDATE 
        SET role = 'مدير', 
            status = 'نشط',
            email = admin_email;
            
        RAISE NOTICE 'Admin profile restored and confirmed for user %', admin_email;
    ELSE
        RAISE WARNING 'User with email % not found in auth.users. Please sign up first.', admin_email;
    END IF;
END $$;
