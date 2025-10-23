import React, { useState, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Users,
  MapPin,
  Clock,
  Zap,
  Heart,
  Trophy,
  MessageCircle,
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { formatRank, RANK_INFO } from '@/constants/ranks';
import { Match, Player } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { mockDataProvider, MockUser } from '@/lib/mockData';

export default function MatchDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [isLeaving, setIsLeaving] = useState<boolean>(false);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;
    loadMatch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadMatch = async () => {
    if (!id || typeof id !== 'string') return;

    try {
      setIsLoading(true);
      await mockDataProvider.initialize();
      
      const mockMatch = await mockDataProvider.getMatch(id);

      if (!mockMatch) {
        console.error('Match not found');
        return;
      }

      const host = await mockDataProvider.getUser(mockMatch.hostId);
      const matchPlayers = await mockDataProvider.getMatchPlayers(id);

      if (!host) {
        console.error('Host not found');
        return;
      }

      const safeMatchPlayers = Array.isArray(matchPlayers) ? matchPlayers : [];

      const formattedMatch: Match = {
        id: mockMatch.id,
        type: mockMatch.type,
        status: mockMatch.status,
        host: convertMockUserToPlayer(host),
        players: safeMatchPlayers.map(convertMockUserToPlayer),
        maxPlayers: mockMatch.maxPlayers,
        field: mockMatch.field,
        scheduledTime: mockMatch.scheduledTime,
        pointReward: mockMatch.pointReward,
        pointPenalty: mockMatch.pointPenalty,
        createdAt: mockMatch.createdAt,
        playerPositions: mockMatch.playerPositions || [],
        chatRoomId: mockMatch.chatRoomId || '',
      };

      setMatch(formattedMatch);
    } catch (error) {
      console.error('Error loading match:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const convertMockUserToPlayer = (user: MockUser): Player => ({
    id: user.id,
    username: user.username,
    rank: user.rank,
    avatar: user.profilePicture,
    city: user.city,
    wins: user.wins,
    losses: user.losses,
    reputation: user.reputation,
    level: user.level,
  });

  const handleJoinMatch = async () => {
    if (!user || !match || typeof id !== 'string') return;

    try {
      setIsJoining(true);
      await mockDataProvider.initialize();
      await mockDataProvider.joinMatch(id, user.id);
      await loadMatch();
    } catch (error) {
      console.error('Error joining match:', error);
      alert(error instanceof Error ? error.message : 'Failed to join match');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveMatch = async () => {
    if (!user || !match || typeof id !== 'string') return;

    try {
      setIsLeaving(true);
      await mockDataProvider.initialize();
      await mockDataProvider.leaveMatch(id, user.id);
      await loadMatch();
    } catch (error) {
      console.error('Error leaving match:', error);
      alert(error instanceof Error ? error.message : 'Failed to leave match');
    } finally {
      setIsLeaving(false);
    }
  };

  if (isLoading || !match) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator color={Colors.colors.primary} size="large" />
        <Text style={styles.loadingText}>Loading match...</Text>
      </View>
    );
  }

  const hostRankInfo = RANK_INFO[match.host.rank.division];
  const isOfficial = match.type === 'official';
  const hasJoined = user ? match.players.some((p) => p.id === user.id) : false;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={Colors.colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Match Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.matchTypeCard}>
          <View style={styles.matchTypeBadge}>
            {isOfficial ? (
              <Zap color={Colors.colors.warning} size={20} strokeWidth={2.5} />
            ) : (
              <Heart color={Colors.colors.success} size={20} strokeWidth={2.5} />
            )}
            <Text
              style={[
                styles.matchTypeText,
                { color: isOfficial ? Colors.colors.warning : Colors.colors.success },
              ]}
            >
              {isOfficial ? 'Official Match' : 'Friendly Match'}
            </Text>
          </View>

          <View style={styles.pointsDisplay}>
            <View style={styles.pointsBox}>
              <Text style={styles.pointsBoxLabel}>Win Reward</Text>
              <Text style={[styles.pointsBoxValue, { color: Colors.colors.success }]}>
                +{match.pointReward} RP
              </Text>
            </View>
            <View style={styles.pointsBoxDivider} />
            <View style={styles.pointsBox}>
              <Text style={styles.pointsBoxLabel}>Loss Penalty</Text>
              <Text style={[styles.pointsBoxValue, { color: Colors.colors.danger }]}>
                -{match.pointPenalty} RP
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Match Host</Text>
          <View style={styles.hostCard}>
            <View style={[styles.hostAvatar, { borderColor: hostRankInfo.color }]}>
              <Text style={styles.hostAvatarText}>{match.host.username[0]}</Text>
            </View>
            <View style={styles.hostInfo}>
              <Text style={styles.hostName}>{match.host.username}</Text>
              <View style={styles.hostRank}>
                <Text style={styles.hostRankEmoji}>{hostRankInfo.icon}</Text>
                <Text style={styles.hostRankText}>{formatRank(match.host.rank)}</Text>
              </View>
              <View style={styles.hostStats}>
                <View style={styles.hostStat}>
                  <Trophy color={Colors.colors.warning} size={14} strokeWidth={2.5} />
                  <Text style={styles.hostStatText}>{match.host.wins} wins</Text>
                </View>
                <View style={styles.hostStat}>
                  <Text style={styles.hostStatText}>
                    {((match.host.wins / (match.host.wins + match.host.losses)) * 100).toFixed(0)}%
                    WR
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.messageButton}>
              <MessageCircle color={Colors.colors.primary} size={20} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Match Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Users color={Colors.colors.primary} size={20} strokeWidth={2.5} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Players</Text>
                <Text style={styles.infoValue}>
                  {match.players.length}/{match.maxPlayers}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <MapPin color={Colors.colors.primary} size={20} strokeWidth={2.5} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Field</Text>
                <Text style={styles.infoValue}>{match.field.name}</Text>
              </View>
            </View>

            {match.scheduledTime && (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Clock color={Colors.colors.primary} size={20} strokeWidth={2.5} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Scheduled Time</Text>
                  <Text style={styles.infoValue}>
                    {new Date(match.scheduledTime).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Players ({match.players.length}/{match.maxPlayers})
          </Text>
          <View style={styles.playersList}>
            {match.players.map((player) => {
              const playerRankInfo = RANK_INFO[player.rank.division];
              return (
                <View key={player.id} style={styles.playerCard}>
                  <View style={[styles.playerAvatar, { borderColor: playerRankInfo.color }]}>
                    <Text style={styles.playerAvatarText}>{player.username[0]}</Text>
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>{player.username}</Text>
                    <View style={styles.playerRank}>
                      <Text style={styles.playerRankEmoji}>{playerRankInfo.icon}</Text>
                      <Text style={styles.playerRankText}>{formatRank(player.rank)}</Text>
                    </View>
                  </View>
                  {player.id === match.host.id && (
                    <View style={styles.hostBadge}>
                      <Text style={styles.hostBadgeText}>HOST</Text>
                    </View>
                  )}
                </View>
              );
            })}

            {match.players.length < match.maxPlayers &&
              Array.from({ length: match.maxPlayers - match.players.length }).map((_, index) => (
                <View key={`empty-${index}`} style={styles.emptyPlayerCard}>
                  <View style={styles.emptyPlayerAvatar}>
                    <Users color={Colors.colors.textMuted} size={20} />
                  </View>
                  <Text style={styles.emptyPlayerText}>Waiting for player...</Text>
                </View>
              ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        {match.status === 'in_progress' ? (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/match/result/${match.id}`)}
            disabled={!hasJoined}
          >
            <LinearGradient
              colors={[Colors.colors.success, '#0EA575']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionButtonGradient}
            >
              <Text style={styles.actionButtonText}>Submit Results</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : !hasJoined ? (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleJoinMatch}
            disabled={isJoining || !user || match.players.length >= match.maxPlayers}
            testID="join-match-button"
          >
            <LinearGradient
              colors={[Colors.colors.primary, Colors.colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionButtonGradient}
            >
              {isJoining ? (
                <ActivityIndicator color={Colors.colors.textPrimary} size="small" />
              ) : (
                <Text style={styles.actionButtonText}>
                  {match.players.length >= match.maxPlayers ? 'Match Full' : 'Join Match'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.leaveButton]}
            onPress={handleLeaveMatch}
            disabled={isLeaving}
          >
            {isLeaving ? (
              <ActivityIndicator
                color={Colors.colors.textPrimary}
                size="small"
                style={{ paddingVertical: 16 }}
              />
            ) : (
              <Text style={styles.leaveButtonText}>Leave Match</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  matchTypeCard: {
    backgroundColor: Colors.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.colors.border,
  },
  matchTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  matchTypeText: {
    fontSize: 18,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
  pointsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsBox: {
    flex: 1,
    alignItems: 'center',
  },
  pointsBoxLabel: {
    fontSize: 12,
    color: Colors.colors.textSecondary,
    marginBottom: 8,
  },
  pointsBoxValue: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  pointsBoxDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.colors.border,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
    marginBottom: 16,
  },
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.colors.border,
  },
  hostAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.colors.surfaceLight,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostAvatarText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  hostInfo: {
    flex: 1,
  },
  hostName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
    marginBottom: 4,
  },
  hostRank: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  hostRankEmoji: {
    fontSize: 14,
  },
  hostRankText: {
    fontSize: 14,
    color: Colors.colors.textSecondary,
  },
  hostStats: {
    flexDirection: 'row',
    gap: 12,
  },
  hostStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hostStatText: {
    fontSize: 12,
    color: Colors.colors.textSecondary,
  },
  messageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    backgroundColor: Colors.colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
  },
  playersList: {
    gap: 12,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.colors.border,
  },
  playerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.colors.surfaceLight,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerAvatarText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
    marginBottom: 2,
  },
  playerRank: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playerRankEmoji: {
    fontSize: 12,
  },
  playerRankText: {
    fontSize: 12,
    color: Colors.colors.textSecondary,
  },
  hostBadge: {
    backgroundColor: Colors.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  hostBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  emptyPlayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.colors.border,
    borderStyle: 'dashed' as const,
  },
  emptyPlayerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPlayerText: {
    fontSize: 14,
    color: Colors.colors.textMuted,
    fontStyle: 'italic' as const,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: Colors.colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.colors.border,
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  leaveButton: {
    backgroundColor: Colors.colors.danger,
  },
  leaveButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
    paddingVertical: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.colors.textSecondary,
  },
});
