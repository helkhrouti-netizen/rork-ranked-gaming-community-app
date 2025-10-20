import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Settings,
  TrendingUp,
  Award,
  Target,
  Clock,
  Zap,
  Heart,
  Star,
  ShieldAlert,
  Activity,
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { MOCK_MATCH_HISTORY } from '@/mocks/data';
import { formatRank, RANK_INFO, getNextRankPoints } from '@/constants/ranks';
import { useUserProfile } from '@/contexts/UserProfileContext';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, isAuthenticated, isOnboarded, isLoading } = useUserProfile();
  
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/auth/login');
      } else if (!isOnboarded) {
        router.replace('/onboarding');
      }
    }
  }, [isLoading, isAuthenticated, isOnboarded]);
  
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.colors.primary} />
      </View>
    );
  }
  
  if (!profile) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Loading profile...</Text>
      </View>
    );
  }
  
  const player = profile;
  const rankInfo = RANK_INFO[player.rank.division];
  const nextRankPoints = getNextRankPoints(player.rank.points);
  const progressToNext = ((player.rank.points % 250) / 250) * 100;
  const winRate = ((player.wins / (player.wins + player.losses)) * 100).toFixed(1);
  const totalMatches = player.wins + player.losses;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
          >
            <Settings color={Colors.colors.textSecondary} size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <LinearGradient
            colors={rankInfo.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileGradient}
          >
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatar}>
                {player.profilePicture ? (
                  <Image 
                    source={{ uri: player.profilePicture }}
                    style={styles.profileAvatarImage}
                  />
                ) : (
                  <Text style={styles.profileAvatarText}>{player.username[0]}</Text>
                )}
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{player.username}</Text>
                <Text style={styles.profileLevel}>Level {player.level}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.rankCard}>
          <View style={styles.rankCardHeader}>
            <View style={styles.rankCardTitleRow}>
              <Text style={styles.rankCardTitle}>Current Rank</Text>
              <View style={styles.rankBadge}>
                <Text style={styles.rankEmoji}>{rankInfo.icon}</Text>
                <Text style={styles.rankText}>{formatRank(player.rank)}</Text>
              </View>
            </View>
            <Text style={styles.rankPoints}>{player.rank.points} RP</Text>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress to next level</Text>
              <Text style={styles.progressValue}>{nextRankPoints - player.rank.points} RP needed</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${progressToNext}%` }]} />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: Colors.colors.success + '20' }]}>
              <TrendingUp color={Colors.colors.success} size={24} strokeWidth={2.5} />
            </View>
            <Text style={styles.statValue}>{winRate}%</Text>
            <Text style={styles.statLabel}>Win Rate</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: Colors.colors.primary + '20' }]}>
              <Target color={Colors.colors.primary} size={24} strokeWidth={2.5} />
            </View>
            <Text style={styles.statValue}>{totalMatches}</Text>
            <Text style={styles.statLabel}>Total Matches</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: Colors.colors.warning + '20' }]}>
              <Star color={Colors.colors.warning} size={24} strokeWidth={2.5} fill={Colors.colors.warning} />
            </View>
            <View style={styles.reputationRow}>
              <Text style={styles.statValue}>{player.reputation.toFixed(1)}</Text>
              <Star color={Colors.colors.warning} size={16} fill={Colors.colors.warning} />
            </View>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: Colors.colors.accent + '20' }]}>
              <Award color={Colors.colors.accent} size={24} strokeWidth={2.5} />
            </View>
            <Text style={styles.statValue}>{player.wins}</Text>
            <Text style={styles.statLabel}>Wins</Text>
          </View>
        </View>

        <View style={styles.reputationCard}>
          <View style={styles.reputationHeader}>
            <Star color={Colors.colors.warning} size={24} fill={Colors.colors.warning} />
            <Text style={styles.reputationTitle}>Player Reputation</Text>
          </View>
          <View style={styles.reputationStars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                color={Colors.colors.warning}
                size={32}
                fill={star <= Math.round(player.reputation) ? Colors.colors.warning : 'transparent'}
              />
            ))}
          </View>
          <Text style={styles.reputationScore}>
            {player.reputation.toFixed(1)} average from 128 ratings
          </Text>
          <View style={styles.reputationBadges}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🏆 Fair Player</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🤝 Team Player</Text>
            </View>
          </View>
          <View style={styles.reportStatus}>
            <ShieldAlert color={Colors.colors.success} size={16} />
            <Text style={styles.reportStatusText}>No reports • Clean record</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Developer</Text>
          <TouchableOpacity
            style={styles.diagnosticsButton}
            onPress={() => router.push('/firebase-diagnostics' as any)}
            testID="firebase-diagnostics-button"
          >
            <View style={styles.diagnosticsIcon}>
              <Activity color={Colors.colors.primary} size={20} />
            </View>
            <Text style={styles.diagnosticsButtonText}>Firebase Diagnostics</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Match History</Text>
          <View style={styles.matchHistory}>
            {MOCK_MATCH_HISTORY.map((history) => (
              <View key={history.id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <View style={styles.historyBadge}>
                    {history.match.type === 'official' ? (
                      <Zap color={Colors.colors.warning} size={14} strokeWidth={2.5} />
                    ) : (
                      <Heart color={Colors.colors.success} size={14} strokeWidth={2.5} />
                    )}
                    <Text style={[
                      styles.historyBadgeText,
                      { color: history.match.type === 'official' ? Colors.colors.warning : Colors.colors.success }
                    ]}>
                      {history.match.type === 'official' ? 'Official' : 'Friendly'}
                    </Text>
                  </View>
                  <View style={styles.historyDate}>
                    <Clock color={Colors.colors.textMuted} size={12} />
                    <Text style={styles.historyDateText}>
                      {new Date(history.date).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                <View style={styles.historyBody}>
                  <View style={[
                    styles.resultBadge,
                    { backgroundColor: history.result === 'win' ? Colors.colors.success + '20' : Colors.colors.danger + '20' }
                  ]}>
                    <Text style={[
                      styles.resultText,
                      { color: history.result === 'win' ? Colors.colors.success : Colors.colors.danger }
                    ]}>
                      {history.result === 'win' ? 'Victory' : 'Defeat'}
                    </Text>
                  </View>
                  <View style={styles.pointsChange}>
                    <Text style={[
                      styles.pointsChangeText,
                      { color: history.pointsChange > 0 ? Colors.colors.success : Colors.colors.danger }
                    ]}>
                      {history.pointsChange > 0 ? '+' : ''}{history.pointsChange} RP
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  profileCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  profileGradient: {
    padding: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileAvatarText: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  profileAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
    marginBottom: 4,
  },
  profileLevel: {
    fontSize: 16,
    color: Colors.colors.textPrimary,
    opacity: 0.9,
  },
  rankCard: {
    backgroundColor: Colors.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.colors.border,
  },
  rankCardHeader: {
    marginBottom: 20,
  },
  rankCardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rankCardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.colors.textSecondary,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.colors.surfaceLight,
    borderRadius: 12,
  },
  rankEmoji: {
    fontSize: 16,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  rankPoints: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  progressSection: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    color: Colors.colors.textSecondary,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.colors.primary,
  },
  progressBarContainer: {
    marginTop: 4,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: Colors.colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.colors.primary,
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.colors.border,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.colors.textSecondary,
  },
  reputationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reputationCard: {
    backgroundColor: Colors.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.colors.border,
    alignItems: 'center',
  },
  reputationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  reputationTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  reputationStars: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  reputationScore: {
    fontSize: 14,
    color: Colors.colors.textSecondary,
    marginBottom: 16,
  },
  reputationBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.colors.primary + '20',
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.colors.primary,
  },
  reportStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.colors.success + '15',
    borderRadius: 8,
  },
  reportStatusText: {
    fontSize: 12,
    color: Colors.colors.success,
    fontWeight: '600' as const,
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
  matchHistory: {
    gap: 12,
  },
  historyCard: {
    backgroundColor: Colors.colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.colors.border,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
  historyDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyDateText: {
    fontSize: 12,
    color: Colors.colors.textMuted,
  },
  historyBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resultText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  pointsChange: {
    alignItems: 'flex-end',
  },
  pointsChangeText: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  errorText: {
    fontSize: 16,
    color: Colors.colors.textSecondary,
    textAlign: 'center' as const,
  },
  diagnosticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.colors.border,
    gap: 12,
  },
  diagnosticsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diagnosticsButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
  },
});
