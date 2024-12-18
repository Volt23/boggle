import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://blrlqngtohhajhluwcmp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJscmxxbmd0b2hoYWpobHV3Y21wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0NTEyNjYsImV4cCI6MjA1MDAyNzI2Nn0.WvZ2YFt27kZOJkCpRL7IkSfrKT6YHuaelUl-lqwG3ek';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);