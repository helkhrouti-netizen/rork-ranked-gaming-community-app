import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { Player } from '@/lib/api';
import { getRankFromPoints } from '@/constants/ranks';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';



export interface AuthUser {
  id: string;
  email: string;
  username: string;
  level_score: number;
  level_tier: string;
  isGuest?: boolean;
}

const [AuthProviderInternal, useAuthInternal] = createContextHook(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [isGuest, setIsGuest] = useState<boolean>(false);

  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      console.log('🔍 Loading user profile for ID:', userId);
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile load timeout')), 10000);
      });
      
      const profilePromise = supabase
        .from('public_profiles')
        .select('id, email, username, level_tier, rank_division, level_score, rank_points, wins, losses, reputation, city, phone_number, profile_picture')
        .eq('id', userId)
        .single();
      
      const { data: profile, error } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]) as any;

      if (error) {
        console.error('❌ Supabase error loading profile:', JSON.stringify(error, null, 2));
        throw new Error(error.message || 'Failed to load user profile');
      }

      if (profile) {
        const authUser: AuthUser = {
          id: profile.id,
          email: profile.email,
          username: profile.username || '',
          level_score: profile.level_score || profile.rank_points || 0,
          level_tier: profile.level_tier || profile.rank_division || 'Cuivre',
        };
        const onboarded = !!profile.username && (profile.level_score || profile.rank_points || 0) > 0;
        setUser(authUser);
        setIsOnboarded(onboarded);
        console.log('✅ User profile loaded:', {
          username: authUser.username || '(empty)',
          tier: authUser.level_tier,
          score: authUser.level_score,
          isOnboarded: onboarded
        });
        return authUser;
      }
      return null;
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      console.error('❌ Error loading user profile:', errorMessage);
      throw new Error(`Failed to load profile: ${errorMessage}`);
    }
  }, []);

  const clearAuth = useCallback(async () => {
    try {
      setSession(null);
      setUser(null);
      setIsOnboarded(false);
      setIsGuest(false);
      console.log('🗑️ Auth cleared');
    } catch (error) {
      console.error('Failed to clear auth:', error);
    }
  }, []);

  const loadAuth = useCallback(async () => {
    try {
      console.log('🔧 Loading auth session');
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Auth session timeout')), 10000);
      });
      
      const sessionPromise = supabase.auth.getSession();
      
      const { data: { session: currentSession }, error } = await Promise.race([
        sessionPromise,
        timeoutPromise
      ]) as any;

      if (error) {
        console.error('Session error:', error);
        await clearAuth();
        return;
      }

      if (currentSession?.user) {
        setSession(currentSession);
        await loadUserProfile(currentSession.user.id);
        console.log('✅ Auth session loaded successfully');
      } else {
        await clearAuth();
      }
    } catch (error: any) {
      console.error('❌ Failed to load auth:', error?.message || error);
      await clearAuth();
    } finally {
      console.log('✅ Setting isLoading to false');
      setIsLoading(false);
    }
  }, [clearAuth, loadUserProfile]);

  const initializedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      if (initializedRef.current) return;
      initializedRef.current = true;
      
      try {
        console.log('🔧 Initializing auth...');
        await loadAuth();
      } catch (error) {
        console.error('❌ Auth initialization failed:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      
      console.log('🔐 Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && newSession?.user) {
        setSession(newSession);
        await loadUserProfile(newSession.user.id);
      } else if (event === 'SIGNED_OUT') {
        await clearAuth();
      } else if (event === 'TOKEN_REFRESHED' && newSession) {
        setSession(newSession);
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [loadAuth, loadUserProfile, clearAuth]);

  const signup = useCallback(async (
    email: string,
    password: string,
    username: string,
    phoneNumber?: string
  ) => {
    try {
      console.log('🔧 Starting signup with Supabase');
      console.log('📧 Email:', email);
      console.log('👤 Username:', username);
      console.log('📞 Phone:', phoneNumber || 'none');
      
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
          data: {
            username,
            phone_number: phoneNumber,
          },
        },
      });

      console.log('📥 Signup response received');
      
      if (signUpError) {
        console.error('❌ Supabase signup error:', signUpError.message);
        
        if (signUpError.message.includes('rate limit')) {
          throw new Error('Too many signup attempts. Please try again in a few minutes or use login if you already have an account.');
        }
        
        if (signUpError.message.includes('Network') || signUpError.message.includes('fetch')) {
          throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
        }
        
        if (signUpError.message.includes('Invalid API')) {
          throw new Error('Server configuration error. Please contact support.');
        }
        
        if (signUpError.message.includes('already registered')) {
          throw new Error('This email is already registered. Please use login instead.');
        }
        
        throw new Error(signUpError.message || 'Failed to create account');
      }
      
      if (!authData.user) {
        console.error('❌ No user data returned from signup');
        throw new Error('Failed to create user');
      }

      const { error: profileError } = await supabase
        .from('public_profiles')
        .update({
          username,
          phone_number: phoneNumber,
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.warn('Profile update error:', profileError);
      }

      const authUser: AuthUser = {
        id: authData.user.id,
        email: authData.user.email!,
        username,
        level_score: 0,
        level_tier: 'Cuivre',
      };

      setSession(authData.session);
      setUser(authUser);
      setIsOnboarded(false);
      
      console.log('✅ Signup successful:', email);
      return { user: authUser };
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      console.error('❌ Signup error:', errorMessage);
      throw new Error(`Signup failed: ${errorMessage}`);
    }
  }, []);

  const login = useCallback(async (
    email: string,
    password: string
  ) => {
    try {
      console.log('🔧 Login with Supabase');
      
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      if (!authData.user || !authData.session) throw new Error('Failed to sign in');

      setSession(authData.session);
      const authUser = await loadUserProfile(authData.user.id);
      
      if (!authUser) throw new Error('Failed to load user profile');
      
      console.log('✅ Login successful:', email);
      return { user: authUser };
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      console.error('❌ Login error:', errorMessage);
      throw new Error(`Login failed: ${errorMessage}`);
    }
  }, [loadUserProfile]);

  const logout = useCallback(async () => {
    try {
      if (!isGuest) {
        await supabase.auth.signOut();
      }
      await clearAuth();
      console.log('✅ Logged out');
    } catch (error) {
      console.error('Logout error:', error);
      await clearAuth();
    }
  }, [clearAuth, isGuest]);

  const continueAsGuest = useCallback(async () => {
    try {
      console.log('👤 Continuing as guest');
      const guestUser: AuthUser = {
        id: 'guest-' + Date.now(),
        email: 'guest@padelmatch.local',
        username: 'Guest',
        level_score: 500,
        level_tier: 'Gold',
        isGuest: true,
      };
      setUser(guestUser);
      setIsOnboarded(true);
      setIsGuest(true);
      console.log('✅ Guest mode activated');
    } catch (error) {
      console.error('Guest mode error:', error);
      throw error;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session || !user) {
      console.log('⚠️ Cannot refresh profile: no session or user');
      return;
    }

    try {
      console.log('🔄 Refreshing profile from database...');
      await loadUserProfile(user.id);
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      console.error('❌ Error refreshing profile:', errorMessage);
      if (errorMessage.includes('Unauthorized')) {
        await clearAuth();
      }
      throw new Error(`Failed to refresh profile: ${errorMessage}`);
    }
  }, [session, user, clearAuth, loadUserProfile]);

  const updateProfile = useCallback(async (updates: Partial<Player>) => {
    if (!session || !user) throw new Error('Not authenticated');

    try {
      console.log('🔧 Updating profile', updates);
      
      const dbUpdates: any = {};
      if (updates.username !== undefined) dbUpdates.username = updates.username;
      if (updates.level_score !== undefined) {
        const newRank = getRankFromPoints(updates.level_score);
        dbUpdates.level_score = updates.level_score;
        dbUpdates.rank_points = updates.level_score;
        dbUpdates.level_tier = newRank.division;
        dbUpdates.rank_division = newRank.division;
        dbUpdates.rank_sub = newRank.level;
        console.log('🔧 Calculated new rank:', newRank);
      }
      if (updates.level_tier) {
        dbUpdates.level_tier = updates.level_tier;
        dbUpdates.rank_division = updates.level_tier;
      }
      
      console.log('📤 Sending updates to database:', dbUpdates);
      
      const { data: updatedProfile, error } = await supabase
        .from('public_profiles')
        .update(dbUpdates)
        .eq('id', user.id)
        .select('id, email, username, level_tier, rank_division, level_score, rank_points')
        .single();

      if (error) {
        console.error('❌ Supabase error updating profile:', JSON.stringify(error, null, 2));
        throw new Error(error.message || 'Failed to update profile');
      }

      const authUser: AuthUser = {
        ...user,
        username: updates.username !== undefined ? updates.username : user.username,
        level_score: updates.level_score !== undefined ? updates.level_score : user.level_score,
        level_tier: updates.level_tier || updatedProfile?.level_tier || user.level_tier,
      };
      
      setUser(authUser);
      const onboarded = !!authUser.username && authUser.level_score > 0;
      setIsOnboarded(onboarded);
      console.log('✅ Profile updated:', {
        username: authUser.username,
        tier: authUser.level_tier,
        score: authUser.level_score,
        isOnboarded: onboarded
      });
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      console.error('❌ Error updating profile:', errorMessage);
      throw new Error(`Failed to update profile: ${errorMessage}`);
    }
  }, [session, user]);

  const assessRanking = useCallback(async (answers: Record<string, any>) => {
    if (!session) throw new Error('Not authenticated');

    try {
      console.log('🔧 Assessing ranking', answers);
      
      let totalAnswerScore = 0;
      
      Object.entries(answers).forEach(([key, value]) => {
        if (key.startsWith('q') && typeof value === 'number') {
          totalAnswerScore += value;
        }
      });
      
      const score100 = ((totalAnswerScore - 10) * 100) / 40;
      
      const tierMapping = [
        { min: 0, max: 19, tier: 'Cuivre' as const, sub: 1 as const, rpMid: 30 },
        { min: 20, max: 26, tier: 'Cuivre' as const, sub: 2 as const, rpMid: 90 },
        { min: 27, max: 33, tier: 'Cuivre' as const, sub: 3 as const, rpMid: 150 },
        { min: 34, max: 40, tier: 'Silver' as const, sub: 1 as const, rpMid: 220 },
        { min: 41, max: 47, tier: 'Silver' as const, sub: 2 as const, rpMid: 300 },
        { min: 48, max: 54, tier: 'Silver' as const, sub: 3 as const, rpMid: 380 },
        { min: 55, max: 61, tier: 'Gold' as const, sub: 1 as const, rpMid: 470 },
        { min: 62, max: 68, tier: 'Gold' as const, sub: 2 as const, rpMid: 570 },
        { min: 69, max: 75, tier: 'Gold' as const, sub: 3 as const, rpMid: 670 },
        { min: 76, max: 82, tier: 'Platinum' as const, sub: 1 as const, rpMid: 780 },
        { min: 83, max: 89, tier: 'Platinum' as const, sub: 2 as const, rpMid: 900 },
        { min: 90, max: 100, tier: 'Platinum' as const, sub: 3 as const, rpMid: 1020 },
      ];
      
      const rankMapping = tierMapping.find((m) => score100 >= m.min && score100 <= m.max) || tierMapping[0];
      
      const rpScore = rankMapping.rpMid;
      
      const assessment = { score: rpScore, tier: rankMapping.tier };
      
      console.log('📊 Ranking calculation:', {
        totalAnswerScore,
        score100,
        rpScore,
        tier: rankMapping.tier,
        sub: rankMapping.sub
      });
      
      const profileUpdates: any = {
        level_score: rpScore,
        level_tier: rankMapping.tier,
      };
      
      if (answers.username) {
        profileUpdates.username = answers.username;
        console.log('🔖 Including username in update:', answers.username);
      }
      
      await updateProfile(profileUpdates);
      
      setIsOnboarded(true);
      console.log('✅ Ranking assessed and saved:', {
        username: answers.username || 'not provided',
        tier: rankMapping.tier,
        sub: rankMapping.sub,
        rp: rpScore
      });
      return assessment;
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      console.error('❌ Failed to assess ranking:', errorMessage);
      throw new Error(`Failed to assess ranking: ${errorMessage}`);
    }
  }, [session, updateProfile]);

  return useMemo(
    () => ({
      session,
      user,
      isLoading,
      isAuthenticated: !!user,
      isOnboarded,
      isGuest,
      signup,
      login,
      logout,
      continueAsGuest,
      refreshProfile,
      updateProfile,
      assessRanking,
    }),
    [session, user, isLoading, isOnboarded, isGuest, signup, login, logout, continueAsGuest, refreshProfile, updateProfile, assessRanking]
  );
});

export const AuthProvider = AuthProviderInternal;

export const useAuth = () => {
  const context = useAuthInternal();
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
