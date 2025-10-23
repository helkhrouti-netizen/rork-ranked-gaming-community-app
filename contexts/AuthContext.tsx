import { useState, useEffect, useCallback, useMemo } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';
import { Player } from '@/lib/api';
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
    if (!token || !user) return;

    try {
      console.log('🔄 Refreshing profile (Mock Mode)...');
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
        console.log('✅ Profile refreshed successfully:', authUser);
      }
    } catch (error: any) {
      console.error('Error refreshing profile:', error);
      if (error.message?.includes('Unauthorized')) {
        await clearAuth();
      }
      throw error;
    }
  }, [token, user, clearAuth]);

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
      
      await updateProfile({
        level_score: rpScore,
        level_tier: rankMapping.tier,
      });
      setIsOnboarded(true);
      console.log('✅ Ranking assessed (Mock Mode):', assessment, `| score100=${score100}, RP=${rpScore}, tier=${rankMapping.tier} ${rankMapping.sub}`);
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
