import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { MoroccoCity } from '@/constants/cities';
import { Rank } from '@/constants/ranks';

const USER_PROFILE_KEY = '@user_profile';
const USER_AUTH_KEY = '@user_auth';

export interface UserAuth {
  id: string;
  emailOrPhone: string;
  authMethod: 'email' | 'phone';
  password: string;
  username: string;
  createdAt: string;
}

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
  const [auth, setAuth] = useState<UserAuth | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const storedAuth = await AsyncStorage.getItem(USER_AUTH_KEY);
      const storedProfile = await AsyncStorage.getItem(USER_PROFILE_KEY);
      
      if (storedAuth) {
        const parsedAuth = JSON.parse(storedAuth);
        setAuth(parsedAuth);
        setIsAuthenticated(true);
      }
      
      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile);
        setProfile(parsedProfile);
        setIsOnboarded(true);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = useCallback(async (
    emailOrPhone: string,
    password: string,
    username: string,
    authMethod: 'email' | 'phone'
  ) => {
    try {
      const storedAuth = await AsyncStorage.getItem(USER_AUTH_KEY);
      if (storedAuth) {
        const existingAuth = JSON.parse(storedAuth);
        if (existingAuth.emailOrPhone === emailOrPhone) {
          throw new Error('This account already exists. Please log in.');
        }
      }

      const newAuth: UserAuth = {
        id: `user_${Date.now()}`,
        emailOrPhone,
        authMethod,
        password,
        username,
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(USER_AUTH_KEY, JSON.stringify(newAuth));
      setAuth(newAuth);
      setIsAuthenticated(true);
      console.log('Account created:', { ...newAuth, password: '***' });
    } catch (error) {
      console.error('Failed to create account:', error);
      throw error;
    }
  }, []);

  const login = useCallback(async (
    emailOrPhone: string,
    password: string,
    authMethod: 'email' | 'phone'
  ) => {
    try {
      const storedAuth = await AsyncStorage.getItem(USER_AUTH_KEY);
      
      if (!storedAuth) {
        throw new Error('Account not found. Please sign up.');
      }

      const existingAuth: UserAuth = JSON.parse(storedAuth);

      if (existingAuth.emailOrPhone !== emailOrPhone) {
        throw new Error('Incorrect email/phone or password.');
      }

      if (existingAuth.password !== password) {
        throw new Error('Incorrect email/phone or password.');
      }

      setAuth(existingAuth);
      setIsAuthenticated(true);

      const storedProfile = await AsyncStorage.getItem(USER_PROFILE_KEY);
      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile);
        setProfile(parsedProfile);
        setIsOnboarded(true);
      }

      console.log('Login successful:', { ...existingAuth, password: '***' });
    } catch (error) {
      console.error('Failed to log in:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(USER_AUTH_KEY);
      await AsyncStorage.removeItem(USER_PROFILE_KEY);
      setAuth(null);
      setProfile(null);
      setIsAuthenticated(false);
      setIsOnboarded(false);
      console.log('Logged out');
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
      if (!auth) {
        throw new Error('User must be authenticated to create profile');
      }

      const newProfile: UserProfile = {
        id: auth.id,
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
  }, [auth]);

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



  return useMemo(() => ({
    auth,
    profile,
    isLoading,
    isAuthenticated,
    isOnboarded,
    signup,
    login,
    logout,
    createProfile,
    updateProfile,
  }), [auth, profile, isLoading, isAuthenticated, isOnboarded, signup, login, logout, createProfile, updateProfile]);
});
