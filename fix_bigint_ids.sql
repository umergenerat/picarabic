-- Migration to fix integer overflow for teams and skills IDs
-- This script converts 'integer' columns to 'bigint' to accommodate timestamp-based IDs

BEGIN;

-- Fix teams table
ALTER TABLE teams 
  ALTER COLUMN id TYPE bigint;

-- Fix skills table
ALTER TABLE skills 
  ALTER COLUMN id TYPE bigint;

-- Fix foreign keys in completed_skills
-- (Checking if they already exist as bigint as per the original schema, but ensuring it here)
ALTER TABLE completed_skills 
  ALTER COLUMN skill_id TYPE bigint;

-- Fix progress_data if needed (though months are strings)
ALTER TABLE progress_data
  ALTER COLUMN id TYPE bigint;

-- Fix chat_messages
ALTER TABLE chat_messages
  ALTER COLUMN id TYPE bigint;

COMMIT;
