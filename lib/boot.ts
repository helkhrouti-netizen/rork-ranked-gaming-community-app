import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import Constants from 'expo-constants';


export type BootError = {
  code: 'BOOT_TIMEOUT' | 'DB_HEALTH' | 'RLS_AUTH' | 'I18N_INIT' | 'NETWORK_OFFLINE' | 'CONFIG_ERROR' | 'SESSION_ERROR' | 'PROFILE_ERROR' | 'UNKNOWN';
  message: string;
  originalError?: any;
};

export type BootStep = 'init' | 'network' | 'config' | 'i18n' | 'session' | 'profile' | 'complete';

export type BootResult = {
  success: boolean;
  error?: BootError;
  step?: BootStep;
  session?: any;
  userId?: string;
  isOnboarded?: boolean;
};

const LANGUAGE_KEY = '@app_language';
const BOOT_TIMEOUT = 8000;

function normalizeError(error: any, code: BootError['code']): BootError {
  const message = error?.message || error?.toString() || 'Unknown error';
  return {
    code,
    message,
    originalError: error,
  };
}

async function checkNetworkConnection(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected ?? true;
  } catch (error) {
    console.warn('⚠️ Network check failed:', error);
    return true;
  }
}

async function validateSupabaseConfig(): Promise<void> {
  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mcgqjqkknmojspocvvxl.supabase.co';
  const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jZ3FqcWtrbm1vanNwb2N2dnhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNDcyODYsImV4cCI6MjA3NjYyMzI4Nn0.8w6XKdRnusmh_DtrWHwxRlFV0LwNuC1ezxmsA-mHqVs';

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  }

  if (!supabaseUrl.includes('.supabase.co')) {
    throw new Error('Invalid SUPABASE_URL (must end with .supabase.co)');
  }

  if (supabaseAnonKey.length < 100) {
    throw new Error('Invalid SUPABASE_ANON_KEY (too short)');
  }
}

async function healthCheckSupabase(): Promise<void> {
  try {
    console.log('🔍 Starting Supabase health check...');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .abortSignal(controller.signal);

    clearTimeout(timeout);

    if (error) {
      console.error('❌ Supabase health check failed:', error);
      throw error;
    }
    console.log('✅ Supabase health check passed');
  } catch (error: any) {
    console.error('❌ Health check error:', error);
    if (error?.code === '401' || error?.status === 401) {
      throw normalizeError(error, 'RLS_AUTH');
    }
    throw normalizeError(error, 'DB_HEALTH');
  }
}

async function initializeI18n(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (stored && (stored === 'fr' || stored === 'en')) {
      console.log('✅ Language initialized:', stored);
    } else {
      await AsyncStorage.setItem(LANGUAGE_KEY, 'fr');
      console.log('✅ Default language set: fr');
    }
  } catch (error) {
    console.error('❌ i18n initialization failed:', error);
    throw normalizeError(error, 'I18N_INIT');
  }
}

async function getSession() {
  try {
    console.log('🔑 Getting session...');
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('❌ Session error:', error);
      throw normalizeError(error, 'SESSION_ERROR');
    }

    console.log('🔑 Session result:', session ? 'has session' : 'no session');
    return session;
  } catch (error: any) {
    console.error('❌ getSession error:', error);
    if (error?.code === '401' || error?.status === 401 || error?.message?.includes('Unauthorized')) {
      throw normalizeError(error, 'RLS_AUTH');
    }
    throw normalizeError(error, 'SESSION_ERROR');
  }
}

async function loadUserProfile(userId: string): Promise<{ isOnboarded: boolean }> {
  try {
    console.log('🔍 Loading user profile for ID:', userId);
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, username, level_tier, rank_division, level_score, rank_points')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === '401' || error.code === '403') {
        throw normalizeError(error, 'RLS_AUTH');
      }
      if (error.code === 'PGRST116') {
        console.log('⚠️ Profile not found, creating...');
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: '',
            username: '',
            level_score: 0,
            level_tier: 'Cuivre',
            rank_division: 'Cuivre',
            rank_sub: 1,
          });

        if (insertError) {
          console.error('❌ Failed to create profile:', insertError);
          throw normalizeError(insertError, 'PROFILE_ERROR');
        }

        return { isOnboarded: false };
      }
      throw normalizeError(error, 'PROFILE_ERROR');
    }

    if (!profile) {
      return { isOnboarded: false };
    }

    const isOnboarded = !!profile.username && (profile.level_score || profile.rank_points || 0) > 0;
    console.log('✅ User profile loaded:', {
      username: profile.username || '(empty)',
      tier: profile.level_tier,
      score: profile.level_score,
      isOnboarded,
    });

    return { isOnboarded };
  } catch (error: any) {
    if (error?.code === 'RLS_AUTH') {
      throw error;
    }
    throw normalizeError(error, 'PROFILE_ERROR');
  }
}

