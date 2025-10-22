import { useState, useEffect, useCallback, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';
import { supabaseProfileService } from '@/services/supabaseProfile';
import { Profile } from '@/services/profile';

const [SupabaseAuthProviderInternal, useSupabaseAuthInternal] = createContextHook(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);

  const loadProfile = useCallback(async () => {
    try {
      const userProfile = await supabaseProfileService.getProfile();
      setProfile(userProfile);
      
      if (userProfile) {
        const onboardingComplete = await supabaseProfileService.isOnboardingComplete();
        setIsOnboarded(onboardingComplete);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile();
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile();
      } else {
        setProfile(null);
        setIsOnboarded(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signup = useCallback(async (email: string, password: string, username?: string, phone?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      console.log('📦 Updating profile in database for user:', data.user.id);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { error: profileError } = await supabase
        .from('PROFILES')
        .update({
          username: username || email.split('@')[0],
          onboarding_completed: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.user.id);

      if (profileError) {
        console.error('❌ Error updating profile:', JSON.stringify(profileError, null, 2));
        throw new Error(`Failed to create user profile: ${profileError.message || JSON.stringify(profileError)}`);
      }
      console.log('✅ Profile updated successfully');
    }

    return data;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data;
  }, []);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    setProfile(null);
    setIsOnboarded(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  const refreshOnboardingStatus = useCallback(async () => {
    const onboardingComplete = await supabaseProfileService.isOnboardingComplete();
    setIsOnboarded(onboardingComplete);
    console.log('🔄 Onboarding status refreshed:', onboardingComplete);
  }, []);

  return useMemo(
    () => ({
      session,
      user,
      profile,
      isLoading,
      isAuthenticated: !!session,
      isOnboarded,
      signup,
      login,
      logout,
      refreshProfile,
      refreshOnboardingStatus,
    }),
    [session, user, profile, isLoading, isOnboarded, signup, login, logout, refreshProfile, refreshOnboardingStatus]
  );
});

export const SupabaseAuthProvider = SupabaseAuthProviderInternal;

export const useSupabaseAuth = () => {
  const context = useSupabaseAuthInternal();
  if (!context) {
    throw new Error('useSupabaseAuth must be used within SupabaseAuthProvider');
  }
  return context;
};
