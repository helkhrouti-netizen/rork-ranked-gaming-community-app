import { supabase } from '@/lib/supabase';
import { MatchType } from '@/types';
import { Field } from '@/constants/cities';

export interface CreateMatchData {
  type: MatchType;
  maxPlayers: number;
  field: Field;
  pointReward: number;
  pointPenalty: number;
}

export interface SupabaseMatch {
  id: string;
  type: MatchType;
  status: string;
  host_id: string;
  max_players: number;
  field: any;
  point_reward: number;
  point_penalty: number;
  created_at: string;
  updated_at: string;
}

export class SupabaseMatchService {
  async createMatch(data: CreateMatchData): Promise<SupabaseMatch> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated to create a match');
    }

    console.log('📝 Creating match in Supabase:', {
      type: data.type,
      host_id: user.id,
      max_players: data.maxPlayers,
      field: data.field,
    });

    const { data: match, error } = await supabase
      .from('matches')
      .insert({
        type: data.type,
        status: 'waiting',
        host_id: user.id,
        max_players: data.maxPlayers,
        field: data.field,
        point_reward: data.pointReward,
        point_penalty: data.pointPenalty,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating match:', error);
      throw error;
    }

    console.log('✅ Match created successfully:', match.id);

    const { error: playerError } = await supabase
      .from('match_players')
      .insert({
        match_id: match.id,
        player_id: user.id,
      });

    if (playerError) {
      console.error('❌ Error adding host to match_players:', playerError);
    } else {
      console.log('✅ Host added to match_players');
    }

    return match;
  }

  async getMatch(matchId: string): Promise<SupabaseMatch | null> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (error || !data) {
      console.error('Error fetching match:', error);
      return null;
    }

    return data;
  }

  async getMatches(): Promise<SupabaseMatch[]> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Error fetching matches:', error);
      return [];
    }

    return data;
  }

  async updateMatchStatus(matchId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('matches')
      .update({ status })
      .eq('id', matchId);

    if (error) {
      console.error('Error updating match status:', error);
      throw error;
    }
  }
}

export const supabaseMatchService = new SupabaseMatchService();
