import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  Share as RNShare,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Share2, Download, Copy, Instagram, X } from 'lucide-react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Clipboard from 'expo-clipboard';
import * as MediaLibrary from 'expo-media-library';
import Colors from '@/constants/colors';
import { Rank, RANK_INFO, formatRank } from '@/constants/ranks';
import { useLanguage } from '@/contexts/LanguageContext';

interface MatchHistoryRecord {
  id: string;
  outcome: 'win' | 'loss' | 'draw';
  rpChange: number;
  date: Date;
}

interface ShareMatchResultsProps {
  visible: boolean;
  onClose: () => void;
  playerName: string;
  currentRank: Rank;
  currentRP: number;
  rpChange: number;
  matchOutcome: 'win' | 'loss' | 'draw';
  recentMatches: MatchHistoryRecord[];
}

export default function ShareMatchResults({
  visible,
  onClose,
  playerName,
  currentRank,
  currentRP,
  rpChange,
  matchOutcome,
  recentMatches,
}: ShareMatchResultsProps) {
  const viewShotRef = useRef<View>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const { t } = useLanguage();

  const rankInfo = RANK_INFO[currentRank.division];

  const captureImage = async (): Promise<string | null> => {
    if (!viewShotRef.current) return null;

    try {
      setIsCapturing(true);
      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      return uri;
    } catch (error) {
      console.error('Failed to capture image:', error);
      Alert.alert('Error', 'Failed to capture image');
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSaveToPNG = async () => {
    const uri = await captureImage();
    if (!uri) return;

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('settings.permissionRequired'),
          'Please allow access to save images'
        );
        return;
      }

      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert(t('settings.success'), 'Image saved to gallery!');
    } catch (error) {
      console.error('Failed to save image:', error);
      Alert.alert('Error', 'Failed to save image');
    }
  };

  const handleCopyToClipboard = async () => {
    const uri = await captureImage();
    if (!uri) return;

    try {
      if (Platform.OS === 'web') {
        Alert.alert('Info', 'Clipboard copy not supported on web. Use "Save as PNG" instead.');
      } else {
        await Clipboard.setImageAsync(uri);
        Alert.alert(t('settings.success'), 'Image copied to clipboard!');
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const handleShareToInstagram = async () => {
    const uri = await captureImage();
    if (!uri) return;

    try {
      await RNShare.share({
        url: uri,
        message: `Check out my match results on Padel League! 🎾`,
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const handleMoreOptions = async () => {
    const uri = await captureImage();
    if (!uri) return;

    try {
      await RNShare.share({
        url: uri,
        message: `Check out my match results on Padel League! 🎾\n\n${playerName} | ${formatRank(currentRank)} | ${currentRP} RP\n${matchOutcome === 'win' ? '🏆' : matchOutcome === 'loss' ? '❌' : '🤝'} ${rpChange > 0 ? '+' : ''}${rpChange} RP`,
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const last5Matches = recentMatches.slice(0, 5);
  const wins = last5Matches.filter((m) => m.outcome === 'win').length;
  const losses = last5Matches.filter((m) => m.outcome === 'loss').length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('profile.shareResults')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={Colors.colors.textPrimary} size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.previewContainer}>
            <ViewShot ref={viewShotRef} style={styles.shareableContent}>
              <LinearGradient
                colors={rankInfo.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.resultCard}
              >
                <View style={styles.cardContent}>
                  <Text style={styles.playerNameText}>{playerName}</Text>

                  <View style={styles.rankSection}>
                    <Text style={styles.rankIcon}>{rankInfo.icon}</Text>
                    <Text style={styles.rankText}>{formatRank(currentRank)}</Text>
                    <Text style={styles.rpText}>{currentRP} RP</Text>
                  </View>

                  <View style={styles.matchResultSection}>
                    <Text
                      style={[
                        styles.outcomeText,
                        matchOutcome === 'win' && styles.outcomeWin,
                        matchOutcome === 'loss' && styles.outcomeLoss,
                      ]}
                    >
                      {matchOutcome === 'win'
                        ? '🏆 VICTORY'
                        : matchOutcome === 'loss'
                        ? '❌ DEFEAT'
                        : '🤝 DRAW'}
                    </Text>
                    <Text
                      style={[
                        styles.rpChangeText,
                        rpChange > 0 && styles.rpPositive,
                        rpChange < 0 && styles.rpNegative,
                      ]}
                    >
                      {rpChange > 0 ? '+' : ''}
                      {rpChange} RP
                    </Text>
                  </View>

                  <View style={styles.statsSection}>
                    <Text style={styles.statsTitle}>Last 5 Matches</Text>
                    <View style={styles.matchDots}>
                      {last5Matches.map((match) => (
                        <View
                          key={match.id}
                          style={[
                            styles.matchDot,
                            match.outcome === 'win' && styles.matchDotWin,
                            match.outcome === 'loss' && styles.matchDotLoss,
                            match.outcome === 'draw' && styles.matchDotDraw,
                          ]}
                        />
                      ))}
                    </View>
                    <Text style={styles.recordText}>
                      {wins}W - {losses}L
                    </Text>
                  </View>

                  <Text style={styles.branding}>Padel League</Text>
                </View>
              </LinearGradient>
            </ViewShot>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSaveToPNG}
              disabled={isCapturing}
            >
              <Download color={Colors.colors.primary} size={24} />
              <Text style={styles.actionButtonText}>Save as PNG</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCopyToClipboard}
              disabled={isCapturing}
            >
              <Copy color={Colors.colors.primary} size={24} />
              <Text style={styles.actionButtonText}>Copy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShareToInstagram}
              disabled={isCapturing}
            >
              <Instagram color={Colors.colors.primary} size={24} />
              <Text style={styles.actionButtonText}>Instagram</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleMoreOptions}
              disabled={isCapturing}
            >
              <Share2 color={Colors.colors.primary} size={24} />
              <Text style={styles.actionButtonText}>More</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: Colors.colors.surface,
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  shareableContent: {
    width: '100%',
  },
  resultCard: {
    borderRadius: 16,
    padding: 24,
    minHeight: 300,
  },
  cardContent: {
    alignItems: 'center',
  },
  playerNameText: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  rankSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  rankIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  rankText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  rpText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  matchResultSection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
  },
  outcomeText: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  outcomeWin: {
    color: '#4ADE80',
  },
  outcomeLoss: {
    color: '#F87171',
  },
  rpChangeText: {
    fontSize: 32,
    fontWeight: '700' as const,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  rpPositive: {
    color: '#4ADE80',
  },
  rpNegative: {
    color: '#F87171',
  },
  statsSection: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginBottom: 12,
    opacity: 0.9,
  },
  matchDots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  matchDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  matchDotWin: {
    backgroundColor: '#4ADE80',
  },
  matchDotLoss: {
    backgroundColor: '#F87171',
  },
  matchDotDraw: {
    backgroundColor: '#FBBF24',
  },
  recordText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  branding: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginTop: 16,
    opacity: 0.7,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  actionButton: {
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.colors.surfaceLight,
    borderRadius: 12,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
  },
});
