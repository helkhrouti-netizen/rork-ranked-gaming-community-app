import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://xwjenfvpmqwcikopopkm.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3amVuZnZwbXF3Y2lrb3BvcGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NDQwNzYsImV4cCI6MjA3NjUyMDA3Nn0.2sZyn7RKC6dcdgmpIcq6KYTAWTTZ_9ajoqTcJcAFkB4';

console.log('🔧 Initializing Supabase client...');
console.log('📍 Platform:', Platform.OS);
console.log('📍 URL:', SUPABASE_URL);
console.log('🔑 Key length:', SUPABASE_ANON_KEY.length);

const storageAdapter = Platform.OS === 'web' 
  ? undefined
  : AsyncStorage;

const customFetch: typeof fetch = async (input, init?) => {
  const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : input.toString());
  const options = typeof input === 'string' ? init : { ...init };
  
  console.log('🌐 Supabase request:', options?.method || 'GET', url.includes('auth/v1') ? 'auth' : 'api');
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await globalThis.fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...options?.headers,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    console.log('✅ Supabase response:', response.status);
    return response;
  } catch (error: any) {
    console.error('❌ Supabase network error:', error.message || 'Unknown error');
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please check your internet connection');
    }
    
    if (error.message && error.message.includes('Network request failed')) {
      throw new Error('Unable to connect to the server. Please check your internet connection.');
    }
    
    throw error;
  }
};

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
    fetch: customFetch,
  },
  db: {
    schema: 'public',
  },
});

console.log('✅ Supabase client created successfully');
