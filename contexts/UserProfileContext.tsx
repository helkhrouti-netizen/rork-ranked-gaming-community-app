import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { MoroccoCity } from '@/constants/cities';
import { Rank } from '@/constants/ranks';
import { mockDataProvider, MockUser } from '@/lib/mockData';
import { profileService } from '@/services/profile';

const USER_PROFILE_KEY = '@user_profile';

export interface UserProfile {
  id: string;
  username: string;
  profilePicture?: string;
  city: MoroccoCity;
  rank: Rank;
  wins: number;
  losses: number;
  reputation: number;
  level: number;
  createdAt: string;
}

export const [UserProfileProvider, useUserProfile] = createContextHook(() => {
  const [user, setUser] = useState<MockUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);

  useEffect(() => {
    loadCurrentUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCurrentUser = async () => {
    try {
      await mockDataProvider.initialize();
      const currentUser = await mockDataProvider.getCurrentUser();
      
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
        await loadProfile(currentUser);
        
        const onboardingComplete = await profileService.isOnboardingComplete();
        setIsOnboarded(onboardingComplete);
      } else {
        setProfile(null);
        setIsOnboarded(false);
      }
    } catch (error) {
      console.error('Failed to load current user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProfile = async (mockUser: MockUser) => {
    try {
      const userProfile: UserProfile = {
        id: mockUser.id,
        username: mockUser.username || 'User',
        profilePicture: mockUser.profilePicture,
        city: mockUser.city || 'CASABLANCA',
        rank: mockUser.rank || { division: 'Cuivre', level: 1, points: 0 },
        wins: mockUser.wins || 0,
        losses: mockUser.losses || 0,
        reputation: mockUser.reputation || 5.0,
        level: mockUser.level || 1,
        createdAt: mockUser.createdAt || new Date().toISOString(),
      };

      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(userProfile));
      setProfile(userProfile);
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const signup = useCallback(async (
    email: string,
    password: string,
    username: string,
    phoneNumber?: string
  ) => {
    try {
      const newUser = await mockDataProvider.signup(email, password, username, phoneNumber);
      console.log('✅ Signup successful (mock):', newUser.email);
      return { user: newUser };
    } catch (error: any) {
      console.error('❌ Signup error:', error);
      throw error;
    }
  }, []);

  const login = useCallback(async (
    email: string,
    password: string
  ) => {
    try {
      const loggedInUser = await mockDataProvider.login(email, password);
      setUser(loggedInUser);
      setIsAuthenticated(true);
      await loadProfile(loggedInUser);
      
      const onboardingComplete = await profileService.isOnboardingComplete();
      setIsOnboarded(onboardingComplete);
      
      console.log('✅ Login successful (mock):', loggedInUser.email);
      return { user: loggedInUser };
    } catch (error: any) {
      console.error('❌ Login error:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await mockDataProvider.logout();
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      setIsOnboarded(false);
      await AsyncStorage.removeItem(USER_PROFILE_KEY);
      console.log('Logged out (mock)');
    } catch (error) {
      console.error('Failed to log out:', error);
      throw error;
    }
  }, []);

  const createProfile = useCallback(async (
    username: string,
    city: MoroccoCity,
    rank: Rank,
    profilePicture?: string
  ) => {
    try {
      if (!user) {
        throw new Error('User must be authenticated to create profile');
      }

      await mockDataProvider.updateUser(user.id, {
        username,
        city,
        rank,
        profilePicture,
      });

      const updatedUser = await mockDataProvider.getUser(user.id);
      if (updatedUser) {
        setUser(updatedUser);
        await loadProfile(updatedUser);
      }

      console.log('Profile created (mock)');
    } catch (error) {
      console.error('Failed to create user profile:', error);
      throw error;
    }
  }, [user]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!profile || !user) return;

    try {
      await mockDataProvider.updateUser(user.id, updates);

      const updatedUser = await mockDataProvider.getUser(user.id);
      if (updatedUser) {
        setUser(updatedUser);
        await loadProfile(updatedUser);
      }

      console.log('Profile updated (mock)');
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  }, [profile, user]);

  const refreshOnboardingStatus = useCallback(async () => {
    const onboardingComplete = await profileService.isOnboardingComplete();
    setIsOnboarded(onboardingComplete);
    console.log('🔄 Onboarding status refreshed:', onboardingComplete);
  }, []);

  return useMemo(() => ({
    user,
    profile,
    isLoading,
    isAuthenticated,
    isOnboarded,
    signup,
    login,
    logout,
    createProfile,
    updateProfile,
    refreshOnboardingStatus,
  }), [user, profile, isLoading, isAuthenticated, isOnboarded, signup, login, logout, createProfile, updateProfile, refreshOnboardingStatus]);
});
