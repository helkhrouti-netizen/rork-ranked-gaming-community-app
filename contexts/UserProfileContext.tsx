import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { MoroccoCity } from '@/constants/cities';
import { Rank } from '@/constants/ranks';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

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
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      if (session) {
        loadProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      
      if (session) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setIsOnboarded(false);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        console.error('Failed to load user from Supabase:', userError);
        const storedProfile = await AsyncStorage.getItem(USER_PROFILE_KEY);
        if (storedProfile) {
          const parsedProfile = JSON.parse(storedProfile);
          if (parsedProfile.id === userId) {
            setProfile(parsedProfile);
            setIsOnboarded(true);
          }
        }
        setIsLoading(false);
        return;
      }

      const userProfile: UserProfile = {
        id: userData.id,
        username: userData.username || 'User',
        profilePicture: userData.profile_picture,
        city: userData.city || 'CASABLANCA',
        rank: userData.rank || { division: 'Cuivre', level: 1, points: 0 },
        wins: userData.wins || 0,
        losses: userData.losses || 0,
        reputation: userData.reputation || 0,
        level: userData.level || 1,
        createdAt: userData.created_at || new Date().toISOString(),
      };

      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(userProfile));
      setProfile(userProfile);
      setIsOnboarded(!!userData.username && !!userData.city);
    } catch (error) {
      console.error('Failed to load user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = useCallback(async (
    email: string,
    password: string,
    username: string,
    phoneNumber?: string
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            phone_number: phoneNumber,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          throw new Error('Email already in use. Please try logging in instead.');
        }
        throw error;
      }

      if (data.user && data.user.identities && data.user.identities.length === 0) {
        throw new Error('Email already in use. Please try logging in instead.');
      }

      if (data.user) {
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email: email,
              username: username,
              phone_number: phoneNumber,
              created_at: new Date().toISOString(),
            },
          ]);

        if (insertError) {
          console.error('Failed to insert user into users table:', insertError);
        }
      }

      console.log('Signup successful. Check your inbox to confirm your email.');
      return data;
    } catch (error: any) {
      console.error('Signup error:', error);
      throw error;
    }
  }, []);

  const login = useCallback(async (
    email: string,
    password: string
  ) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Please check your inbox to confirm your email before logging in.');
        }
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Incorrect email or password. Please try again.');
        }
        throw error;
      }

      if (!data.user?.email_confirmed_at) {
        await supabase.auth.signOut();
        throw new Error('Please check your inbox to confirm your email before logging in.');
      }

      console.log('Login successful:', data.user.email);
      return data;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setProfile(null);
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
      if (!user) {
        throw new Error('User must be authenticated to create profile');
      }

      const newProfile: UserProfile = {
        id: user.id,
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

      const { error: updateError } = await supabase
        .from('users')
        .update({
          username,
          city,
          rank,
          profile_picture: profilePicture,
          wins: 0,
          losses: 0,
          reputation: 0,
          level: 1,
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Failed to update user in Supabase:', updateError);
        throw updateError;
      }

      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(newProfile));
      setProfile(newProfile);
      setIsOnboarded(true);
      console.log('Profile created and synced with Supabase:', newProfile);
    } catch (error) {
      console.error('Failed to create user profile:', error);
      throw error;
    }
  }, [user]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!profile) return;

    try {
      const updatedProfile = { ...profile, ...updates };

      const supabaseUpdates: Record<string, any> = {};
      if (updates.username) supabaseUpdates.username = updates.username;
      if (updates.city) supabaseUpdates.city = updates.city;
      if (updates.rank) supabaseUpdates.rank = updates.rank;
      if (updates.profilePicture !== undefined) supabaseUpdates.profile_picture = updates.profilePicture;
      if (updates.wins !== undefined) supabaseUpdates.wins = updates.wins;
      if (updates.losses !== undefined) supabaseUpdates.losses = updates.losses;
      if (updates.reputation !== undefined) supabaseUpdates.reputation = updates.reputation;
      if (updates.level !== undefined) supabaseUpdates.level = updates.level;

      if (Object.keys(supabaseUpdates).length > 0) {
        const { error: updateError } = await supabase
          .from('users')
          .update(supabaseUpdates)
          .eq('id', profile.id);

        if (updateError) {
          console.error('Failed to update user in Supabase:', updateError);
        }
      }

      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
      console.log('Profile updated and synced with Supabase:', updatedProfile);
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  }, [profile]);

  return useMemo(() => ({
    session,
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
  }), [session, user, profile, isLoading, isAuthenticated, isOnboarded, signup, login, logout, createProfile, updateProfile]);
});
