import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Plus,
  Users,
  Clock,
  MapPin,
  Zap,
  Heart,
  Play,
  AlertCircle,
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { formatRank, RANK_INFO } from '@/constants/ranks';
import { Match } from '@/types';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { supabase } from '@/lib/supabase';

export default function PlayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, isLoading: profileLoading } = useUserProfile();
  const [matchFilter, setMatchFilter] = useState<'all' | 'official' | 'friendly'>('all');
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState<boolean>(true);
  const [isQuickMatchLoading, setIsQuickMatchLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const rankInfo = profile?.rank ? RANK_INFO[profile.rank.division] : RANK_INFO['Cuivre'];

  useEffect(() => {
    loadMatches();
    const subscription = supabase
      .channel('matches_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        loadMatches();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadMatches = async () => {
    try {
      setIsLoadingMatches(true);
      setErrorMessage('');
      const { data: matchesData, error } = await supabase
        .from('matches')
        .select(`
          *,
          host:users!matches_host_id_fkey(*),
          match_players(user:users(*))
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading matches:', error);
        setErrorMessage(error.message || 'Failed to load matches. Please try again.');
        setMatches([]);
        return;
      }

      const formattedMatches: Match[] = (matchesData || []).map((match: any) => ({
        id: match.id,
        type: match.type,
        status: match.status,
        host: {
          id: match.host.id,
          username: match.host.username || 'User',
          rank: match.host.rank || { division: 'Cuivre', level: 1, points: 0 },
          city: match.host.city || 'CASABLANCA',
          wins: match.host.wins || 0,
          losses: match.host.losses || 0,
          reputation: match.host.reputation || 0,
          level: match.host.level || 1,
        },
        players: (match.match_players || []).map((mp: any) => ({
          id: mp.user.id,
          username: mp.user.username || 'User',
          rank: mp.user.rank || { division: 'Cuivre', level: 1, points: 0 },
          city: mp.user.city || 'CASABLANCA',
          wins: mp.user.wins || 0,
          losses: mp.user.losses || 0,
          reputation: mp.user.reputation || 0,
          level: mp.user.level || 1,
        })),
        maxPlayers: match.max_players,
        field: match.field || { name: 'Unknown Field', address: '', city: 'CASABLANCA' },
        scheduledTime: match.scheduled_time ? new Date(match.scheduled_time) : undefined,
        pointReward: match.point_reward,
        pointPenalty: match.point_penalty,
        createdAt: new Date(match.created_at),
      }));

      setMatches(formattedMatches);
    } catch (error: any) {
      console.error('Error loading matches:', error);
      setErrorMessage(error?.message || 'An unexpected error occurred while loading matches.');
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const handleQuickMatch = async () => {
    if (!profile) {
      console.log('User must be logged in to quick match');
      return;
    }

    try {
      setIsQuickMatchLoading(true);

      const { data: availableMatches, error: searchError } = await supabase
        .from('matches')
        .select('id, max_players, match_players(count)')
        .eq('status', 'waiting')
        .order('created_at', { ascending: true });

      if (searchError) {
        console.error('Error searching for matches:', searchError);
        throw searchError;
      }

      let matchToJoin = null;
      if (availableMatches && availableMatches.length > 0) {
        for (const match of availableMatches) {
          const playerCount = match.match_players?.[0]?.count || 0;
          if (playerCount < match.max_players) {
            matchToJoin = match.id;
            break;
          }
        }
      }

      if (matchToJoin) {
        const { error: joinError } = await supabase
          .from('match_players')
          .insert([{ match_id: matchToJoin, user_id: profile.id }]);

        if (joinError) {
          console.error('Error joining match:', joinError);
          throw joinError;
        }

        router.push(`/match/${matchToJoin}`);
      } else {
        const { data: newMatch, error: createError } = await supabase
          .from('matches')
          .insert([{
            host_id: profile.id,
            type: 'official',
            status: 'waiting',
            max_players: 4,
            point_reward: 50,
            point_penalty: 30,
            field: { name: 'Quick Match Field', address: 'Auto-selected', city: profile.city },
          }])
          .select()
          .single();

        if (createError) {
          console.error('Error creating match:', createError);
          throw createError;
        }

        const { error: joinError } = await supabase
          .from('match_players')
          .insert([{ match_id: newMatch.id, user_id: profile.id }]);

        if (joinError) {
          console.error('Error joining created match:', joinError);
        }

        router.push(`/match/${newMatch.id}`);
      }
    } catch (error) {
      console.error('Quick match error:', error);
    } finally {
      setIsQuickMatchLoading(false);
    }
  };

  const filteredMatches = matches.filter((match) => {
    if (matchFilter === 'all') return true;
    return match.type === matchFilter;
  });

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Ready to compete?</Text>
            <Text style={styles.username}>
              {profileLoading ? 'Loading...' : profile?.username || 'Guest'}
            </Text>
          </View>
          {profile && (
            <TouchableOpacity style={styles.rankBadge}>
              <LinearGradient
                colors={rankInfo.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.rankGradient}
              >
                <Text style={styles.rankEmoji}>{rankInfo.icon}</Text>
                <Text style={styles.rankText}>{formatRank(profile.rank)}</Text>
                <Text style={styles.rankPoints}>{profile.rank.points} RP</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={handleQuickMatch}
            disabled={isQuickMatchLoading || !profile}
          >
            <LinearGradient
              colors={[Colors.colors.primary, Colors.colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryActionGradient}
            >
              {isQuickMatchLoading ? (
                <ActivityIndicator color={Colors.colors.textPrimary} size="small" />
              ) : (
                <Zap color={Colors.colors.textPrimary} size={28} strokeWidth={2.5} />
              )}
              <Text style={styles.primaryActionText}>Quick Match</Text>
              <Text style={styles.primaryActionSubtext}>
                {isQuickMatchLoading ? 'Finding match...' : 'Find match instantly'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => router.push('/match/create')}
          >
            <View style={styles.secondaryActionContent}>
              <Plus color={Colors.colors.primary} size={24} strokeWidth={2.5} />
              <Text style={styles.secondaryActionText}>Create Match</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Matches</Text>
          
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterChip, matchFilter === 'all' && styles.filterChipActive]}
              onPress={() => setMatchFilter('all')}
            >
              <Text style={[styles.filterChipText, matchFilter === 'all' && styles.filterChipTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, matchFilter === 'official' && styles.filterChipActive]}
              onPress={() => setMatchFilter('official')}
            >
              <Text style={[styles.filterChipText, matchFilter === 'official' && styles.filterChipTextActive]}>
                Official
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, matchFilter === 'friendly' && styles.filterChipActive]}
              onPress={() => setMatchFilter('friendly')}
            >
              <Text style={[styles.filterChipText, matchFilter === 'friendly' && styles.filterChipTextActive]}>
                Friendly
              </Text>
            </TouchableOpacity>
          </View>

          {isLoadingMatches ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={Colors.colors.primary} size="large" />
              <Text style={styles.loadingText}>Loading matches...</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.errorContainer}>
              <AlertCircle color={Colors.colors.error} size={48} />
              <Text style={styles.errorText}>Failed to load matches</Text>
              <Text style={styles.errorSubtext}>{errorMessage}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadMatches}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.matchList}>
              {filteredMatches.length > 0 ? (
                filteredMatches.map((match) => (
                  <MatchCard key={match.id} match={match} onUpdate={loadMatches} />
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No matches available</Text>
                  <Text style={styles.emptyStateSubtext}>Create a new match or try quick match</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function MatchCard({ match, onUpdate }: { match: Match; onUpdate: () => void }) {
  const router = useRouter();
  const hostRankInfo = RANK_INFO[match.host.rank.division];
  const isOfficial = match.type === 'official';

  return (
    <TouchableOpacity
      style={styles.matchCard}
      onPress={() => router.push(`/match/${match.id}`)}
    >
      <View style={styles.matchCardHeader}>
        <View style={styles.matchCardBadge}>
          {isOfficial ? (
            <Zap color={Colors.colors.warning} size={14} strokeWidth={2.5} />
          ) : (
            <Heart color={Colors.colors.success} size={14} strokeWidth={2.5} />
          )}
          <Text style={[styles.matchCardBadgeText, { color: isOfficial ? Colors.colors.warning : Colors.colors.success }]}>
            {isOfficial ? 'Official' : 'Friendly'}
          </Text>
        </View>
        <View style={styles.matchStatusRow}>
          {match.status === 'in_progress' && (
            <View style={[styles.statusBadge, styles.statusBadgeInProgress]}>
              <Play color={Colors.colors.success} size={12} fill={Colors.colors.success} />
              <Text style={styles.statusBadgeTextInProgress}>In Progress</Text>
            </View>
          )}
          {match.status === 'pending_validation' && (
            <View style={[styles.statusBadge, styles.statusBadgePending]}>
              <AlertCircle color={Colors.colors.warning} size={12} />
              <Text style={styles.statusBadgeTextPending}>Pending</Text>
            </View>
          )}
          <View style={styles.matchCardReward}>
            <Text style={styles.matchCardRewardText}>
              +{match.pointReward} / -{match.pointPenalty} RP
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.matchCardBody}>
        <View style={styles.matchHost}>
          <View style={[styles.matchHostAvatar, { borderColor: hostRankInfo.color }]}>
            <Text style={styles.matchHostAvatarText}>{match.host.username[0]}</Text>
          </View>
          <View style={styles.matchHostInfo}>
            <Text style={styles.matchHostName}>{match.host.username}</Text>
            <Text style={styles.matchHostRank}>{formatRank(match.host.rank)}</Text>
          </View>
        </View>

        <View style={styles.matchDetails}>
          <View style={styles.matchDetailRow}>
            <Users color={Colors.colors.textSecondary} size={16} />
            <Text style={styles.matchDetailText}>
              {match.players.length}/{match.maxPlayers} players
            </Text>
          </View>
          <View style={styles.matchDetailRow}>
            <MapPin color={Colors.colors.textSecondary} size={16} />
            <Text style={styles.matchDetailText}>{match.field.name}</Text>
          </View>
          {match.scheduledTime && (
            <View style={styles.matchDetailRow}>
              <Clock color={Colors.colors.textSecondary} size={16} />
              <Text style={styles.matchDetailText}>
                {new Date(match.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.matchCardFooter}>
        {match.status === 'in_progress' ? (
          <TouchableOpacity
            style={[styles.joinButton, styles.submitButton]}
            onPress={(e) => {
              e.stopPropagation();
              router.push(`/match/result/${match.id}`);
            }}
          >
            <Text style={styles.joinButtonText}>Submit Results</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.joinButton}
            onPress={(e) => {
              e.stopPropagation();
              router.push(`/match/${match.id}`);
            }}
          >
            <Text style={styles.joinButtonText}>View Match</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.colors.background,
  },
  header: {
    backgroundColor: Colors.colors.surface,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    color: Colors.colors.textSecondary,
    marginBottom: 4,
  },
  username: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  rankBadge: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  rankGradient: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rankEmoji: {
    fontSize: 20,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  rankPoints: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  quickActions: {
    marginBottom: 32,
  },
  primaryAction: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  primaryActionGradient: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  primaryActionText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  primaryActionSubtext: {
    fontSize: 14,
    color: Colors.colors.textPrimary,
    opacity: 0.8,
  },
  secondaryAction: {
    backgroundColor: Colors.colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.colors.border,
    borderStyle: 'dashed' as const,
  },
  secondaryActionContent: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.colors.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.colors.surface,
    borderWidth: 1,
    borderColor: Colors.colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.colors.primary,
    borderColor: Colors.colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.colors.textPrimary,
  },
  matchList: {
    gap: 16,
  },
  matchCard: {
    backgroundColor: Colors.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.colors.border,
    overflow: 'hidden',
  },
  matchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.colors.border,
  },
  matchCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  matchCardBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
  matchCardReward: {
    backgroundColor: Colors.colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  matchCardRewardText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.colors.textSecondary,
  },
  matchStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeInProgress: {
    backgroundColor: Colors.colors.success + '20',
  },
  statusBadgePending: {
    backgroundColor: Colors.colors.warning + '20',
  },
  statusBadgeTextInProgress: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.colors.success,
  },
  statusBadgeTextPending: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.colors.warning,
  },
  matchCardBody: {
    padding: 16,
  },
  matchHost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  matchHostAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.colors.surfaceLight,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchHostAvatarText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  matchHostInfo: {
    flex: 1,
  },
  matchHostName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
    marginBottom: 2,
  },
  matchHostRank: {
    fontSize: 14,
    color: Colors.colors.textSecondary,
  },
  matchDetails: {
    gap: 8,
  },
  matchDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchDetailText: {
    fontSize: 14,
    color: Colors.colors.textSecondary,
  },
  matchCardFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.colors.border,
  },
  joinButton: {
    backgroundColor: Colors.colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
  },
  submitButton: {
    backgroundColor: Colors.colors.success,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.colors.textSecondary,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.colors.textSecondary,
  },
  errorContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.colors.error,
    marginTop: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: Colors.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.colors.primary,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
  },
});
