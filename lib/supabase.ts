import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://xwjenfvpmqwcikopopkm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3amVuZnZwbXF3Y2lrb3BvcGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4MDk3NTcsImV4cCI6MjA1MjM4NTc1N30.LUqClhuXV-L7u5QBL4IQVZX_DnYxXL6xZgv6q_7Y3Bs';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
