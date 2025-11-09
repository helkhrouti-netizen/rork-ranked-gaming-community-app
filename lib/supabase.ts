import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ CRITICAL: Missing Supabase credentials in environment variables');
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
