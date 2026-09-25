import { createClient } from '@supabase/supabase-js';

// Configure via VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (see .env.example).
// Falls back to the original project so existing deployments keep syncing.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://blrlqngtohhajhluwcmp.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJscmxxbmd0b2hoYWpobHV3Y21wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0NTEyNjYsImV4cCI6MjA1MDAyNzI2Nn0.WvZ2YFt27kZOJkCpRL7IkSfrKT6YHuaelUl-lqwG3ek';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
