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
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Trophy,
  Users,
  Calendar,
  DollarSign,
  Target,
  Award,
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { MOCK_TOURNAMENTS } from '@/mocks/data';
import { formatRank, RANK_INFO } from '@/constants/ranks';

export default function TournamentDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [isRegistered, setIsRegistered] = useState(false);

  const tournament =
    MOCK_TOURNAMENTS.find((t) => t.id === id) || MOCK_TOURNAMENTS[0];
  const minRankInfo = RANK_INFO[tournament.minRank.division];
  const spotsFilled = (tournament.participants / tournament.maxParticipants) * 100;
  const daysUntilStart = Math.ceil(
    (tournament.startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const handleRegister = () => {
    console.log('Registering for tournament:', tournament.id);
    setIsRegistered(true);
  };

  const handleUnregister = () => {
    console.log('Unregistering from tournament:', tournament.id);
    setIsRegistered(false);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={Colors.colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tournament</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.bannerCard}>
          <LinearGradient
            colors={['#F59E0B', '#EF4444']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bannerGradient}
          >
            <Trophy color={Colors.colors.textPrimary} size={48} strokeWidth={2.5} />
            <Text style={styles.tournamentName}>{tournament.name}</Text>
            {tournament.status === 'ongoing' && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveBadgeText}>LIVE NOW</Text>
              </View>
            )}
            {tournament.status === 'upcoming' && (
              <Text style={styles.startingSoon}>
                Starting in {daysUntilStart} {daysUntilStart === 1 ? 'day' : 'days'}
              </Text>
            )}
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{tournament.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tournament Details</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailCard}>
              <View
                style={[
                  styles.detailIcon,
                  { backgroundColor: Colors.colors.success + '20' },
                ]}
              >
                <DollarSign color={Colors.colors.success} size={24} strokeWidth={2.5} />
              </View>
              <Text style={styles.detailLabel}>Prize Pool</Text>
              <Text style={styles.detailValue}>
                ${tournament.prizePool.toLocaleString()}
              </Text>
            </View>

            <View style={styles.detailCard}>
              <View
                style={[
                  styles.detailIcon,
                  { backgroundColor: Colors.colors.primary + '20' },
                ]}
              >
                <Users color={Colors.colors.primary} size={24} strokeWidth={2.5} />
              </View>
              <Text style={styles.detailLabel}>Participants</Text>
              <Text style={styles.detailValue}>
                {tournament.participants}/{tournament.maxParticipants}
              </Text>
            </View>

            <View style={styles.detailCard}>
              <View
                style={[
                  styles.detailIcon,
                  { backgroundColor: Colors.colors.warning + '20' },
                ]}
              >
                <Target color={Colors.colors.warning} size={24} strokeWidth={2.5} />
              </View>
              <Text style={styles.detailLabel}>Entry Fee</Text>
              <Text style={styles.detailValue}>{tournament.entryFee} RP</Text>
            </View>

            <View style={styles.detailCard}>
              <View
                style={[
                  styles.detailIcon,
                  { backgroundColor: minRankInfo.color + '20' },
                ]}
              >
                <Text style={styles.detailEmoji}>{minRankInfo.icon}</Text>
              </View>
              <Text style={styles.detailLabel}>Min. Rank</Text>
              <Text style={styles.detailValue}>
                {formatRank(tournament.minRank)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tournament Schedule</Text>
          <View style={styles.scheduleCard}>
            <View style={styles.scheduleRow}>
              <View style={styles.scheduleIcon}>
                <Calendar color={Colors.colors.primary} size={20} strokeWidth={2.5} />
              </View>
              <View style={styles.scheduleContent}>
                <Text style={styles.scheduleLabel}>Start Date</Text>
                <Text style={styles.scheduleValue}>
                  {tournament.startDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>

            <View style={styles.scheduleDivider} />

            <View style={styles.scheduleRow}>
              <View style={styles.scheduleIcon}>
                <Calendar color={Colors.colors.primary} size={20} strokeWidth={2.5} />
              </View>
              <View style={styles.scheduleContent}>
                <Text style={styles.scheduleLabel}>End Date</Text>
                <Text style={styles.scheduleValue}>
                  {tournament.endDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Registration Progress</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressValue}>{Math.round(spotsFilled)}%</Text>
              <Text style={styles.progressLabel}>
                {tournament.participants} / {tournament.maxParticipants} registered
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${spotsFilled}%`,
                    backgroundColor:
                      spotsFilled >= 90
                        ? Colors.colors.danger
                        : Colors.colors.primary,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prize Distribution</Text>
          <View style={styles.prizesList}>
            {[
              { place: '1st Place', prize: tournament.prizePool * 0.5, icon: '🥇' },
              { place: '2nd Place', prize: tournament.prizePool * 0.3, icon: '🥈' },
              { place: '3rd Place', prize: tournament.prizePool * 0.2, icon: '🥉' },
            ].map((item) => (
              <View key={item.place} style={styles.prizeCard}>
                <Text style={styles.prizeEmoji}>{item.icon}</Text>
                <View style={styles.prizeInfo}>
                  <Text style={styles.prizePlace}>{item.place}</Text>
                  <Text style={styles.prizeMoney}>${item.prize.toLocaleString()}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        {!isRegistered ? (
          <TouchableOpacity style={styles.actionButton} onPress={handleRegister}>
            <LinearGradient
              colors={[Colors.colors.primary, Colors.colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionButtonGradient}
            >
              <Award color={Colors.colors.textPrimary} size={20} strokeWidth={2.5} />
              <Text style={styles.actionButtonText}>
                Register ({tournament.entryFee} RP)
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.unregisterButton]}
            onPress={handleUnregister}
          >
            <Text style={styles.unregisterButtonText}>Unregister</Text>
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
  bannerCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
  },
  bannerGradient: {
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  tournamentName: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
    textAlign: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
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
  startingSoon: {
    fontSize: 14,
    color: Colors.colors.textPrimary,
    opacity: 0.9,
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
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.colors.textSecondary,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.colors.border,
  },
  detailIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  detailEmoji: {
    fontSize: 28,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  scheduleCard: {
    backgroundColor: Colors.colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.colors.border,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  scheduleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleLabel: {
    fontSize: 12,
    color: Colors.colors.textSecondary,
    marginBottom: 4,
  },
  scheduleValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
  },
  scheduleDivider: {
    height: 1,
    backgroundColor: Colors.colors.border,
    marginVertical: 16,
  },
  progressCard: {
    backgroundColor: Colors.colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.colors.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  progressLabel: {
    fontSize: 14,
    color: Colors.colors.textSecondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  prizesList: {
    gap: 12,
  },
  prizeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.colors.border,
  },
  prizeEmoji: {
    fontSize: 32,
  },
  prizeInfo: {
    flex: 1,
  },
  prizePlace: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
    marginBottom: 4,
  },
  prizeMoney: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.colors.success,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  unregisterButton: {
    backgroundColor: Colors.colors.danger,
  },
  unregisterButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
    paddingVertical: 16,
    textAlign: 'center',
  },
});
