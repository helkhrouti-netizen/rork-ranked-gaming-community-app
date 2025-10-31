import AsyncStorage from '@react-native-async-storage/async-storage';

export type BootError = {
  code: 'I18N_INIT' | 'UNKNOWN';
  message: string;
  originalError?: any;
};

export type BootStep = 'init' | 'i18n' | 'complete';

export type BootResult = {
  success: boolean;
  error?: BootError;
  step?: BootStep;
};

const LANGUAGE_KEY = '@app_language';

function normalizeError(error: any, code: BootError['code']): BootError {
  const message = error?.message || error?.toString() || 'Unknown error';
  return {
    code,
    message,
    originalError: error,
  };
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

async function bootSequence(): Promise<BootResult> {
  console.log('🚀 Starting simple boot sequence...');
  let currentStep: BootStep = 'init';

  try {
    currentStep = 'i18n';
    await initializeI18n();
    console.log('✅ i18n initialized');

    currentStep = 'complete';
    return {
      success: true,
      step: 'complete',
    };
  } catch (error: any) {
    throw { ...error, step: currentStep };
  }
}

export async function boot(): Promise<BootResult> {
  try {
    const result = await bootSequence();
    console.log('✅ Boot completed successfully');
    return result;
  } catch (error: any) {
    console.error('❌ Boot failed:', error);
    const currentStep = error?.step || 'unknown';
    
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


