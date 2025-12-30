-- FIX SCHEMA CACHE ERROR
-- Run this script in the Supabase SQL Editor

-- 1. Ensure the column exists (Idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='display_name') THEN
        ALTER TABLE profiles ADD COLUMN display_name text;
    END IF;
END $$;

-- 2. Force PostgREST to reload the schema cache
-- This is critical after schema changes or when you see "Could not find column... in schema cache"
NOTIFY pgrst, 'reload config';

-- 3. Verify the column is visible to the current role (just a check, results appear in "Results" tab)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';
