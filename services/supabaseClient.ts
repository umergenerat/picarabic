
import { createClient } from '@supabase/supabase-js';

// Get environment variables or default to empty strings
// Using import.meta.env for Vite compatibility
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Initialize Supabase client only if credentials are provided.
 * If missing, we export null and handle fallbacks in services.
 */
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
