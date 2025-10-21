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
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { MapPin, User, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import Colors from '@/constants/colors';
import { MOROCCO_CITIES, CITY_INFO } from '@/constants/cities';
import { profileService } from '@/services/profile';
import { computeRankFromScore, QUESTIONNAIRE_QUESTIONS, QuestionnaireAnswer } from '@/utils/rankScoring';

export default function OnboardingScreen() {
  const router = useRouter();

  const [step, setStep] = useState<number>(1);
  const [avatar, setAvatar] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Please allow access to your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images' as any,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatar(result.assets[0].uri);
        setErrors(prev => {
          const next = { ...prev };
          delete next.avatar;
          return next;
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Please allow access to your camera.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatar(result.assets[0].uri);
        setErrors(prev => {
          const next = { ...prev };
          delete next.avatar;
          return next;
        });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!avatar) {
      newErrors.avatar = 'Please select an avatar';
    }

    if (!username || username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (username.trim().length > 24) {
      newErrors.username = 'Username must be 24 characters or less';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!city || city.trim().length < 2) {
      newErrors.city = 'Please enter your city (at least 2 characters)';
    } else if (city.trim().length > 48) {
      newErrors.city = 'City name must be 48 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < QUESTIONNAIRE_QUESTIONS.length) {
      Alert.alert('Incomplete', 'Please answer all questions before continuing.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    } else if (step === 2) {
      if (validateStep2()) {
        setStep(3);
      }
    }
  };

  const handleFinish = async () => {
    if (!validateStep3()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const questionnaireAnswers: QuestionnaireAnswer[] = QUESTIONNAIRE_QUESTIONS.map(q => ({
        questionId: q.id,
        answer: answers[q.id],
      }));

      const result = computeRankFromScore(questionnaireAnswers);
      console.log('📊 Computed rank:', result);

      await profileService.saveOnboarding({
        avatarUri: avatar,
        username: username.trim(),
        city: city.trim(),
        score: result.score,
        rankTier: result.rankTier,
        rankSub: result.rankSub,
        rp: result.rp,
      });

      Alert.alert(
        'Welcome to PadelMatch! 🎾',
        `Your rank is ${result.rankTier} ${result.rankSub} with ${result.rp} RP. Let's start playing!`,
        [{ text: 'Continue', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (err) {
      console.error('Failed to save onboarding:', err);
      Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />
      
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={[Colors.colors.background, Colors.colors.surface]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.emoji}>🎾</Text>
            <Text style={styles.title}>Welcome to PadelMatch</Text>
            <Text style={styles.subtitle}>
              {step === 1 && 'Create your profile with avatar and username'}
              {step === 2 && 'Tell us where you play'}
              {step === 3 && 'Answer questions to determine your rank'}
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
                <View style={styles.avatarSection}>
                  <Text style={styles.label}>Profile Picture *</Text>
                  
                  <View style={styles.avatarContainer}>
                    {avatar ? (
                      <Image source={{ uri: avatar }} style={styles.avatarImage} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <User size={64} color="#9CA3AF" />
                      </View>
                    )}
                  </View>

                  {errors.avatar && (
                    <Text style={styles.errorText}>{errors.avatar}</Text>
                  )}

                  <View style={styles.avatarButtons}>
                    <TouchableOpacity 
                      style={styles.avatarButton} 
                      onPress={pickImage}
                      testID="avatar-picker"
                    >
                      <User size={20} color="#FFFFFF" />
                      <Text style={styles.avatarButtonText}>Choose Photo</Text>
                    </TouchableOpacity>

                    {Platform.OS !== 'web' && (
                      <TouchableOpacity 
                        style={styles.avatarButton} 
                        onPress={takePhoto}
                      >
                        <Camera size={20} color="#FFFFFF" />
                        <Text style={styles.avatarButtonText}>Take Photo</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.label}>Username *</Text>
                  <TextInput
                    style={[styles.textInput, errors.username && styles.inputError]}
                    value={username}
                    onChangeText={(text) => {
                      setUsername(text);
                      setErrors(prev => {
                        const next = { ...prev };
                        delete next.username;
                        return next;
                      });
                    }}
                    placeholder="Enter your username"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={24}
                    testID="username-input"
                  />
                  {errors.username && (
                    <Text style={styles.errorText}>{errors.username}</Text>
                  )}
                  <Text style={styles.hint}>3-24 characters, letters, numbers, and _ only</Text>
                </View>
              </>
            )}

            {step === 2 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MapPin color={Colors.colors.primary} size={20} strokeWidth={2.5} />
                  <Text style={styles.sectionTitle}>Where Do You Play?</Text>
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.label}>City *</Text>
                  <TextInput
                    style={[styles.textInput, errors.city && styles.inputError]}
                    value={city}
                    onChangeText={(text) => {
                      setCity(text);
                      setErrors(prev => {
                        const next = { ...prev };
                        delete next.city;
                        return next;
                      });
                    }}
                    placeholder="Enter your city"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="words"
                    autoCorrect={false}
                    maxLength={48}
                    testID="city-input"
                  />
                  {errors.city && (
                    <Text style={styles.errorText}>{errors.city}</Text>
                  )}
                  <Text style={styles.hint}>2-48 characters</Text>
                </View>

                <View style={styles.citySuggestions}>
                  <Text style={styles.suggestionsTitle}>Popular cities:</Text>
                  <View style={styles.citiesGrid}>
                    {MOROCCO_CITIES.map((moroccoCity) => {
                      const cityInfo = CITY_INFO[moroccoCity];
                      return (
                        <TouchableOpacity
                          key={moroccoCity}
                          style={styles.cityChip}
                          onPress={() => {
                            setCity(cityInfo.name);
                            setErrors(prev => {
                              const next = { ...prev };
                              delete next.city;
                              return next;
                            });
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.cityChipText}>{cityInfo.emoji} {cityInfo.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}

            {step === 3 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Skill Assessment</Text>
                </View>
                <Text style={styles.questionnaireInstructions}>
                  Rate each statement from 1 (strongly disagree/low) to 5 (strongly agree/high)
                </Text>

                <View style={styles.questionsContainer}>
                  {QUESTIONNAIRE_QUESTIONS.map((question, index) => (
                    <View key={question.id} style={styles.questionCard}>
                      <Text style={styles.questionNumber}>Question {index + 1}</Text>
                      <Text style={styles.questionText}>{question.text}</Text>
                      
                      <View style={styles.answerScale}>
                        {[1, 2, 3, 4, 5].map((value) => (
                          <TouchableOpacity
                            key={value}
                            style={[
                              styles.scaleButton,
                              answers[question.id] === value && styles.scaleButtonSelected,
                            ]}
                            onPress={() => setAnswers(prev => ({ ...prev, [question.id]: value }))}
                            testID={`questionnaire-submit`}
                          >
                            <Text
                              style={[
                                styles.scaleButtonText,
                                answers[question.id] === value && styles.scaleButtonTextSelected,
                              ]}
                            >
                              {value}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.buttonRow}>
              {step > 1 && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setStep(step - 1)}
                  activeOpacity={0.8}
                  testID="onboarding-back"
                >
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.nextButton,
                  step === 1 && styles.nextButtonFull,
                  isSubmitting && styles.nextButtonDisabled,
                ]}
                onPress={step === 3 ? handleFinish : handleNext}
                disabled={isSubmitting}
                activeOpacity={0.8}
                testID="onboarding-next"
              >
                <LinearGradient
                  colors={
                    isSubmitting
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
                      isSubmitting && styles.nextButtonTextDisabled,
                    ]}
                  >
                    {step === 3
                      ? isSubmitting
                        ? 'Saving...'
                        : 'Finish'
                      : 'Next'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.colors.background,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.colors.border,
    borderStyle: 'dashed',
  },
  avatarButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  avatarButtonText: {
    color: Colors.colors.textPrimary,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  inputSection: {
    marginBottom: 24,
  },
  textInput: {
    borderWidth: 2,
    borderColor: Colors.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.colors.textPrimary,
    backgroundColor: Colors.colors.surface,
  },
  inputError: {
    borderColor: Colors.colors.danger,
  },
  hint: {
    fontSize: 13,
    color: Colors.colors.textSecondary,
    marginTop: 6,
  },
  citySuggestions: {
    marginTop: 24,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.colors.textSecondary,
    marginBottom: 12,
  },
  cityChip: {
    backgroundColor: Colors.colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.colors.border,
  },
  cityChipText: {
    fontSize: 14,
    color: Colors.colors.textPrimary,
    fontWeight: '500' as const,
  },
  questionnaireInstructions: {
    fontSize: 14,
    color: Colors.colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  questionsContainer: {
    gap: 20,
  },
  questionCard: {
    backgroundColor: Colors.colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.colors.border,
  },
  questionNumber: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.colors.primary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: 15,
    color: Colors.colors.textPrimary,
    marginBottom: 16,
    lineHeight: 22,
    fontWeight: '500' as const,
  },
  answerScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  scaleButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: Colors.colors.background,
    borderWidth: 2,
    borderColor: Colors.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scaleButtonSelected: {
    backgroundColor: Colors.colors.primary,
    borderColor: Colors.colors.primary,
  },
  scaleButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.colors.textSecondary,
  },
  scaleButtonTextSelected: {
    color: Colors.colors.textPrimary,
  },
});
