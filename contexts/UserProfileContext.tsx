import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { MoroccoCity } from '@/constants/cities';
import { Rank } from '@/constants/ranks';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendEmailVerification,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

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
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.email);
      setUser(firebaseUser);
      setIsAuthenticated(!!firebaseUser);
      
      if (firebaseUser) {
        await loadProfile(firebaseUser.uid);
      } else {
        setProfile(null);
        setIsOnboarded(false);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        console.log('User document does not exist in Firestore');
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

      const userData = userDoc.data();
      const userProfile: UserProfile = {
        id: userDoc.id,
        username: userData.username || 'User',
        profilePicture: userData.avatar,
        city: userData.city || 'CASABLANCA',
        rank: userData.rank || { division: 'Cuivre', level: 1, points: 0 },
        wins: userData.wins || 0,
        losses: userData.losses || 0,
        reputation: userData.reputation || 0,
        level: userData.level || 1,
        createdAt: userData.createdAt || new Date().toISOString(),
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      const userDocRef = doc(db, 'users', newUser.uid);
      await setDoc(userDocRef, {
        email: email,
        username: username,
        phoneNumber: phoneNumber || null,
        createdAt: serverTimestamp(),
        rank: { division: 'Cuivre', level: 1, points: 0 },
        wins: 0,
        losses: 0,
        reputation: 0,
        level: 1,
      });

      await sendEmailVerification(newUser);
      console.log('✅ Signup successful. Verification email sent to:', newUser.email);
      
      return { user: newUser };
    } catch (error: any) {
      console.error('❌ Signup error:', error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email already in use. Please try logging in instead.');
      }
      if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address.');
      }
      if (error.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters.');
      }
      throw error;
    }
  }, []);

  const login = useCallback(async (
    email: string,
    password: string
  ) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (!user.emailVerified) {
        console.warn('⚠️ Email not verified for:', user.email);
        throw new Error('Please verify your email before logging in. Check your inbox for the verification link.');
      }
      
      console.log('✅ Login successful:', user.email);
      return { user };
    } catch (error: any) {
      console.error('❌ Login error:', error);
      if (error.message.includes('verify your email')) {
        throw error;
      }
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        throw new Error('Incorrect email or password. Please try again.');
      }
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email. Please sign up first.');
      }
      if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed login attempts. Please try again later.');
      }
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
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
        id: user.uid,
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

      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        username,
        city,
        rank,
        avatar: profilePicture || null,
        wins: 0,
        losses: 0,
        reputation: 0,
        level: 1,
      });

      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(newProfile));
      setProfile(newProfile);
      setIsOnboarded(true);
      console.log('Profile created and synced with Firestore:', newProfile);
    } catch (error) {
      console.error('Failed to create user profile:', error);
      throw error;
    }
  }, [user]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!profile) return;

    try {
      const updatedProfile = { ...profile, ...updates };

      const firestoreUpdates: Record<string, any> = {};
      if (updates.username) firestoreUpdates.username = updates.username;
      if (updates.city) firestoreUpdates.city = updates.city;
      if (updates.rank) firestoreUpdates.rank = updates.rank;
      if (updates.profilePicture !== undefined) firestoreUpdates.avatar = updates.profilePicture;
      if (updates.wins !== undefined) firestoreUpdates.wins = updates.wins;
      if (updates.losses !== undefined) firestoreUpdates.losses = updates.losses;
      if (updates.reputation !== undefined) firestoreUpdates.reputation = updates.reputation;
      if (updates.level !== undefined) firestoreUpdates.level = updates.level;

      if (Object.keys(firestoreUpdates).length > 0) {
        const userDocRef = doc(db, 'users', profile.id);
        await updateDoc(userDocRef, firestoreUpdates);
      }

      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
      console.log('Profile updated and synced with Firestore:', updatedProfile);
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  }, [profile]);

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
  }), [user, profile, isLoading, isAuthenticated, isOnboarded, signup, login, logout, createProfile, updateProfile]);
});
