import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const getEnvVariable = (key: string): string | undefined => {
  if (Platform.OS === 'web') {
    return (window as any)[key] || process.env[key];
  }
  return process.env[key];
};

const supabaseUrl = 
  getEnvVariable('EXPO_PUBLIC_SUPABASE_URL') || 
  'https://xwjenfvpmqwcikopopkm.supabase.co';

const supabaseAnonKey = 
  getEnvVariable('EXPO_PUBLIC_SUPABASE_ANON_KEY') || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3amVuZnZwbXF3Y2lrb3BvcGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4MDk3NTcsImV4cCI6MjA1MjM4NTc1N30.LUqClhuXV-L7u5QBL4IQVZX_DnYxXL6xZgv6q_7Y3Bs';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key (first 20 chars):', supabaseAnonKey?.substring(0, 20) + '...');

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
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

console.log('Supabase client initialized successfully');
