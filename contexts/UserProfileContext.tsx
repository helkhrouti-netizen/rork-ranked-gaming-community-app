import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { MoroccoCity } from '@/constants/cities';
import { Rank } from '@/constants/ranks';

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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem(USER_PROFILE_KEY);
      if (stored) {
        const parsedProfile = JSON.parse(stored);
        setProfile(parsedProfile);
        setIsOnboarded(true);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createProfile = useCallback(async (
    username: string,
    city: MoroccoCity,
    rank: Rank,
    profilePicture?: string
  ) => {
    try {
      const newProfile: UserProfile = {
        id: `user_${Date.now()}`,
        username,
        profilePicture,
        city,
        rank,
        wins: 0,
        losses: 0,
        reputation: 0,
        level: 1,
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(newProfile));
      setProfile(newProfile);
      setIsOnboarded(true);
      console.log('Profile created:', newProfile);
    } catch (error) {
      console.error('Failed to create user profile:', error);
      throw error;
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!profile) return;

    try {
      const updatedProfile = { ...profile, ...updates };
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
      console.log('Profile updated:', updatedProfile);
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  }, [profile]);

  const clearProfile = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(USER_PROFILE_KEY);
      setProfile(null);
      setIsOnboarded(false);
      console.log('Profile cleared');
    } catch (error) {
      console.error('Failed to clear user profile:', error);
      throw error;
    }
  }, []);

  return useMemo(() => ({
    profile,
    isLoading,
    isOnboarded,
    createProfile,
    updateProfile,
    clearProfile,
  }), [profile, isLoading, isOnboarded, createProfile, updateProfile, clearProfile]);
});
