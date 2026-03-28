/**
 * SHARE MATCH RESULTS - COMPLETE INTEGRATION EXAMPLE
 * 
 * This file shows how to integrate the Share Match Results feature
 * in different parts of your app.
 */

import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Share2 } from 'lucide-react-native';
import ShareMatchResults from '@/components/ShareMatchResults';
import { matchHistoryService } from '@/services/matchHistory';
import { useUserProfile } from '@/contexts/UserProfileContext';
import Colors from '@/constants/colors';

/**
 * EXAMPLE 1: After Match Completion
 * Use this in app/match/result/[id].tsx after score validation
 */
export function AfterMatchExample() {
  const { profile } = useUserProfile();
  const [showShareModal, setShowShareModal] = useState(false);

  const handleMatchValidated = async () => {
    if (!profile) return;

    const matchOutcome = 'win';
    const rpChange = 50;

    const recentMatches = await matchHistoryService.getMatchHistoryForShare(profile.id);

    setShowShareModal(true);
  };

  if (!profile) return null;

  return (
    <View>
      <TouchableOpacity
        style={styles.shareButton}
        onPress={() => setShowShareModal(true)}
      >
        <Share2 color={Colors.colors.primary} size={20} />
        <Text style={styles.shareButtonText}>Share Match Results</Text>
      </TouchableOpacity>

      <ShareMatchResults
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        playerName={profile.username}
        currentRank={profile.rank}
        currentRP={profile.rank.points}
        rpChange={50}
        matchOutcome="win"
        recentMatches={matchHistoryService.getMockMatchHistory()}
      />
    </View>
  );
}

/**
 * EXAMPLE 2: In Profile Screen
 * Add a share button in the profile to share overall stats
 */
export function ProfileShareExample() {
  const { profile } = useUserProfile();
  const [showShareModal, setShowShareModal] = useState(false);
  const [matchHistory, setMatchHistory] = useState<any[]>([]);

  const loadMatchHistory = async () => {
    if (!profile) return;
    
    const history = await matchHistoryService.getMatchHistoryForShare(profile.id);
    setMatchHistory(history);
    setShowShareModal(true);
  };

  if (!profile) return null;

  const lastMatch = matchHistory[0] || {
    outcome: 'win' as const,
    rpChange: 0,
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.shareButton}
        onPress={loadMatchHistory}
      >
        <Share2 color={Colors.colors.primary} size={20} />
        <Text style={styles.shareButtonText}>Share My Stats</Text>
      </TouchableOpacity>

      <ShareMatchResults
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        playerName={profile.username}
        currentRank={profile.rank}
        currentRP={profile.rank.points}
        rpChange={lastMatch.rpChange}
        matchOutcome={lastMatch.outcome}
        recentMatches={matchHistory.length > 0 ? matchHistory : matchHistoryService.getMockMatchHistory()}
      />
    </View>
  );
}

/**
 * EXAMPLE 3: Recording Match Results to Database
 * Use this after score validation to save to player_match_history table
 */
export async function recordMatchResultExample(
  playerId: string,
  matchId: string,
  matchType: 'official' | 'friendly',
  currentRP: number,
  didWin: boolean
) {
  const { getRPChangeForMatch } = await import('@/constants/ranks');
  
  const outcome = didWin ? 'win' : 'loss';
  const rpChange = getRPChangeForMatch(matchType, outcome, currentRP);

  await matchHistoryService.recordMatchResult(
    playerId,
    matchId,
    outcome,
    rpChange
  );

  console.log(`Match result recorded: ${outcome} (${rpChange > 0 ? '+' : ''}${rpChange} RP)`);
}

/**
 * EXAMPLE 4: Complete Match Flow with Share
 * This shows the full flow from match validation to sharing
 */
export function CompleteMatchFlowExample() {
  const { profile, updateProfile } = useUserProfile();
  const [showShareModal, setShowShareModal] = useState(false);
  const [lastMatchData, setLastMatchData] = useState<{
    outcome: 'win' | 'loss' | 'draw';
    rpChange: number;
  } | null>(null);

  const handleSubmitMatchResult = async (
    matchId: string,
    matchType: 'official' | 'friendly',
    didWin: boolean
  ) => {
    if (!profile) return;

    const { getRPChangeForMatch } = await import('@/constants/ranks');
    
    const outcome = didWin ? 'win' : 'loss';
    const rpChange = getRPChangeForMatch(
      matchType,
      outcome,
      profile.rank.points
    );

    await matchHistoryService.recordMatchResult(
      profile.id,
      matchId,
      outcome,
      rpChange
    );

    const newRP = profile.rank.points + rpChange;
    await updateProfile({ rank: { ...profile.rank, points: newRP } });

    setLastMatchData({ outcome, rpChange });
    setShowShareModal(true);
  };

  if (!profile || !lastMatchData) return null;

  return (
    <ShareMatchResults
      visible={showShareModal}
      onClose={() => setShowShareModal(false)}
      playerName={profile.username}
      currentRank={profile.rank}
      currentRP={profile.rank.points}
      rpChange={lastMatchData.rpChange}
      matchOutcome={lastMatchData.outcome}
      recentMatches={matchHistoryService.getMockMatchHistory()}
    />
  );
}

const styles = StyleSheet.create({
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: Colors.colors.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.colors.border,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
  },
});
