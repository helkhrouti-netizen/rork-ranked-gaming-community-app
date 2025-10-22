import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProfileService, OnboardingData, Profile } from './profile';

const ONBOARDING_KEY = '@onboarding_complete';

export class SupabaseProfileService implements ProfileService {
  async saveOnboarding(data: OnboardingData): Promise<void> {
    console.log('💾 Saving onboarding data to Supabase:', data);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No authenticated user found');
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: data.username,
        city: data.city,
        rank_tier: data.rankTier,
        rank_sub: data.rankSub,
        rp: data.rp,
        avatar_uri: data.avatarUri,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('❌ Error saving onboarding to Supabase:');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error hint:', error.hint);
      console.error('Error details:', error.details);
      const errorMsg = error.message || error.code || 'Unknown error';
      throw new Error(`Failed to save onboarding: ${errorMsg}`);
    }

    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    console.log('✅ Onboarding data saved successfully to Supabase');
  }

  async getProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !data) {
      console.log('No profile found in Supabase');
      return null;
    }

    return {
      id: data.id,
      username: data.username || 'User',
      avatarUri: data.avatar_uri,
      city: data.city || 'CASABLANCA',
      rankTier: data.rank_tier || 'Cuivre',
      rankSub: data.rank_sub || 1,
      rp: data.rp || 0,
      wins: data.wins || 0,
      losses: data.losses || 0,
      reputation: data.reputation || 5.0,
      level: data.level || 1,
      createdAt: data.created_at || new Date().toISOString(),
    };
  }

  async isOnboardingComplete(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return false;
    }

    const { data } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single();

    return data?.onboarding_completed === true;
  }

  async clearOnboarding(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return;
    }

    await supabase
      .from('profiles')
      .update({ onboarding_completed: false })
      .eq('id', user.id);

    await AsyncStorage.removeItem(ONBOARDING_KEY);
    console.log('🗑️ Onboarding flag cleared');
  }
}

export const supabaseProfileService: ProfileService = new SupabaseProfileService();
