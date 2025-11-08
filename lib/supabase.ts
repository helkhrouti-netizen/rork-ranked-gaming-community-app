import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SUPABASE_URL = 'https://mcgqjqkknmojspocvvxl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jZ3FqcWtrbm1vanNwb2N2dnhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNDcyODYsImV4cCI6MjA3NjYyMzI4Nn0.8w6XKdRnusmh_DtrWHwxRlFV0LwNuC1ezxmsA-mHqVs';

console.log('🔧 Initializing Supabase client...');
console.log('📍 Platform:', Platform.OS);
console.log('📍 URL:', SUPABASE_URL);
console.log('🔑 Key length:', SUPABASE_ANON_KEY.length);

const storageAdapter = Platform.OS === 'web' 
  ? undefined
  : AsyncStorage;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storageKey: 'padel-auth-token',
  },
  global: {
    headers: {
      'X-Client-Info': 'padel-app',
    },
    fetch: (url, options = {}) => {
      console.log('🌐 Supabase fetch:', url);
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
        },
      }).catch((error) => {
        console.error('❌ Fetch error:', error.message);
        console.error('URL:', url);
        console.error('Options:', JSON.stringify(options, null, 2));
        throw error;
      });
    },
  },
  db: {
    schema: 'public',
  },
});

console.log('✅ Supabase client created successfully');
