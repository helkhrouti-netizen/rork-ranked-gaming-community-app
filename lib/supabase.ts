import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

function getSupabaseUrl(): string {
  const url = 
    Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    'https://xwjenfvpmqwcikopopkm.supabase.co';
  
  console.log('🔧 Supabase URL source:', {
    fromExtra: Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL,
    fromEnv: process.env.EXPO_PUBLIC_SUPABASE_URL,
    final: url
  });
  
  return url;
}

function getSupabaseAnonKey(): string {
  const key = 
    Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3amVuZnZwbXF3Y2lrb3BvcGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NDQwNzYsImV4cCI6MjA3NjUyMDA3Nn0.2sZyn7RKC6dcdgmpIcq6KYTAWTTZ_9ajoqTcJcAFkB4';
  
  console.log('🔧 Supabase Key source:', {
    fromExtra: !!Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    fromEnv: !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    hasKey: !!key,
    keyLength: key?.length
  });
  
  return key;
}

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ CRITICAL: Missing Supabase credentials');
  console.error('URL:', supabaseUrl);
  console.error('Key present:', !!supabaseAnonKey);
  throw new Error('Missing Supabase configuration. Please check .env file.');
}

console.log('🔧 Initializing Supabase client...');
console.log('📍 Platform:', Platform.OS);
console.log('📍 URL:', supabaseUrl);
console.log('🔑 Key present:', !!supabaseAnonKey, '(length:', supabaseAnonKey.length, ')');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storageKey: 'padel-auth-token',
  },
  global: {
    headers: {
      'X-Client-Info': 'padel-app',
    },
  },
});

console.log('✅ Supabase client created successfully');

(async () => {
  try {
    console.log('🧪 Testing Supabase connection...');
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error.message);
    } else {
      console.log('✅ Supabase connection test successful!');
      console.log('📊 Test query returned', data?.length || 0, 'rows');
    }
  } catch (err: any) {
    console.error('❌ Supabase connection error:', err.message || err);
  }
})();