async function bootSequence(): Promise<BootResult> {
  console.log('🚀 Starting boot sequence...');
  let currentStep: BootStep = 'init';

  try {
    currentStep = 'network';
    const isOnline = await checkNetworkConnection();
    if (!isOnline) {
      return {
        success: false,
        error: {
          code: 'NETWORK_OFFLINE',
          message: "You're offline. Please check your internet connection.",
        },
        step: currentStep,
      };
    }
    console.log('✅ Network check passed');

    currentStep = 'config';
    await validateSupabaseConfig();
    console.log('✅ Config validation passed');

    currentStep = 'config';
    await healthCheckSupabase();
    console.log('✅ Database health check passed');

    currentStep = 'i18n';
    await initializeI18n();
    console.log('✅ i18n initialized');

    currentStep = 'session';
    const session = await getSession();
    console.log('✅ Session loaded:', session ? 'authenticated' : 'not authenticated');

    if (!session) {
      return {
        success: true,
        step: 'complete',
        session: null,
      };
    }

    currentStep = 'profile';
    const { isOnboarded } = await loadUserProfile(session.user.id);
    console.log('✅ Profile loaded, onboarded:', isOnboarded);

    currentStep = 'complete';
    return {
      success: true,
      step: 'complete',
      session,
      userId: session.user.id,
      isOnboarded,
    };
  } catch (error: any) {
    throw { ...error, step: currentStep };
  }
}

export async function boot(): Promise<BootResult> {
  let currentStep: BootStep = 'init';
  
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => {
      const timeoutError = normalizeError(
        new Error(`Boot timeout after 8 seconds at step: ${currentStep}`),
        'BOOT_TIMEOUT'
      );
      reject({ ...timeoutError, step: currentStep });
    }, BOOT_TIMEOUT);
  });

  try {
    const result = await Promise.race([bootSequence(), timeout]);
    console.log('✅ Boot completed successfully');
    return result;
  } catch (error: any) {
    console.error('❌ Boot failed:', error);
    currentStep = error?.step || 'unknown';
    
    if (error?.code) {
      return {
        success: false,
        error: error as BootError,
        step: currentStep,
      };
    }

    return {
      success: false,
      error: normalizeError(error, 'UNKNOWN'),
      step: currentStep,
    };
  }
}

export function getBootErrorMessage(error: BootError, language: 'en' | 'fr' = 'fr'): string {
  const messages: Record<BootError['code'], { en: string; fr: string }> = {
    BOOT_TIMEOUT: {
      en: 'App startup timeout. Please retry.',
      fr: "Délai d'attente de démarrage. Veuillez réessayer.",
    },
    DB_HEALTH: {
      en: 'Database connection failed. Please check your internet.',
      fr: 'Connexion à la base de données échouée. Vérifiez votre connexion.',
    },
    RLS_AUTH: {
      en: 'Access denied. You may be logged out. Please sign in again.',
      fr: "Accès refusé. Vous êtes peut-être déconnecté. Veuillez vous reconnecter.",
    },
    I18N_INIT: {
      en: 'Language pack failed to load. Please retry.',
      fr: 'Échec du chargement de la langue. Veuillez réessayer.',
    },
    NETWORK_OFFLINE: {
      en: "You're offline. Please check your internet connection.",
      fr: 'Vous êtes hors ligne. Vérifiez votre connexion Internet.',
    },
    CONFIG_ERROR: {
      en: 'Configuration error. Please contact support.',
      fr: 'Erreur de configuration. Veuillez contacter le support.',
    },
    SESSION_ERROR: {
      en: 'Session error. Please try logging in again.',
      fr: 'Erreur de session. Veuillez vous reconnecter.',
    },
    PROFILE_ERROR: {
      en: 'Failed to load profile. Please retry.',
      fr: 'Échec du chargement du profil. Veuillez réessayer.',
    },
    UNKNOWN: {
      en: 'An unexpected error occurred. Please retry.',
      fr: 'Une erreur inattendue est survenue. Veuillez réessayer.',
    },
  };

  return messages[error.code]?.[language] || error.message;
}
