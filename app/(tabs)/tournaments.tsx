import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar,
  Users,
  DollarSign,
  Trophy,
  Clock,
  ChevronRight,
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { MOCK_TOURNAMENTS } from '@/mocks/data';
import { formatRank, RANK_INFO } from '@/constants/ranks';
import { Tournament } from '@/types';

export default function TournamentsScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'ongoing'>('all');

  const filteredTournaments = MOCK_TOURNAMENTS.filter((tournament) => {
    if (filter === 'all') return true;
    return tournament.status === filter;
  });

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerContent}>
          <Calendar color={Colors.colors.primary} size={32} strokeWidth={2.5} />
          <Text style={styles.headerTitle}>Tournaments</Text>
        </View>
        <Text style={styles.headerSubtitle}>Compete for glory and prizes</Text>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'upcoming' && styles.filterChipActive]}
          onPress={() => setFilter('upcoming')}
        >
          <Text style={[styles.filterChipText, filter === 'upcoming' && styles.filterChipTextActive]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'ongoing' && styles.filterChipActive]}
          onPress={() => setFilter('ongoing')}
        >
          <Text style={[styles.filterChipText, filter === 'ongoing' && styles.filterChipTextActive]}>
            Ongoing
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {filteredTournaments.length > 0 ? (
          filteredTournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No tournaments found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function TournamentCard({ tournament }: { tournament: Tournament }) {
  const router = useRouter();
  const minRankInfo = RANK_INFO[tournament.minRank.division];
  const isOngoing = tournament.status === 'ongoing';
  const isUpcoming = tournament.status === 'upcoming';
  const spotsFilled = (tournament.participants / tournament.maxParticipants) * 100;

  const daysUntilStart = Math.ceil(
    (tournament.startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <TouchableOpacity
      style={styles.tournamentCard}
      onPress={() => router.push(`/tournament/${tournament.id}`)}
    >
      <View style={styles.tournamentHeader}>
        {isOngoing && (
          <View style={styles.liveBadge}>
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.liveBadgeGradient}
            >
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </LinearGradient>
          </View>
        )}
        {isUpcoming && (
          <View style={styles.upcomingBadge}>
            <Clock color={Colors.colors.warning} size={14} strokeWidth={2.5} />
            <Text style={styles.upcomingBadgeText}>
              Starts in {daysUntilStart} {daysUntilStart === 1 ? 'day' : 'days'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.tournamentBody}>
        <View style={styles.tournamentTitle}>
          <Trophy color={Colors.colors.warning} size={24} strokeWidth={2.5} />
          <Text style={styles.tournamentName}>{tournament.name}</Text>
        </View>
        <Text style={styles.tournamentDescription}>{tournament.description}</Text>

        <View style={styles.tournamentDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <DollarSign color={Colors.colors.success} size={18} strokeWidth={2.5} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Prize Pool</Text>
              <Text style={styles.detailValue}>${tournament.prizePool.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Users color={Colors.colors.primary} size={18} strokeWidth={2.5} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Participants</Text>
              <Text style={styles.detailValue}>
                {tournament.participants}/{tournament.maxParticipants}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Text style={styles.detailEmoji}>{minRankInfo.icon}</Text>
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Min. Rank</Text>
              <Text style={styles.detailValue}>{formatRank(tournament.minRank)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Tournament Capacity</Text>
            <Text style={styles.progressPercentage}>{Math.round(spotsFilled)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${spotsFilled}%`,
                    backgroundColor: spotsFilled >= 90 ? Colors.colors.danger : Colors.colors.primary,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.tournamentFooter}>
        <View style={styles.entryFee}>
          <Text style={styles.entryFeeLabel}>Entry Fee</Text>
          <Text style={styles.entryFeeValue}>{tournament.entryFee} RP</Text>
        </View>
        <TouchableOpacity
          style={styles.joinTournamentButton}
          onPress={() => router.push(`/tournament/${tournament.id}`)}
        >
          <Text style={styles.joinTournamentButtonText}>View Details</Text>
          <ChevronRight color={Colors.colors.textPrimary} size={18} strokeWidth={2.5} />
        </TouchableOpacity>
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
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.colors.border,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.colors.surfaceLight,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  tournamentCard: {
    backgroundColor: Colors.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.colors.border,
    overflow: 'hidden',
  },
  tournamentHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.colors.border,
  },
  liveBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    overflow: 'hidden',
  },
  liveBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.colors.textPrimary,
  },
  liveBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  upcomingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.colors.warning + '20',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  upcomingBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.colors.warning,
  },
  tournamentBody: {
    padding: 20,
  },
  tournamentTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  tournamentName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
    flex: 1,
  },
  tournamentDescription: {
    fontSize: 14,
    color: Colors.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  tournamentDetails: {
    gap: 12,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailEmoji: {
    fontSize: 20,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600' as const,
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
    fontSize: 12,
    color: Colors.colors.textSecondary,
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  progressBar: {
    height: 6,
  },
  progressBarBackground: {
    flex: 1,
    backgroundColor: Colors.colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  tournamentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.colors.border,
  },
  entryFee: {
    gap: 2,
  },
  entryFeeLabel: {
    fontSize: 12,
    color: Colors.colors.textSecondary,
  },
  entryFeeValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  joinTournamentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  joinTournamentButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
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
