import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const getEnvVariable = (key: string): string | undefined => {
  if (Platform.OS === 'web') {
    return (window as any)[key] || process.env[key];
  }
  return process.env[key];
};

const getSupabaseUrl = (): string => {
  const url = getEnvVariable('EXPO_PUBLIC_SUPABASE_URL');
  
  if (!url) {
    throw new Error(
      'Missing EXPO_PUBLIC_SUPABASE_URL environment variable. Please set it in your .env file.'
    );
  }
  
  return url;
};

const getSupabaseAnonKey = (): string => {
  const key = getEnvVariable('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  
  if (!key) {
    throw new Error(
      'Missing EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable. Please set it in your .env file.'
    );
  }
  
  return key;
}

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key (first 20 chars):', supabaseAnonKey?.substring(0, 20) + '...');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const getSupabaseConfig = () => ({
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  environment: process.env.NODE_ENV || 'development',
});

console.log('Supabase client initialized successfully');
