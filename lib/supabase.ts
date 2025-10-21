import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mcgqjqkknmojspocvvxl.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jZ3FqcWtrbm1vanNwb2N2dnhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNDcyODYsImV4cCI6MjA3NjYyMzI4Nn0.8w6XKdRnusmh_DtrWHwxRlFV0LwNuC1ezxmsA-mHqVs';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
