-- EMERGENCY ADMIN RESET & RECOVERY
-- Run this in Supabase SQL Editor to force-reset or CREATE your admin account

-- 1. Ensure cryptography is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    admin_id uuid;
    admin_email text := 'aitloutouaom@gmail.com';
    new_password text := 'PicaAdmin2025'; 
BEGIN
    -- 2. Check if user exists
    SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;

    IF admin_id IS NULL THEN
        -- 3. CREATE USER if missing
        admin_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            aud,
            role
        ) VALUES (
            admin_id,
            '00000000-0000-0000-0000-000000000000',
            admin_email,
            crypt(new_password, gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"display_name":"المدير","role":"مدير"}',
            'authenticated',
            'authenticated'
        );
        RAISE NOTICE 'USER CREATED: Account % has been created.', admin_email;
    ELSE
        -- 4. RESET PASSWORD if exists
        UPDATE auth.users 
        SET encrypted_password = crypt(new_password, gen_salt('bf')),
            email_confirmed_at = NOW(),
            last_sign_in_at = NULL 
        WHERE id = admin_id;
        RAISE NOTICE 'PASSWORD RESET: Account % password updated.', admin_email;
    END IF;

    -- 5. ENSURE ADMIN PROFILE & ROLE
    INSERT INTO public.profiles (id, email, name, display_name, role, status, must_change_password)
    VALUES (admin_id, admin_email, 'عمر أيت لوتو', 'المدير', 'مدير', 'نشط', true)
    ON CONFLICT (id) DO UPDATE 
    SET role = 'مدير', 
        status = 'نشط',
        must_change_password = true;

    RAISE NOTICE 'FINAL SUCCESS: Login with % and password: %', admin_email, new_password;
END $$;
