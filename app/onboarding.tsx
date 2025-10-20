import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MapPin, User, Camera, Trophy } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import Colors from '@/constants/colors';
import { MOROCCO_CITIES, CITY_INFO, MoroccoCity } from '@/constants/cities';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { DETAILED_RANKS, DetailedRankInfo } from '@/constants/ranks';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { createProfile } = useUserProfile();

  const [step, setStep] = useState<number>(1);
  const [username, setUsername] = useState<string>('');
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<MoroccoCity | null>(null);
  const [selectedRank, setSelectedRank] = useState<DetailedRankInfo | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfilePicture(result.assets[0].uri);
      setError('');
    }
  };

  const handleNext = () => {
    setError('');

    if (step === 1) {
      if (!username.trim()) {
        setError('Please enter a username');
        return;
      }
      if (username.trim().length < 3) {
        setError('Username must be at least 3 characters');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!selectedCity) {
        setError('Please select your city');
        return;
      }
      setStep(3);
    }
  };

  const handleCreateAccount = async () => {
    setError('');

    if (!selectedRank) {
      setError('Please select your skill level');
      return;
    }

    setIsCreating(true);
    try {
      await createProfile(
        username.trim(),
        selectedCity!,
        {
          division: selectedRank.division,
          level: selectedRank.level,
          points: 0,
        },
        profilePicture || undefined
      );
      router.replace('/(tabs)');
    } catch (err) {
      setError('Failed to create account. Please try again.');
      console.error('Create account error:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.colors.background, Colors.colors.surface]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.emoji}>🎾</Text>
            <Text style={styles.title}>Welcome to PadelMatch</Text>
            <Text style={styles.subtitle}>
              {step === 1 && 'Create your profile to start competing'}
              {step === 2 && 'Select your city'}
              {step === 3 && 'Choose your skill level'}
            </Text>
          </View>

          <View style={styles.progressBar}>
            <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]} />
            <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />
            <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />
            <View style={[styles.progressLine, step >= 3 && styles.progressLineActive]} />
            <View style={[styles.progressDot, step >= 3 && styles.progressDotActive]} />
          </View>

          <View style={styles.form}>
            {step === 1 && (
              <>
                <View style={styles.profilePictureSection}>
                  <TouchableOpacity
                    style={styles.profilePictureContainer}
                    onPress={pickImage}
                    activeOpacity={0.7}
                  >
                    {profilePicture ? (
                      <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
                    ) : (
                      <View style={styles.profilePicturePlaceholder}>
                        <Camera color={Colors.colors.primary} size={32} strokeWidth={2} />
                      </View>
                    )}
                    <View style={styles.profilePictureOverlay}>
                      <Camera color={Colors.colors.textPrimary} size={20} strokeWidth={2.5} />
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.profilePictureLabel}>
                    {profilePicture ? 'Tap to change photo' : 'Add profile photo (optional)'}
                  </Text>
                </View>

                <View style={styles.inputContainer}>
                  <View style={styles.inputIcon}>
                    <User color={Colors.colors.primary} size={20} strokeWidth={2.5} />
                  </View>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Username</Text>
                    <TextInput
                      style={styles.input}
                      value={username}
                      onChangeText={setUsername}
                      placeholder="Enter your username"
                      placeholderTextColor={Colors.colors.textMuted}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>
              </>
            )}

            {step === 2 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MapPin color={Colors.colors.primary} size={20} strokeWidth={2.5} />
                  <Text style={styles.sectionTitle}>Select Your City</Text>
                </View>

                <View style={styles.citiesGrid}>
                  {MOROCCO_CITIES.map((city) => {
                    const cityInfo = CITY_INFO[city];
                    const isSelected = selectedCity === city;

                    return (
                      <TouchableOpacity
                        key={city}
                        style={[
                          styles.cityCard,
                          isSelected && styles.cityCardSelected,
                        ]}
                        onPress={() => setSelectedCity(city)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.cityEmoji}>{cityInfo.emoji}</Text>
                        <Text
                          style={[
                            styles.cityName,
                            isSelected && styles.cityNameSelected,
                          ]}
                        >
                          {cityInfo.name}
                        </Text>
                        {isSelected && (
                          <View style={styles.selectedBadge}>
                            <Text style={styles.selectedBadgeText}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {step === 3 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Trophy color={Colors.colors.primary} size={20} strokeWidth={2.5} />
                  <Text style={styles.sectionTitle}>Select Your Skill Level</Text>
                </View>

                <ScrollView
                  style={styles.ranksScrollView}
                  showsVerticalScrollIndicator={false}
                >
                  {DETAILED_RANKS.map((rank) => {
                    const isSelected =
                      selectedRank?.division === rank.division &&
                      selectedRank?.level === rank.level;

                    return (
                      <TouchableOpacity
                        key={`${rank.division}-${rank.level}`}
                        style={[
                          styles.rankCard,
                          isSelected && styles.rankCardSelected,
                        ]}
                        onPress={() => setSelectedRank(rank)}
                        activeOpacity={0.7}
                      >
                        <LinearGradient
                          colors={rank.gradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.rankGradient}
                        >
                          <Text style={styles.rankIcon}>{rank.icon}</Text>
                        </LinearGradient>
                        <View style={styles.rankInfo}>
                          <View style={styles.rankHeader}>
                            <Text style={styles.rankName}>{rank.displayName}</Text>
                            <Text style={styles.rankPadLevel}>{rank.padLevel}</Text>
                          </View>
                          <Text style={styles.rankDescription} numberOfLines={2}>
                            {rank.description}
                          </Text>
                        </View>
                        {isSelected && (
                          <View style={styles.rankSelectedBadge}>
                            <Text style={styles.selectedBadgeText}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.buttonRow}>
              {step > 1 && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setStep(step - 1)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.nextButton,
                  step === 1 && styles.nextButtonFull,
                  ((step === 1 && !username.trim()) ||
                    (step === 2 && !selectedCity) ||
                    (step === 3 && (!selectedRank || isCreating))) &&
                    styles.nextButtonDisabled,
                ]}
                onPress={step === 3 ? handleCreateAccount : handleNext}
                disabled={
                  (step === 1 && !username.trim()) ||
                  (step === 2 && !selectedCity) ||
                  (step === 3 && (!selectedRank || isCreating))
                }
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    ((step === 1 && !username.trim()) ||
                      (step === 2 && !selectedCity) ||
                      (step === 3 && (!selectedRank || isCreating)))
                      ? [Colors.colors.surfaceLight, Colors.colors.surfaceLight]
                      : [Colors.colors.primary, Colors.colors.primaryDark]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.nextButtonGradient}
                >
                  <Text
                    style={[
                      styles.nextButtonText,
                      ((step === 1 && !username.trim()) ||
                        (step === 2 && !selectedCity) ||
                        (step === 3 && (!selectedRank || isCreating))) &&
                        styles.nextButtonTextDisabled,
                    ]}
                  >
                    {step === 3
                      ? isCreating
                        ? 'Creating...'
                        : 'Start Playing'
                      : 'Next'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.colors.border,
  },
  progressDotActive: {
    backgroundColor: Colors.colors.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: Colors.colors.border,
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: Colors.colors.primary,
  },
  form: {
    flex: 1,
  },
  profilePictureSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profilePictureContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: Colors.colors.primary,
  },
  profilePicturePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.colors.surface,
    borderWidth: 3,
    borderColor: Colors.colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePictureOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.colors.background,
  },
  profilePictureLabel: {
    fontSize: 14,
    color: Colors.colors.textSecondary,
    fontWeight: '600' as const,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.colors.surface,
    borderRadius: 16,
    padding: 16,
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
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: Colors.colors.textSecondary,
    marginBottom: 4,
    fontWeight: '600' as const,
  },
  input: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
    padding: 0,
  },
  section: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  citiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cityCard: {
    width: '48%',
    backgroundColor: Colors.colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.colors.border,
    position: 'relative',
  },
  cityCardSelected: {
    borderColor: Colors.colors.primary,
    backgroundColor: Colors.colors.primary + '10',
  },
  cityEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  cityName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.colors.textSecondary,
    textAlign: 'center',
  },
  cityNameSelected: {
    color: Colors.colors.primary,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadgeText: {
    fontSize: 14,
    color: Colors.colors.textPrimary,
    fontWeight: '700' as const,
  },
  ranksScrollView: {
    maxHeight: 400,
  },
  rankCard: {
    flexDirection: 'row',
    backgroundColor: Colors.colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.colors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  rankCardSelected: {
    borderColor: Colors.colors.primary,
    backgroundColor: Colors.colors.primary + '10',
  },
  rankGradient: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankIcon: {
    fontSize: 32,
  },
  rankInfo: {
    flex: 1,
    padding: 16,
  },
  rankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  rankName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  rankPadLevel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.colors.primary,
    backgroundColor: Colors.colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rankDescription: {
    fontSize: 13,
    color: Colors.colors.textSecondary,
    lineHeight: 18,
  },
  rankSelectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    backgroundColor: Colors.colors.danger + '20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.colors.danger,
  },
  errorText: {
    fontSize: 14,
    color: Colors.colors.danger,
    textAlign: 'center',
    fontWeight: '600' as const,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  backButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.colors.border,
    paddingVertical: 18,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.colors.textSecondary,
  },
  nextButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  nextButtonTextDisabled: {
    color: Colors.colors.textMuted,
  },
});
