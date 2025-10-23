import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  X,
  Users,
  MapPin,
  Clock,
  Zap,
  Heart,
  ChevronDown,
  Building2,
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { MatchType } from '@/types';
import { RANK_INFO, getRPChangeForMatch } from '@/constants/ranks';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { Field, getFieldsByCity } from '@/constants/cities';
import { mockDataProvider } from '@/lib/mockData';

export default function CreateMatchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useUserProfile();
  const [matchType, setMatchType] = useState<MatchType>('friendly');
  const [maxPlayers, setMaxPlayers] = useState<string>('4');
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const rankInfo = profile?.rank?.division
    ? RANK_INFO[profile.rank.division]
    : RANK_INFO['Cuivre'];
  const rankColor = rankInfo?.color || '#CD7F32';
  const rankIcon = rankInfo?.icon || '🥉';
  const availableFields = getFieldsByCity(profile?.city ?? 'CASABLANCA');

  const currentRP = profile?.rank?.points ?? 0;
  const pointReward = getRPChangeForMatch(matchType, 'win', currentRP);
  const pointPenalty = Math.abs(getRPChangeForMatch(matchType, 'loss', currentRP));

  const handleCreateMatch = useCallback(async () => {
    if (!profile) {
      setError('You must be logged in to create a match');
      return;
    }

    if (!selectedField) {
      setError('Please select a field or club');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const parsedMax = Number.parseInt(maxPlayers, 10);
      const max = Number.isFinite(parsedMax) && parsedMax > 0 ? parsedMax : 4;

      await mockDataProvider.initialize();
      const newMatch = await mockDataProvider.createMatch(profile.id, {
        type: matchType,
        status: 'waiting',
        maxPlayers: max,
        pointReward,
        pointPenalty,
        field: selectedField,
      });

      console.log('✅ Match created successfully:', newMatch.id);
      router.replace(`/match/${newMatch.id}`);
    } catch (err: any) {
      console.error('❌ Failed to create match:', err);
      setError(err.message || 'Failed to create match. Please try again.');
    } finally {
      setIsCreating(false);
    }
  }, [profile, matchType, maxPlayers, selectedField, pointReward, pointPenalty, router]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <X color={Colors.colors.textSecondary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Match</Text>
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
        <View style={styles.hostCard}>
          <Text style={styles.sectionLabel}>Match Host</Text>
          <View style={styles.hostInfo}>
            <View
              style={[styles.hostAvatar, { borderColor: rankColor }]}
            >
              <Text style={styles.hostAvatarText}>{profile?.username?.[0] ?? '?'}</Text>
            </View>
            <View style={styles.hostDetails}>
              <Text style={styles.hostName}>{profile?.username ?? 'Guest'}</Text>
              <View style={styles.hostRank}>
                <Text style={styles.hostRankEmoji}>{rankIcon}</Text>
                <Text style={styles.hostRankText}>
                  {profile?.rank
                    ? `${profile.rank.division} ${profile.rank.level} • ${profile.rank.points} RP`
                    : 'Unranked'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Match Type</Text>
          <View style={styles.matchTypeContainer}>
            <TouchableOpacity
              style={[
                styles.matchTypeButton,
                matchType === 'friendly' && styles.matchTypeButtonActive,
              ]}
              onPress={() => setMatchType('friendly')}
            >
              <Heart
                color={
                  matchType === 'friendly'
                    ? Colors.colors.textPrimary
                    : Colors.colors.success
                }
                size={24}
                strokeWidth={2.5}
              />
              <View style={styles.matchTypeInfo}>
                <Text
                  style={[
                    styles.matchTypeName,
                    matchType === 'friendly' && styles.matchTypeNameActive,
                  ]}
                >
                  Friendly Match
                </Text>
                <Text style={styles.matchTypeDescription}>
                  Low stakes, perfect for practice
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.matchTypeButton,
                matchType === 'official' && styles.matchTypeButtonActive,
              ]}
              onPress={() => setMatchType('official')}
            >
              <Zap
                color={
                  matchType === 'official'
                    ? Colors.colors.textPrimary
                    : Colors.colors.warning
                }
                size={24}
                strokeWidth={2.5}
              />
              <View style={styles.matchTypeInfo}>
                <Text
                  style={[
                    styles.matchTypeName,
                    matchType === 'official' && styles.matchTypeNameActive,
                  ]}
                >
                  Official Match
                </Text>
                <Text style={styles.matchTypeDescription}>
                  High stakes, ranked play
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.pointsInfo}>
            <View style={styles.pointsRow}>
              <Text style={styles.pointsLabel}>Win Reward:</Text>
              <Text style={[styles.pointsValue, { color: Colors.colors.success }]}>
                +{pointReward} RP
              </Text>
            </View>
            <View style={styles.pointsRow}>
              <Text style={styles.pointsLabel}>Loss Penalty:</Text>
              <Text style={[styles.pointsValue, { color: Colors.colors.danger }]}>
                -{pointPenalty} RP
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Match Settings</Text>

          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <Users color={Colors.colors.primary} size={20} strokeWidth={2.5} />
            </View>
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>Max Players</Text>
              <TextInput
                style={styles.input}
                value={maxPlayers}
                onChangeText={setMaxPlayers}
                placeholder="4"
                placeholderTextColor={Colors.colors.textMuted}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.inputGroup}
            onPress={() => setShowFieldPicker(true)}
          >
            <View style={styles.inputIcon}>
              <Building2 color={Colors.colors.primary} size={20} strokeWidth={2.5} />
            </View>
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>Field / Club</Text>
              <View style={styles.inputRow}>
                <Text style={styles.inputValue}>
                  {selectedField ? selectedField.name : 'Select a field'}
                </Text>
                <ChevronDown color={Colors.colors.textMuted} size={20} />
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <Clock color={Colors.colors.primary} size={20} strokeWidth={2.5} />
            </View>
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>Scheduled Time (Optional)</Text>
              <TextInput
                style={styles.input}
                value={scheduledTime}
                onChangeText={setScheduledTime}
                placeholder="HH:MM"
                placeholderTextColor={Colors.colors.textMuted}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        <TouchableOpacity
          style={[styles.createButton, isCreating && styles.createButtonDisabled]}
          onPress={handleCreateMatch}
          disabled={isCreating}
        >
          <LinearGradient
            colors={
              isCreating
                ? [Colors.colors.surfaceLight, Colors.colors.surfaceLight]
                : [Colors.colors.primary, Colors.colors.primaryDark]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.createButtonGradient}
          >
            <Text style={[styles.createButtonText, isCreating && styles.createButtonTextDisabled]}>
              {isCreating ? 'Creating Match...' : 'Create Match'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showFieldPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFieldPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFieldPicker(false)}
        >
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Field / Club</Text>
              <Text style={styles.modalSubtitle}>Available in {profile?.city ?? 'CASABLANCA'}</Text>
              {availableFields.map((field) => (
                <TouchableOpacity
                  key={field.id}
                  style={[
                    styles.fieldOption,
                    field.id === selectedField?.id && styles.fieldOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedField(field);
                    setShowFieldPicker(false);
                  }}
                >
                  <View style={styles.fieldOptionContent}>
                    <View style={styles.fieldOptionHeader}>
                      <Text
                        style={[
                          styles.fieldOptionName,
                          field.id === selectedField?.id && styles.fieldOptionNameActive,
                        ]}
                      >
                        {field.name}
                      </Text>
                      <View
                        style={[
                          styles.fieldTypeBadge,
                          field.type === 'indoor'
                            ? styles.fieldTypeBadgeIndoor
                            : styles.fieldTypeBadgeOutdoor,
                        ]}
                      >
                        <Text style={styles.fieldTypeBadgeText}>
                          {field.type === 'indoor' ? '🏢' : '🌤️'} {field.type}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.fieldOptionAddress}>
                      <MapPin color={Colors.colors.textMuted} size={14} strokeWidth={2} />
                      <Text style={styles.fieldOptionAddressText}>{field.address}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </TouchableOpacity>
      </Modal>
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
  closeButton: {
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
  hostCard: {
    backgroundColor: Colors.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.colors.border,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.colors.textSecondary,
    marginBottom: 12,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hostAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
  hostDetails: {
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
  },
  hostRankEmoji: {
    fontSize: 16,
  },
  hostRankText: {
    fontSize: 14,
    color: Colors.colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  matchTypeContainer: {
    gap: 12,
  },
  matchTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.colors.border,
  },
  matchTypeButtonActive: {
    borderColor: Colors.colors.primary,
    backgroundColor: Colors.colors.primary + '10',
  },
  matchTypeInfo: {
    flex: 1,
  },
  matchTypeName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
    marginBottom: 4,
  },
  matchTypeNameActive: {
    color: Colors.colors.primary,
  },
  matchTypeDescription: {
    fontSize: 14,
    color: Colors.colors.textSecondary,
  },
  pointsInfo: {
    marginTop: 16,
    backgroundColor: Colors.colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.colors.border,
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsLabel: {
    fontSize: 14,
    color: Colors.colors.textSecondary,
  },
  pointsValue: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.colors.border,
  },
  inputIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContent: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: Colors.colors.textSecondary,
    marginBottom: 4,
  },
  input: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
    padding: 0,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
  },
  errorContainer: {
    backgroundColor: Colors.colors.danger + '20',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.colors.danger,
  },
  errorText: {
    fontSize: 14,
    color: Colors.colors.danger,
    textAlign: 'center',
    fontWeight: '600' as const,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: Colors.colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.colors.border,
  },
  createButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  createButtonTextDisabled: {
    color: Colors.colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  fieldOption: {
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: Colors.colors.surfaceLight,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  fieldOptionActive: {
    backgroundColor: Colors.colors.primary + '10',
    borderColor: Colors.colors.primary,
  },
  fieldOptionContent: {
    padding: 16,
  },
  fieldOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldOptionName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
    flex: 1,
  },
  fieldOptionNameActive: {
    color: Colors.colors.primary,
  },
  fieldTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  fieldTypeBadgeIndoor: {
    backgroundColor: Colors.colors.primary + '20',
  },
  fieldTypeBadgeOutdoor: {
    backgroundColor: Colors.colors.success + '20',
  },
  fieldTypeBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.colors.textSecondary,
  },
  fieldOptionAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldOptionAddressText: {
    fontSize: 14,
    color: Colors.colors.textMuted,
  },
});
