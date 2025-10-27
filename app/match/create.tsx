import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
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
  Shield,
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { MatchType, CourtPosition } from '@/types';
import { RANK_INFO, getRPChangeForMatch } from '@/constants/ranks';
import { useAuth } from '@/contexts/AuthContext';
import { Field, getFieldsByCity } from '@/constants/cities';
import { mockDataProvider } from '@/lib/mockData';
import { PadelCourtSelector } from '@/components/PadelCourtSelector';
import { getAllRankOptions } from '@/utils/rankUtils';

export default function CreateMatchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [matchType, setMatchType] = useState<MatchType>('friendly');
  const [maxPlayers, setMaxPlayers] = useState<string>('4');
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [scheduledTime, setScheduledTime] = useState<Date>(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<CourtPosition | null>(null);
  const [isCreating,  setIsCreating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isRankOpen, setIsRankOpen] = useState<boolean>(true);
  const [minRank, setMinRank] = useState<string | null>(null);
  const [maxRank, setMaxRank] = useState<string | null>(null);
  const [showMinRankPicker, setShowMinRankPicker] = useState<boolean>(false);
  const [showMaxRankPicker, setShowMaxRankPicker] = useState<boolean>(false);

  const rankOptions = getAllRankOptions();

  const rankInfo = user?.level_tier
    ? (RANK_INFO[user.level_tier as keyof typeof RANK_INFO] || RANK_INFO['Cuivre'])
    : RANK_INFO['Cuivre'];
  const rankColor = rankInfo?.color || '#CD7F32';
  const rankIcon = rankInfo?.icon || '🥉';
  const availableFields = getFieldsByCity('CASABLANCA') || [];

  const currentRP = user?.level_score ?? 0;
  const pointReward = getRPChangeForMatch(matchType, 'win', currentRP);
  const pointPenalty = Math.abs(getRPChangeForMatch(matchType, 'loss', currentRP));

  const handleCreateMatch = useCallback(async () => {
    if (!user) {
      setError('You must be logged in to create a match');
      return;
    }

    if (!selectedField) {
      setError('Please select a field or club');
      return;
    }

    if (!selectedPosition) {
      setError('Please select your court position');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const parsedMax = Number.parseInt(maxPlayers, 10);
      const max = Number.isFinite(parsedMax) && parsedMax > 0 ? parsedMax : 4;

      await mockDataProvider.initialize();
      const newMatch = await mockDataProvider.createMatch(user.id, {
        type: matchType,
        status: 'waiting',
        maxPlayers: max,
        pointReward,
        pointPenalty,
        field: selectedField,
        hostPosition: selectedPosition,
        isRankOpen,
        minRank: isRankOpen ? undefined : (minRank || undefined),
        maxRank: isRankOpen ? undefined : (maxRank || undefined),
      });

      console.log('✅ Match created successfully:', newMatch.id);
      
      if (router && typeof router.push === 'function') {
        router.push(`/match/${newMatch.id}`);
      } else {
        console.error('❌ Router navigation failed');
        setError('Match created but navigation failed. Please go to home screen.');
      }
    } catch (err: any) {
      console.error('❌ Failed to create match:', err);
      setError(err.message || 'Failed to create match. Please try again.');
    } finally {
      setIsCreating(false);
    }
  }, [user, matchType, maxPlayers, selectedField, selectedPosition, pointReward, pointPenalty, router, isRankOpen, minRank, maxRank]);

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
              <Text style={styles.hostAvatarText}>{user?.username?.[0] ?? '?'}</Text>
            </View>
            <View style={styles.hostDetails}>
              <Text style={styles.hostName}>{user?.username ?? 'Guest'}</Text>
              <View style={styles.hostRank}>
                <Text style={styles.hostRankEmoji}>{rankIcon}</Text>
                <Text style={styles.hostRankText}>
                  {user?.level_tier
                    ? `${user.level_tier} • ${user.level_score} RP`
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

          <TouchableOpacity
            style={styles.inputGroup}
            onPress={() => setShowTimePicker(true)}
          >
            <View style={styles.inputIcon}>
              <Clock color={Colors.colors.primary} size={20} strokeWidth={2.5} />
            </View>
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>Scheduled Time (Optional)</Text>
              <View style={styles.inputRow}>
                <Text style={styles.inputValue}>
                  {scheduledTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </Text>
                <ChevronDown color={Colors.colors.textMuted} size={20} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Rank Restrictions</Text>
          <Text style={styles.sectionHint}>Limit who can join based on rank level</Text>
          
          <TouchableOpacity
            style={styles.rankToggle}
            onPress={() => setIsRankOpen(!isRankOpen)}
          >
            <View style={styles.rankToggleContent}>
              <View style={styles.rankToggleIcon}>
                <Shield color={Colors.colors.primary} size={20} strokeWidth={2.5} />
              </View>
              <View style={styles.rankToggleText}>
                <Text style={styles.rankToggleTitle}>Open to All Ranks</Text>
                <Text style={styles.rankToggleSubtitle}>
                  {isRankOpen ? 'Everyone can join' : 'Rank restrictions enabled'}
                </Text>
              </View>
            </View>
            <View style={[styles.rankToggleSwitch, isRankOpen && styles.rankToggleSwitchActive]}>
              <View style={[styles.rankToggleKnob, isRankOpen && styles.rankToggleKnobActive]} />
            </View>
          </TouchableOpacity>

          {!isRankOpen && (
            <View style={styles.rankSelectors}>
              <TouchableOpacity
                style={styles.inputGroup}
                onPress={() => setShowMinRankPicker(true)}
              >
                <View style={styles.inputIcon}>
                  <Shield color={Colors.colors.primary} size={20} strokeWidth={2.5} />
                </View>
                <View style={styles.inputContent}>
                  <Text style={styles.inputLabel}>Minimum Rank</Text>
                  <View style={styles.inputRow}>
                    <Text style={styles.inputValue}>
                      {minRank || 'No minimum'}
                    </Text>
                    <ChevronDown color={Colors.colors.textMuted} size={20} />
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.inputGroup}
                onPress={() => setShowMaxRankPicker(true)}
              >
                <View style={styles.inputIcon}>
                  <Shield color={Colors.colors.primary} size={20} strokeWidth={2.5} />
                </View>
                <View style={styles.inputContent}>
                  <Text style={styles.inputLabel}>Maximum Rank</Text>
                  <View style={styles.inputRow}>
                    <Text style={styles.inputValue}>
                      {maxRank || 'No maximum'}
                    </Text>
                    <ChevronDown color={Colors.colors.textMuted} size={20} />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Your Position</Text>
          <Text style={styles.sectionHint}>Select where you&apos;ll play on the court</Text>
          <View style={styles.courtContainer}>
            <PadelCourtSelector
              selectedPosition={selectedPosition || undefined}
              onSelectPosition={setSelectedPosition}
              showLabels={true}
            />
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

      {showTimePicker && (
        <DateTimePicker
          value={scheduledTime}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
            if (Platform.OS === 'android') {
              setShowTimePicker(false);
            }
            if (selectedDate) {
              setScheduledTime(selectedDate);
            }
          }}
          {...(Platform.OS === 'ios' && {
            style: { backgroundColor: Colors.colors.surface },
          })}
        />
      )}

      {Platform.OS === 'ios' && showTimePicker && (
        <View style={[styles.timePickerFooter, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity
            style={styles.timePickerButton}
            onPress={() => setShowTimePicker(false)}
          >
            <Text style={styles.timePickerButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={showMinRankPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMinRankPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMinRankPicker(false)}
        >
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Minimum Rank</Text>
              <Text style={styles.modalSubtitle}>Lowest rank allowed to join</Text>
              <TouchableOpacity
                style={[
                  styles.rankOption,
                  minRank === null && styles.rankOptionActive,
                ]}
                onPress={() => {
                  setMinRank(null);
                  setShowMinRankPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.rankOptionText,
                    minRank === null && styles.rankOptionTextActive,
                  ]}
                >
                  No Minimum
                </Text>
              </TouchableOpacity>
              {rankOptions.map((rank) => (
                <TouchableOpacity
                  key={rank}
                  style={[
                    styles.rankOption,
                    rank === minRank && styles.rankOptionActive,
                  ]}
                  onPress={() => {
                    setMinRank(rank);
                    setShowMinRankPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.rankOptionText,
                      rank === minRank && styles.rankOptionTextActive,
                    ]}
                  >
                    {rank}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showMaxRankPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMaxRankPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMaxRankPicker(false)}
        >
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Maximum Rank</Text>
              <Text style={styles.modalSubtitle}>Highest rank allowed to join</Text>
              <TouchableOpacity
                style={[
                  styles.rankOption,
                  maxRank === null && styles.rankOptionActive,
                ]}
                onPress={() => {
                  setMaxRank(null);
                  setShowMaxRankPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.rankOptionText,
                    maxRank === null && styles.rankOptionTextActive,
                  ]}
                >
                  No Maximum
                </Text>
              </TouchableOpacity>
              {rankOptions.map((rank) => (
                <TouchableOpacity
                  key={rank}
                  style={[
                    styles.rankOption,
                    rank === maxRank && styles.rankOptionActive,
                  ]}
                  onPress={() => {
                    setMaxRank(rank);
                    setShowMaxRankPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.rankOptionText,
                      rank === maxRank && styles.rankOptionTextActive,
                    ]}
                  >
                    {rank}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </TouchableOpacity>
      </Modal>

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
              <Text style={styles.modalSubtitle}>Available in CASABLANCA</Text>
              {(availableFields || []).map((field) => (
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
  sectionHint: {
    fontSize: 12,
    color: Colors.colors.textMuted,
    marginBottom: 12,
    marginTop: -4,
  },
  courtContainer: {
    marginTop: 8,
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
  timePickerFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: Colors.colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.colors.border,
  },
  timePickerButton: {
    backgroundColor: Colors.colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  timePickerButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  rankToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.colors.border,
  },
  rankToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  rankToggleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankToggleText: {
    flex: 1,
  },
  rankToggleTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
    marginBottom: 2,
  },
  rankToggleSubtitle: {
    fontSize: 12,
    color: Colors.colors.textSecondary,
  },
  rankToggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  rankToggleSwitchActive: {
    backgroundColor: Colors.colors.primary,
  },
  rankToggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.colors.textPrimary,
    alignSelf: 'flex-start',
  },
  rankToggleKnobActive: {
    alignSelf: 'flex-end',
  },
  rankSelectors: {
    gap: 12,
  },
  rankOption: {
    backgroundColor: Colors.colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rankOptionActive: {
    backgroundColor: Colors.colors.primary + '10',
    borderColor: Colors.colors.primary,
  },
  rankOptionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
    textAlign: 'center',
  },
  rankOptionTextActive: {
    color: Colors.colors.primary,
  },
});
