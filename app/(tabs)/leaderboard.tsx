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
import { Trophy, Medal, Award } from 'lucide-react-native';

import Colors from '@/constants/colors';
import { formatRank, RANK_INFO, RankDivision, RankLevel } from '@/constants/ranks';
import { Player } from '@/types';
import { db } from '@/lib/firebase';
import { collection, query, orderBy as firestoreOrderBy, onSnapshot, limit } from 'firebase/firestore';

type FilterOption = RankDivision | 'all' | `${RankDivision}-${RankLevel}`;

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>('all');
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, firestoreOrderBy('rank.points', 'desc'), limit(100));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const formattedPlayers: Player[] = snapshot.docs.map((doc) => {
            const userData = doc.data();
            return {
              id: doc.id,
              username: userData.username || 'User',
              rank: userData.rank || { division: 'Cuivre', level: 1, points: 0 },
              city: userData.city || 'CASABLANCA',
              wins: userData.wins || 0,
              losses: userData.losses || 0,
              reputation: userData.reputation || 0,
              level: userData.level || 1,
            };
          });
          setPlayers(formattedPlayers);
          setIsLoading(false);
        } catch (error) {
          console.error('Error loading players:', error);
          setIsLoading(false);
        }
      },
      (error) => {
        console.error('Error listening to players:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);



  const filteredPlayers = players.filter((player) => {
    if (selectedFilter === 'all') return true;
    
    if (selectedFilter.includes('-')) {
      const [division, level] = selectedFilter.split('-');
      return player.rank.division === division && player.rank.level.toString() === level;
    }
    
    return player.rank.division === selectedFilter;
  }).sort((a, b) => b.rank.points - a.rank.points);

  const divisions: RankDivision[] = ['Diamond', 'Platinum', 'Gold', 'Silver', 'Cuivre'];
  const subRankLevels: RankLevel[] = [1, 2, 3];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerContent}>
          <Trophy color={Colors.colors.primary} size={32} strokeWidth={2.5} />
          <Text style={styles.headerTitle}>Leaderboard</Text>
        </View>
        <Text style={styles.headerSubtitle}>Compete with the best players</Text>
      </View>

      <View>
        <ScrollView
          horizontal
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
          showsHorizontalScrollIndicator={false}
        >
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === 'all' && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedFilter === 'all' && styles.filterButtonTextActive,
              ]}
            >
              All Ranks
            </Text>
          </TouchableOpacity>
          {divisions.map((division) => (
            <TouchableOpacity
              key={division}
              style={[
                styles.filterButton,
                selectedFilter === division && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter(division)}
            >
              <Text style={styles.filterEmoji}>
                {RANK_INFO[division].icon}
              </Text>
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === division && styles.filterButtonTextActive,
                ]}
              >
                {division}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selectedFilter !== 'all' && !selectedFilter.includes('-') && (
          <ScrollView
            horizontal
            style={styles.subFilterScroll}
            contentContainerStyle={styles.filterContent}
            showsHorizontalScrollIndicator={false}
          >
            {subRankLevels.map((level) => {
              const subFilter = `${selectedFilter}-${level}` as FilterOption;
              return (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.subFilterButton,
                    selectedFilter === subFilter && styles.subFilterButtonActive,
                  ]}
                  onPress={() => setSelectedFilter(subFilter)}
                >
                  <Text
                    style={[
                      styles.subFilterButtonText,
                      selectedFilter === subFilter && styles.subFilterButtonTextActive,
                    ]}
                  >
                    Level {level}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.colors.primary} size="large" />
            <Text style={styles.loadingText}>Loading leaderboard...</Text>
          </View>
        ) : filteredPlayers.length > 0 ? (
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
            <Text style={styles.emptyStateSubtext}>Try selecting a different rank</Text>
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
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.colors.textSecondary,
  },
  subFilterScroll: {
    backgroundColor: Colors.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.colors.border,
  },
  subFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.colors.border,
  },
  subFilterButtonActive: {
    backgroundColor: Colors.colors.primary + '40',
    borderColor: Colors.colors.primary,
  },
  subFilterButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.colors.textSecondary,
  },
  subFilterButtonTextActive: {
    color: Colors.colors.primary,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.colors.textSecondary,
  },
});
