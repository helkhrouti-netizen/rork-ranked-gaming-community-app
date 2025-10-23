import { useState, useEffect, useCallback, useMemo } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';
import { api, Player } from '@/lib/api';
import { mockDataProvider, MockUser } from '@/lib/mockData';
import { getRankFromPoints } from '@/constants/ranks';

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
      console.log('🔧 Loading auth (Mock Mode)');
      await mockDataProvider.initialize();
      
      const storedToken = await secureStorage.getItem(TOKEN_KEY);
      const storedUser = await secureStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        try {
          const mockUser = await mockDataProvider.getCurrentUser();
          if (mockUser) {
            const authUser: AuthUser = {
              id: mockUser.id,
              email: mockUser.email,
              username: mockUser.username,
              level_score: mockUser.rank.points || 0,
              level_tier: mockUser.rank.division,
            };
            setUser(authUser);
            await secureStorage.setItem(USER_KEY, JSON.stringify(authUser));
            setIsOnboarded(!!mockUser.username && (mockUser.rank.points || 0) > 0);
          } else {
            await clearAuth();
          }
        } catch (error: any) {
          console.error('Error loading mock user:', error);
          await clearAuth();
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
      console.log('🔧 Using Mock Mode for signup');
      const mockUser = await mockDataProvider.signup(email, password, username);
      
      const authUser: AuthUser = {
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        level_score: mockUser.rank.points || 0,
        level_tier: mockUser.rank.division,
      };

      await saveAuth('mock-token', authUser);
      setIsOnboarded(false);
      
      console.log('✅ Signup successful (Mock Mode):', email);
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
      console.log('🔧 Using Mock Mode for login');
      const mockUser = await mockDataProvider.login(email, password);
      
      const authUser: AuthUser = {
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        level_score: mockUser.rank.points || 0,
        level_tier: mockUser.rank.division,
      };

      await saveAuth('mock-token', authUser);
      setIsOnboarded(!!mockUser.username && (mockUser.rank.points || 0) > 0);
      
      console.log('✅ Login successful (Mock Mode):', email);
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
    if (!token || !user) throw new Error('Not authenticated');

    try {
      console.log('🔧 Updating profile (Mock Mode)', updates);
      
      const mockUpdates: Partial<MockUser> = {};
      if (updates.username) mockUpdates.username = updates.username;
      if (updates.level_score !== undefined) {
        mockUpdates.rank = getRankFromPoints(updates.level_score);
      }
      
      await mockDataProvider.updateUser(user.id, mockUpdates);
      
      const authUser: AuthUser = {
        ...user,
        username: updates.username || user.username,
        level_score: updates.level_score !== undefined ? updates.level_score : user.level_score,
        level_tier: updates.level_tier || user.level_tier,
      };
      
      setUser(authUser);
      await secureStorage.setItem(USER_KEY, JSON.stringify(authUser));
      console.log('✅ Profile updated (Mock Mode)');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }, [token, user]);

  const assessRanking = useCallback(async (answers: Record<string, any>) => {
    if (!token) throw new Error('Not authenticated');

    try {
      console.log('🔧 Assessing ranking (Mock Mode)', answers);
      
      let totalScore = 0;
      let totalWeight = 0;
      
      const weights: Record<string, number> = {
        'q1': 10, 'q2': 12, 'q3': 8, 'q4': 10, 'q5': 10,
        'q6': 10, 'q7': 10, 'q8': 8, 'q9': 12, 'q10': 10
      };
      
      Object.entries(answers).forEach(([key, value]) => {
        const weight = weights[key] || 10;
        const score = typeof value === 'number' ? value : 3;
        totalScore += score * weight;
        totalWeight += weight;
      });
      
      const normalizedScore = Math.round((totalScore / (totalWeight * 5)) * 100);
      
      let tier = 'Cuivre';
      if (normalizedScore >= 76) tier = 'Platinum';
      else if (normalizedScore >= 55) tier = 'Gold';
      else if (normalizedScore >= 34) tier = 'Silver';
      
      const assessment = { score: normalizedScore, tier };
      
      await updateProfile({
        level_score: normalizedScore,
        level_tier: tier,
      });
      setIsOnboarded(true);
      console.log('✅ Ranking assessed (Mock Mode):', assessment);
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
