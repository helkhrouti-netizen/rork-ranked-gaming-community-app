import { mockDataProvider } from '@/lib/mockData';
import { getRankFromPoints } from '@/constants/ranks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MoroccoCity } from '@/constants/cities';

const ONBOARDING_KEY = '@onboarding_complete';

export interface OnboardingData {
  avatarUri: string;
  username: string;
  city: string;
  score: number;
  rankTier: 'Cuivre' | 'Silver' | 'Gold' | 'Platinum';
  rankSub: 1 | 2 | 3;
  rp: number;
}

export interface Profile {
  id: string;
  username: string;
  avatarUri?: string;
  city: MoroccoCity;
  rankTier: 'Cuivre' | 'Silver' | 'Gold' | 'Platinum';
  rankSub: 1 | 2 | 3;
  rp: number;
  wins: number;
  losses: number;
  reputation: number;
  level: number;
  createdAt: string;
}

export interface ProfileService {
  saveOnboarding(data: OnboardingData): Promise<void>;
  getProfile(): Promise<Profile | null>;
  isOnboardingComplete(): Promise<boolean>;
  clearOnboarding(): Promise<void>;
}

export class MockProfileService implements ProfileService {
  async saveOnboarding(data: OnboardingData): Promise<void> {
    console.log('💾 Saving onboarding data:', data);
    
    const currentUser = await mockDataProvider.getCurrentUser();
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }

    const rank = getRankFromPoints(data.rp);
    
    await mockDataProvider.updateUser(currentUser.id, {
      username: data.username,
      city: data.city as MoroccoCity,
      rank,
      profilePicture: data.avatarUri,
    });

    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    console.log('✅ Onboarding data saved successfully');
  }

  async getProfile(): Promise<Profile | null> {
    const currentUser = await mockDataProvider.getCurrentUser();
    if (!currentUser) {
      return null;
    }

    const rankTier = currentUser.rank.division === 'Diamond' ? 'Platinum' : currentUser.rank.division;
    
    return {
      id: currentUser.id,
      username: currentUser.username,
      avatarUri: currentUser.profilePicture,
      city: currentUser.city,
      rankTier,
      rankSub: currentUser.rank.level,
      rp: currentUser.rank.points,
      wins: currentUser.wins,
      losses: currentUser.losses,
      reputation: currentUser.reputation,
      level: currentUser.level,
      createdAt: currentUser.createdAt,
    };
  }

  async isOnboardingComplete(): Promise<boolean> {
    const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
    return completed === 'true';
  }

  async clearOnboarding(): Promise<void> {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    console.log('🗑️ Onboarding flag cleared');
  }
}

export const profileService: ProfileService = new MockProfileService();
