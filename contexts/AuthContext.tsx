import { useState, useEffect, useCallback, useMemo } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';
import { api, Player } from '@/lib/api';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },

  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  level_score: number;
  level_tier: string;
}

const [AuthProviderInternal, useAuthInternal] = createContextHook(() => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);

  const saveAuth = useCallback(async (authToken: string, authUser: AuthUser) => {
    try {
      await secureStorage.setItem(TOKEN_KEY, authToken);
      await secureStorage.setItem(USER_KEY, JSON.stringify(authUser));
      setToken(authToken);
      setUser(authUser);
      console.log('✅ Auth saved successfully');
    } catch (error) {
      console.error('Failed to save auth:', error);
      throw error;
    }
  }, []);

  const clearAuth = useCallback(async () => {
    try {
      await secureStorage.deleteItem(TOKEN_KEY);
      await secureStorage.deleteItem(USER_KEY);
      setToken(null);
      setUser(null);
      setIsOnboarded(false);
      console.log('🗑️ Auth cleared');
    } catch (error) {
      console.error('Failed to clear auth:', error);
    }
  }, []);

  const loadAuth = useCallback(async () => {
    try {
      const storedToken = await secureStorage.getItem(TOKEN_KEY);
      const storedUser = await secureStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        try {
          const profile = await api.players.me(storedToken);
          const authUser: AuthUser = {
            id: profile.id,
            email: profile.email,
            username: profile.username,
            level_score: profile.level_score,
            level_tier: profile.level_tier,
          };
          setUser(authUser);
          await secureStorage.setItem(USER_KEY, JSON.stringify(authUser));
          
          setIsOnboarded(!!profile.username && profile.level_score > 0);
        } catch (error: any) {
          if (error.message?.includes('Unauthorized')) {
            await clearAuth();
          }
        }
      }
    } catch (error) {
      console.error('Failed to load auth:', error);
      await clearAuth();
    } finally {
      setIsLoading(false);
    }
  }, [clearAuth]);

  useEffect(() => {
    loadAuth();
  }, [loadAuth]);

  const signup = useCallback(async (
    email: string,
    password: string,
    username: string
  ) => {
    try {
      const response = await api.auth.register({ email, password, username });
      
      const authUser: AuthUser = {
        id: response.user.id,
        email: response.user.email,
        username: response.user.username,
        level_score: 0,
        level_tier: 'Bronze',
      };

      await saveAuth(response.access_token, authUser);
      setIsOnboarded(false);
      
      console.log('✅ Signup successful:', email);
      return { user: authUser };
    } catch (error: any) {
      console.error('❌ Signup error:', error);
      throw error;
    }
  }, [saveAuth]);

  const login = useCallback(async (
    email: string,
    password: string
  ) => {
    try {
      const response = await api.auth.login({ email, password });
      
      const profile = await api.players.me(response.access_token);
      const authUser: AuthUser = {
        id: profile.id,
        email: profile.email,
        username: profile.username,
        level_score: profile.level_score,
        level_tier: profile.level_tier,
      };

      await saveAuth(response.access_token, authUser);
      setIsOnboarded(!!profile.username && profile.level_score > 0);
      
      console.log('✅ Login successful:', email);
      return { user: authUser };
    } catch (error: any) {
      console.error('❌ Login error:', error);
      throw error;
    }
  }, [saveAuth]);

  const logout = useCallback(async () => {
    await clearAuth();
    console.log('Logged out');
  }, [clearAuth]);

  const refreshProfile = useCallback(async () => {
    if (!token) return;

    try {
      const profile = await api.players.me(token);
      const authUser: AuthUser = {
        id: profile.id,
        email: profile.email,
        username: profile.username,
        level_score: profile.level_score,
        level_tier: profile.level_tier,
      };
      setUser(authUser);
      await secureStorage.setItem(USER_KEY, JSON.stringify(authUser));
      setIsOnboarded(!!profile.username && profile.level_score > 0);
      console.log('🔄 Profile refreshed');
    } catch (error: any) {
      if (error.message?.includes('Unauthorized')) {
        await clearAuth();
      }
      throw error;
    }
  }, [token, clearAuth]);

  const updateProfile = useCallback(async (updates: Partial<Player>) => {
    if (!token) throw new Error('Not authenticated');

    try {
      const updated = await api.players.update(token, updates);
      const authUser: AuthUser = {
        id: updated.id,
        email: updated.email,
        username: updated.username,
        level_score: updated.level_score,
        level_tier: updated.level_tier,
      };
      setUser(authUser);
      await secureStorage.setItem(USER_KEY, JSON.stringify(authUser));
      console.log('✅ Profile updated');
    } catch (error: any) {
      if (error.message?.includes('Unauthorized')) {
        await clearAuth();
      }
      throw error;
    }
  }, [token, clearAuth]);

  const assessRanking = useCallback(async (answers: Record<string, any>) => {
    if (!token) throw new Error('Not authenticated');

    try {
      const assessment = await api.rankings.assess(token, answers);
      await updateProfile({
        level_score: assessment.score,
        level_tier: assessment.tier,
      });
      setIsOnboarded(true);
      console.log('✅ Ranking assessed:', assessment);
      return assessment;
    } catch (error) {
      console.error('Failed to assess ranking:', error);
      throw error;
    }
  }, [token, updateProfile]);

  return useMemo(
    () => ({
      token,
      user,
      isLoading,
      isAuthenticated: !!token && !!user,
      isOnboarded,
      signup,
      login,
      logout,
      refreshProfile,
      updateProfile,
      assessRanking,
    }),
    [token, user, isLoading, isOnboarded, signup, login, logout, refreshProfile, updateProfile, assessRanking]
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
