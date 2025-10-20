import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trophy, Medal, Award } from 'lucide-react-native';

import Colors from '@/constants/colors';
import { MOCK_LEADERBOARD } from '@/mocks/data';
import { formatRank, RANK_INFO, RankDivision } from '@/constants/ranks';
import { Player } from '@/types';

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const [selectedDivision, setSelectedDivision] = useState<RankDivision | 'all'>('all');

  const filteredPlayers = MOCK_LEADERBOARD.filter((player) => {
    if (selectedDivision === 'all') return true;
    return player.rank.division === selectedDivision;
  }).sort((a, b) => b.rank.points - a.rank.points);

  const divisions: (RankDivision | 'all')[] = ['all', 'Diamond', 'Platinum', 'Gold', 'Silver', 'Cuivre'];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerContent}>
          <Trophy color={Colors.colors.primary} size={32} strokeWidth={2.5} />
          <Text style={styles.headerTitle}>Leaderboard</Text>
        </View>
        <Text style={styles.headerSubtitle}>Compete with the best players</Text>
      </View>

      <ScrollView
        horizontal
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
        showsHorizontalScrollIndicator={false}
      >
        {divisions.map((division) => (
          <TouchableOpacity
            key={division}
            style={[
              styles.filterButton,
              selectedDivision === division && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedDivision(division)}
          >
            {division !== 'all' && (
              <Text style={styles.filterEmoji}>
                {RANK_INFO[division as RankDivision].icon}
              </Text>
            )}
            <Text
              style={[
                styles.filterButtonText,
                selectedDivision === division && styles.filterButtonTextActive,
              ]}
            >
              {division === 'all' ? 'All Ranks' : division}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {filteredPlayers.length > 0 ? (
          <>
            {filteredPlayers.slice(0, 3).map((player, index) => (
              <TopPlayerCard key={player.id} player={player} position={index + 1} />
            ))}
            
            {filteredPlayers.length > 3 && (
              <View style={styles.restSection}>
                {filteredPlayers.slice(3).map((player, index) => (
                  <PlayerRow key={player.id} player={player} position={index + 4} />
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No players found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function TopPlayerCard({ player, position }: { player: Player; position: number }) {
  const rankInfo = RANK_INFO[player.rank.division];
  const winRate = ((player.wins / (player.wins + player.losses)) * 100).toFixed(0);
  
  const positionIcon = position === 1 ? Trophy : position === 2 ? Medal : Award;
  const PositionIcon = positionIcon;
  const positionColor = position === 1 ? '#FFD700' : position === 2 ? '#C0C0C0' : '#CD7F32';

  return (
    <View style={styles.topPlayerCard}>
      <LinearGradient
        colors={[Colors.colors.surfaceLight, Colors.colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.topPlayerGradient}
      >
        <View style={styles.topPlayerHeader}>
          <View style={styles.positionBadge}>
            <PositionIcon color={positionColor} size={24} strokeWidth={2.5} />
          </View>
          <View style={[styles.topPlayerAvatar, { borderColor: rankInfo.color }]}>
            <Text style={styles.topPlayerAvatarText}>{player.username[0]}</Text>
          </View>
          <View style={styles.topPlayerInfo}>
            <Text style={styles.topPlayerName}>{player.username}</Text>
            <View style={styles.topPlayerRankBadge}>
              <Text style={styles.topPlayerRankEmoji}>{rankInfo.icon}</Text>
              <Text style={styles.topPlayerRank}>{formatRank(player.rank)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.topPlayerStats}>
          <View style={styles.topPlayerStat}>
            <Text style={styles.topPlayerStatLabel}>RP</Text>
            <Text style={styles.topPlayerStatValue}>{player.rank.points}</Text>
          </View>
          <View style={styles.topPlayerStat}>
            <Text style={styles.topPlayerStatLabel}>Win Rate</Text>
            <Text style={styles.topPlayerStatValue}>{winRate}%</Text>
          </View>
          <View style={styles.topPlayerStat}>
            <Text style={styles.topPlayerStatLabel}>Matches</Text>
            <Text style={styles.topPlayerStatValue}>{player.wins + player.losses}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

function PlayerRow({ player, position }: { player: Player; position: number }) {
  const rankInfo = RANK_INFO[player.rank.division];
  const winRate = ((player.wins / (player.wins + player.losses)) * 100).toFixed(0);

  return (
    <View style={styles.playerRow}>
      <View style={styles.playerRowLeft}>
        <View style={styles.positionNumber}>
          <Text style={styles.positionNumberText}>{position}</Text>
        </View>
        <View style={[styles.playerRowAvatar, { borderColor: rankInfo.color }]}>
          <Text style={styles.playerRowAvatarText}>{player.username[0]}</Text>
        </View>
        <View style={styles.playerRowInfo}>
          <Text style={styles.playerRowName}>{player.username}</Text>
          <View style={styles.playerRowRank}>
            <Text style={styles.playerRowRankEmoji}>{rankInfo.icon}</Text>
            <Text style={styles.playerRowRankText}>{formatRank(player.rank)}</Text>
          </View>
        </View>
      </View>
      <View style={styles.playerRowRight}>
        <Text style={styles.playerRowPoints}>{player.rank.points} RP</Text>
        <Text style={styles.playerRowWinRate}>{winRate}% WR</Text>
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
    backgroundColor: Colors.colors.surface,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.colors.textSecondary,
  },
  filterScroll: {
    backgroundColor: Colors.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.colors.border,
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.colors.primary,
    borderColor: Colors.colors.primary,
  },
  filterEmoji: {
    fontSize: 16,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.colors.textSecondary,
  },
  filterButtonTextActive: {
    color: Colors.colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  topPlayerCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.colors.border,
  },
  topPlayerGradient: {
    padding: 20,
  },
  topPlayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  positionBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topPlayerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.colors.background,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topPlayerAvatarText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  topPlayerInfo: {
    flex: 1,
  },
  topPlayerName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
    marginBottom: 4,
  },
  topPlayerRankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topPlayerRankEmoji: {
    fontSize: 16,
  },
  topPlayerRank: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.colors.textSecondary,
  },
  topPlayerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.colors.border,
  },
  topPlayerStat: {
    alignItems: 'center',
  },
  topPlayerStatLabel: {
    fontSize: 12,
    color: Colors.colors.textSecondary,
    marginBottom: 4,
  },
  topPlayerStatValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  restSection: {
    gap: 12,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.colors.border,
  },
  playerRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  positionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionNumberText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.colors.textSecondary,
  },
  playerRowAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.colors.surfaceLight,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerRowAvatarText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  playerRowInfo: {
    flex: 1,
  },
  playerRowName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
    marginBottom: 2,
  },
  playerRowRank: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playerRowRankEmoji: {
    fontSize: 12,
  },
  playerRowRankText: {
    fontSize: 12,
    color: Colors.colors.textSecondary,
  },
  playerRowRight: {
    alignItems: 'flex-end',
  },
  playerRowPoints: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
    marginBottom: 2,
  },
  playerRowWinRate: {
    fontSize: 12,
    color: Colors.colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.colors.textSecondary,
  },
});
