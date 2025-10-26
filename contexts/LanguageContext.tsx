import { useState, useEffect, useMemo, useCallback } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '@/constants/translations';

export type Language = 'fr' | 'en';

const LANGUAGE_KEY = '@app_language';

export const [LanguageProvider, useLanguage] = createContextHook(() => {
  const [language, setLanguage] = useState<Language>('fr');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadLanguage = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (stored === 'fr' || stored === 'en') {
        setLanguage(stored);
      }
    } catch (error) {
      console.error('Failed to load language:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLanguage();
  }, [loadLanguage]);

  const changeLanguage = useCallback(async (newLanguage: Language) => {
    try {
      setLanguage(newLanguage);
      await AsyncStorage.setItem(LANGUAGE_KEY, newLanguage);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  }, []);

  const t = useCallback((key: string) => {
    const keys = key.split('.');
    let value: any = translations[language];
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }
    return typeof value === 'string' ? value : key;
  }, [language]);

  return useMemo(() => ({
    language,
    setLanguage: changeLanguage,
    isLoading,
    t,
  }), [language, changeLanguage, isLoading, t]);
});
