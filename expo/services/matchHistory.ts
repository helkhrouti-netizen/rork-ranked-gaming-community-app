import { supabase } from '@/lib/supabase';

export interface MatchHistoryRecord {
  id: string;
  player_id: string;
  match_id: string;
  rp_change: number;
  outcome: 'win' | 'loss' | 'draw';
  created_at: string;
  updated_at: string;
}

export const matchHistoryService = {
  async getPlayerMatchHistory(playerId: string, limit = 5): Promise<MatchHistoryRecord[]> {
    try {
      const { data, error } = await supabase
        .from('player_match_history')
        .select('*')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching match history:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch match history:', error);
      return [];
    }
  },

  async recordMatchResult(
    playerId: string,
    matchId: string,
    outcome: 'win' | 'loss' | 'draw',
    rpChange: number
  ): Promise<MatchHistoryRecord | null> {
    try {
      const { data, error } = await supabase
        .from('player_match_history')
        .insert({
          player_id: playerId,
          match_id: matchId,
          outcome,
          rp_change: rpChange,
        })
        .select()
        .single();

      if (error) {
        console.error('Error recording match result:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to record match result:', error);
      return null;
    }
  },

  async getMatchHistoryForShare(playerId: string) {
    const history = await this.getPlayerMatchHistory(playerId, 5);
    
    return history.map((record) => ({
      id: record.id,
      outcome: record.outcome,
      rpChange: record.rp_change,
      date: new Date(record.created_at),
    }));
  },

  getMockMatchHistory() {
    return [
      { id: '1', outcome: 'win' as const, rpChange: 50, date: new Date() },
      { id: '2', outcome: 'win' as const, rpChange: 50, date: new Date() },
      { id: '3', outcome: 'loss' as const, rpChange: -25, date: new Date() },
      { id: '4', outcome: 'win' as const, rpChange: 50, date: new Date() },
      { id: '5', outcome: 'loss' as const, rpChange: -25, date: new Date() },
    ];
  },
};
