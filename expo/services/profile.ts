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

export class ApiProfileService implements ProfileService {
  async saveOnboarding(data: OnboardingData): Promise<void> {
    console.log('💾 Saving onboarding data (handled by AuthContext):', data);
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    console.log('✅ Onboarding data saved successfully');
  }

  async getProfile(): Promise<Profile | null> {
    console.log('Profile data managed by AuthContext');
    return null;
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

export const profileService: ProfileService = new ApiProfileService();
