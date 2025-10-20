import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import {
  ArrowLeft,
  Star,
  AlertTriangle,
  Check,
  X,
  Flag,
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { Player, PlayerRating } from '@/types';
import { RANK_INFO } from '@/constants/ranks';

interface PlayerWithRating extends Player {
  rating?: number;
  comment?: string;
}

const MOCK_TEAM1: Player[] = [
  {
    id: 'p1',
    username: 'Player1',
    rank: { division: 'Gold', level: 2, points: 2500 },
    city: 'CASABLANCA',
    wins: 45,
    losses: 20,
    reputation: 4.5,
    level: 25,
  },
  {
    id: 'p2',
    username: 'Player2',
    rank: { division: 'Gold', level: 1, points: 2200 },
    city: 'CASABLANCA',
    wins: 38,
    losses: 22,
    reputation: 4.3,
    level: 22,
  },
];

const MOCK_TEAM2: Player[] = [
  {
    id: 'p3',
    username: 'Player3',
    rank: { division: 'Gold', level: 2, points: 2450 },
    city: 'CASABLANCA',
    wins: 42,
    losses: 25,
    reputation: 4.6,
    level: 24,
  },
  {
    id: 'p4',
    username: 'Player4',
    rank: { division: 'Silver', level: 3, points: 1950 },
    city: 'CASABLANCA',
    wins: 35,
    losses: 28,
    reputation: 4.2,
    level: 20,
  },
];

export default function MatchResultScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [team1Score, setTeam1Score] = useState<string>('');
  const [team2Score, setTeam2Score] = useState<string>('');
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [showRatings, setShowRatings] = useState(false);

  const [playersToRate, setPlayersToRate] = useState<PlayerWithRating[]>([
    ...MOCK_TEAM1.slice(1),
    ...MOCK_TEAM2,
  ]);

  const currentUserId = 'p1';

  const handleSubmitScore = () => {
    if (!team1Score || !team2Score) {
      Alert.alert('Error', 'Please enter scores for both teams');
      return;
    }

    console.log('Score submitted:', { team1Score, team2Score });
    setScoreSubmitted(true);
    setTimeout(() => {
      setShowRatings(true);
    }, 500);
  };

  const handleRatingChange = (playerId: string, stars: number) => {
    setPlayersToRate((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, rating: stars } : p))
    );
  };

  const handleCommentChange = (playerId: string, comment: string) => {
    setPlayersToRate((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, comment } : p))
    );
  };

  const handleSubmitRatings = () => {
    const unratedPlayers = playersToRate.filter((p) => !p.rating);
    if (unratedPlayers.length > 0) {
      Alert.alert(
        'Incomplete Ratings',
        'Please rate all players before submitting'
      );
      return;
    }

    console.log('Ratings submitted:', playersToRate);
    Alert.alert(
      'Success',
      'Your ratings have been submitted successfully!',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const handleReport = (playerId: string, playerName: string) => {
    Alert.alert(
      'Report Player',
      `Report ${playerName} for false score submission?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: () => {
            console.log('Reporting player:', playerId);
            Alert.alert('Reported', 'Player has been reported');
          },
        },
      ]
    );
  };

  const allRatingsComplete =
    playersToRate.filter((p) => p.rating).length === playersToRate.length;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Match Results',
          headerShown: false,
        }}
      />

      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft color={Colors.colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Results</Text>
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
        {!showRatings ? (
          <>
            <View style={styles.instructionCard}>
              <AlertTriangle color={Colors.colors.warning} size={24} />
              <Text style={styles.instructionText}>
                All players must submit the final score. If 3/4 players agree,
                the match is validated. Otherwise, it will be disputed.
              </Text>
            </View>

            <View style={styles.teamsContainer}>
              <View style={styles.teamSection}>
                <Text style={styles.teamLabel}>Team 1</Text>
                <View style={styles.teamPlayers}>
                  {MOCK_TEAM1.map((player) => {
                    const rankInfo = RANK_INFO[player.rank.division];
                    return (
                      <View key={player.id} style={styles.playerRow}>
                        <View
                          style={[
                            styles.playerAvatar,
                            { borderColor: rankInfo.color },
                          ]}
                        >
                          <Text style={styles.playerAvatarText}>
                            {player.username[0]}
                          </Text>
                        </View>
                        <Text style={styles.playerName}>{player.username}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              <View style={styles.vsContainer}>
                <Text style={styles.vsText}>VS</Text>
              </View>

              <View style={styles.teamSection}>
                <Text style={styles.teamLabel}>Team 2</Text>
                <View style={styles.teamPlayers}>
                  {MOCK_TEAM2.map((player) => {
                    const rankInfo = RANK_INFO[player.rank.division];
                    return (
                      <View key={player.id} style={styles.playerRow}>
                        <View
                          style={[
                            styles.playerAvatar,
                            { borderColor: rankInfo.color },
                          ]}
                        >
                          <Text style={styles.playerAvatarText}>
                            {player.username[0]}
                          </Text>
                        </View>
                        <Text style={styles.playerName}>{player.username}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            <View style={styles.scoreSection}>
              <Text style={styles.sectionTitle}>Enter Final Score</Text>
              <View style={styles.scoreInputContainer}>
                <View style={styles.scoreInputGroup}>
                  <Text style={styles.scoreLabel}>Team 1</Text>
                  <TextInput
                    style={styles.scoreInput}
                    value={team1Score}
                    onChangeText={setTeam1Score}
                    placeholder="0"
                    placeholderTextColor={Colors.colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={2}
                    editable={!scoreSubmitted}
                  />
                </View>

                <Text style={styles.scoreSeparator}>-</Text>

                <View style={styles.scoreInputGroup}>
                  <Text style={styles.scoreLabel}>Team 2</Text>
                  <TextInput
                    style={styles.scoreInput}
                    value={team2Score}
                    onChangeText={setTeam2Score}
                    placeholder="0"
                    placeholderTextColor={Colors.colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={2}
                    editable={!scoreSubmitted}
                  />
                </View>
              </View>

              {scoreSubmitted && (
                <View style={styles.submittedBadge}>
                  <Check color={Colors.colors.success} size={20} />
                  <Text style={styles.submittedText}>Score Submitted</Text>
                </View>
              )}
            </View>

            {scoreSubmitted && (
              <View style={styles.reportSection}>
                <Text style={styles.reportTitle}>
                  See a wrong score from another player?
                </Text>
                <TouchableOpacity
                  style={styles.reportButton}
                  onPress={() => handleReport('other', 'Other Player')}
                >
                  <Flag color={Colors.colors.danger} size={20} />
                  <Text style={styles.reportButtonText}>Report False Score</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.ratingsHeader}>
              <Star color={Colors.colors.warning} size={32} fill={Colors.colors.warning} />
              <Text style={styles.ratingsTitle}>Rate Your Teammates</Text>
              <Text style={styles.ratingsSubtitle}>
                Rate all {playersToRate.length} players to complete the match
              </Text>
            </View>

            {playersToRate.map((player) => {
              const rankInfo = RANK_INFO[player.rank.division];
              return (
                <View key={player.id} style={styles.ratingCard}>
                  <View style={styles.ratingPlayerHeader}>
                    <View
                      style={[
                        styles.ratingPlayerAvatar,
                        { borderColor: rankInfo.color },
                      ]}
                    >
                      <Text style={styles.ratingPlayerAvatarText}>
                        {player.username[0]}
                      </Text>
                    </View>
                    <View style={styles.ratingPlayerInfo}>
                      <Text style={styles.ratingPlayerName}>
                        {player.username}
                      </Text>
                      <View style={styles.ratingPlayerStats}>
                        <Text style={styles.ratingPlayerStat}>
                          {rankInfo.icon} {player.rank.division} {player.rank.level}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => handleRatingChange(player.id, star)}
                        style={styles.starButton}
                      >
                        <Star
                          color={Colors.colors.warning}
                          size={36}
                          fill={
                            player.rating && player.rating >= star
                              ? Colors.colors.warning
                              : 'transparent'
                          }
                        />
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TextInput
                    style={styles.commentInput}
                    value={player.comment || ''}
                    onChangeText={(text) =>
                      handleCommentChange(player.id, text)
                    }
                    placeholder="Optional: Add a comment (max 200 characters)"
                    placeholderTextColor={Colors.colors.textMuted}
                    maxLength={200}
                    multiline
                  />
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        {!showRatings ? (
          <TouchableOpacity
            style={[styles.submitButton, scoreSubmitted && styles.submitButtonDisabled]}
            onPress={handleSubmitScore}
            disabled={scoreSubmitted}
          >
            <LinearGradient
              colors={
                scoreSubmitted
                  ? [Colors.colors.surfaceLight, Colors.colors.surfaceLight]
                  : [Colors.colors.primary, Colors.colors.primaryDark]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitButtonGradient}
            >
              <Text style={styles.submitButtonText}>
                {scoreSubmitted ? 'Waiting for others...' : 'Submit Score'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.submitButton,
              !allRatingsComplete && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitRatings}
            disabled={!allRatingsComplete}
          >
            <LinearGradient
              colors={
                allRatingsComplete
                  ? [Colors.colors.success, '#0EA575']
                  : [Colors.colors.surfaceLight, Colors.colors.surfaceLight]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitButtonGradient}
            >
              <Text style={styles.submitButtonText}>
                {allRatingsComplete
                  ? 'Submit Ratings'
                  : `Rate ${playersToRate.length - playersToRate.filter((p) => p.rating).length} more players`}
              </Text>
            </LinearGradient>
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
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.colors.warning + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.colors.warning + '30',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.colors.textSecondary,
    lineHeight: 20,
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  teamSection: {
    flex: 1,
    backgroundColor: Colors.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.colors.border,
  },
  teamLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.colors.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  teamPlayers: {
    gap: 8,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.colors.surfaceLight,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerAvatarText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  playerName: {
    fontSize: 14,
    color: Colors.colors.textPrimary,
    fontWeight: '500' as const,
  },
  vsContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.colors.textSecondary,
  },
  scoreSection: {
    backgroundColor: Colors.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  scoreInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  scoreInputGroup: {
    alignItems: 'center',
    gap: 8,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.colors.textSecondary,
  },
  scoreInput: {
    width: 80,
    height: 80,
    backgroundColor: Colors.colors.surfaceLight,
    borderRadius: 16,
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: Colors.colors.border,
  },
  scoreSeparator: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.colors.textSecondary,
  },
  submittedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.colors.success + '20',
    borderRadius: 8,
    alignSelf: 'center',
  },
  submittedText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.colors.success,
  },
  reportSection: {
    backgroundColor: Colors.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.colors.border,
    alignItems: 'center',
  },
  reportTitle: {
    fontSize: 14,
    color: Colors.colors.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: Colors.colors.danger + '20',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.colors.danger + '40',
  },
  reportButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.colors.danger,
  },
  ratingsHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ratingsTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
    marginTop: 12,
    marginBottom: 8,
  },
  ratingsSubtitle: {
    fontSize: 14,
    color: Colors.colors.textSecondary,
    textAlign: 'center',
  },
  ratingCard: {
    backgroundColor: Colors.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.colors.border,
  },
  ratingPlayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  ratingPlayerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.colors.surfaceLight,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingPlayerAvatarText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  ratingPlayerInfo: {
    flex: 1,
  },
  ratingPlayerName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
    marginBottom: 4,
  },
  ratingPlayerStats: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingPlayerStat: {
    fontSize: 12,
    color: Colors.colors.textSecondary,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  starButton: {
    padding: 4,
  },
  commentInput: {
    backgroundColor: Colors.colors.surfaceLight,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: Colors.colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: Colors.colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.colors.border,
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
});
