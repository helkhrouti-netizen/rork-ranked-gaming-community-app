import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Share2 } from 'lucide-react-native';
import ShareMatchResults from './ShareMatchResults';
import Colors from '@/constants/colors';
import { Rank } from '@/constants/ranks';

interface ShareMatchResultsDemoProps {
  playerName: string;
  currentRank: Rank;
  currentRP: number;
  rpChange: number;
  matchOutcome: 'win' | 'loss' | 'draw';
  recentMatches: {
    id: string;
    outcome: 'win' | 'loss' | 'draw';
    rpChange: number;
    date: Date;
  }[];
}

export default function ShareMatchResultsDemo({
  playerName,
  currentRank,
  currentRP,
  rpChange,
  matchOutcome,
  recentMatches,
}: ShareMatchResultsDemoProps) {
  const [showShareModal, setShowShareModal] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={styles.shareButton}
        onPress={() => setShowShareModal(true)}
      >
        <Share2 color={Colors.colors.primary} size={20} />
        <Text style={styles.shareButtonText}>Share Results</Text>
      </TouchableOpacity>

      <ShareMatchResults
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        playerName={playerName}
        currentRank={currentRank}
        currentRP={currentRP}
        rpChange={rpChange}
        matchOutcome={matchOutcome}
        recentMatches={recentMatches}
      />
    </>
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
