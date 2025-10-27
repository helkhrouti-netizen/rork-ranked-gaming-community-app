import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, User, ChevronLeft, ChevronRight, MapPin } from 'lucide-react-native';
import { PadelCourtSelector } from '@/components/PadelCourtSelector';
import { CourtPosition } from '@/types';

import Colors from '@/constants/colors';
import { MOROCCO_CITIES } from '@/constants/cities';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/constants/translations';

interface OnboardingAnswer {
  questionIndex: number;
  value: number;
}

interface OnboardingState {
  avatarUri: string;
  username: string;
  city: string;
  preferredSide: CourtPosition | null;
  answers: OnboardingAnswer[];
}

const getQuestions = (t: ReturnType<typeof getTranslation>) => [
  {
    id: 1,
    key: 'tournaments' as const,
    text: t.onboarding.questions.tournaments.title,
    weight: 10,
    options: t.onboarding.questions.tournaments.options.map((text, index) => ({
      text,
      value: index + 1,
    })),
  },
  {
    id: 2,
    key: 'windowUse' as const,
    text: t.onboarding.questions.windowUse.title,
    weight: 10,
    options: t.onboarding.questions.windowUse.options.map((text, index) => ({
      text,
      value: index + 1,
    })),
  },
  {
    id: 3,
    key: 'lobsAndSmashes' as const,
    text: t.onboarding.questions.lobsAndSmashes.title,
    weight: 10,
    options: t.onboarding.questions.lobsAndSmashes.options.map((text, index) => ({
      text,
      value: index + 1,
    })),
  },
  {
    id: 4,
    key: 'returnService' as const,
    text: t.onboarding.questions.returnService.title,
    weight: 10,
    options: t.onboarding.questions.returnService.options.map((text, index) => ({
      text,
      value: index + 1,
    })),
  },
  {
    id: 5,
    key: 'serviceAndRally' as const,
    text: t.onboarding.questions.serviceAndRally.title,
    weight: 10,
    options: t.onboarding.questions.serviceAndRally.options.map((text, index) => ({
      text,
      value: index + 1,
    })),
  },
];

const TIER_MAPPING = [
  { min: 0, max: 19, tier: 'Cuivre' as const, sub: 1 as const },
  { min: 20, max: 26, tier: 'Cuivre' as const, sub: 2 as const },
  { min: 27, max: 33, tier: 'Cuivre' as const, sub: 3 as const },
  { min: 34, max: 40, tier: 'Silver' as const, sub: 1 as const },
  { min: 41, max: 47, tier: 'Silver' as const, sub: 2 as const },
  { min: 48, max: 54, tier: 'Silver' as const, sub: 3 as const },
  { min: 55, max: 61, tier: 'Gold' as const, sub: 1 as const },
  { min: 62, max: 68, tier: 'Gold' as const, sub: 2 as const },
  { min: 69, max: 75, tier: 'Gold' as const, sub: 3 as const },
  { min: 76, max: 82, tier: 'Platinum' as const, sub: 1 as const },
  { min: 83, max: 89, tier: 'Platinum' as const, sub: 2 as const },
  { min: 90, max: 100, tier: 'Platinum' as const, sub: 3 as const },
];

function computeRankFromScore(score: number) {
  const mapping = TIER_MAPPING.find((m) => score >= m.min && score <= m.max);
  return mapping || TIER_MAPPING[0];
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { assessRanking } = useAuth();
  const { language } = useLanguage();
  const t = getTranslation(language);
  const QUESTIONS = useMemo(() => getQuestions(t), [t]);

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [state, setState] = useState<OnboardingState>({
    avatarUri: '',
    username: '',
    city: '',
    preferredSide: null,
    answers: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState<boolean>(false);

  const totalSteps = 3 + QUESTIONS.length + 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const currentQuestion = useMemo(() => {
    if (currentStep >= 3 && currentStep < 3 + QUESTIONS.length) {
      return QUESTIONS[currentStep - 3];
    }
    return null;
  }, [currentStep, QUESTIONS]);

  const currentAnswer = useMemo(() => {
    if (currentQuestion) {
      return state.answers.find((a) => a.questionIndex === currentQuestion.id);
    }
    return null;
  }, [currentQuestion, state.answers]);

  const filteredCities = useMemo(() => {
    if (!state.city) return MOROCCO_CITIES.slice(0, 10);
    return MOROCCO_CITIES.filter((c) =>
      c.toLowerCase().includes(state.city.toLowerCase())
    ).slice(0, 10);
  }, [state.city]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera roll permission is required to select a photo.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images' as any,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setState((prev) => ({ ...prev, avatarUri: result.assets[0].uri }));
        setErrors((prev) => ({ ...prev, avatar: '' }));
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take a photo.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setState((prev) => ({ ...prev, avatarUri: result.assets[0].uri }));
        setErrors((prev) => ({ ...prev, avatar: '' }));
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 0) {
      if (!state.avatarUri) {
        newErrors.avatar = 'Please select an avatar';
      }
      if (!state.username.trim()) {
        newErrors.username = 'Please enter a username';
      } else if (state.username.length < 3 || state.username.length > 24) {
        newErrors.username = 'Username must be 3-24 characters';
      } else if (!/^[a-zA-Z0-9_]+$/.test(state.username)) {
        newErrors.username = 'Username can only contain letters, numbers, and underscores';
      }
    } else if (currentStep === 1) {
      if (!state.city.trim()) {
        newErrors.city = 'Please enter your city';
      } else if (state.city.length < 2 || state.city.length > 48) {
        newErrors.city = 'City must be 2-48 characters';
      }
    } else if (currentStep === 2) {
      if (!state.preferredSide) {
        newErrors.preferredSide = 'Please select your preferred court position';
      }
    } else if (currentQuestion && !currentAnswer) {
      newErrors.question = 'Please select an answer';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;

    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
      setErrors({});
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setErrors({});
    }
  };

  const handleAnswerSelect = (value: number) => {
    if (!currentQuestion) return;

    setState((prev) => {
      const existingIndex = prev.answers.findIndex((a) => a.questionIndex === currentQuestion.id);
      const newAnswers = [...prev.answers];

      if (existingIndex >= 0) {
        newAnswers[existingIndex] = { questionIndex: currentQuestion.id, value };
      } else {
        newAnswers.push({ questionIndex: currentQuestion.id, value });
      }

      return { ...prev, answers: newAnswers };
    });
    setErrors((prev) => ({ ...prev, question: '' }));
  };

  const handleFinish = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setIsLoading(true);
    try {
      const totalScore = state.answers.reduce((sum, a) => sum + a.value, 0);
      const score100 = ((totalScore - 10) * 100) / 40;
      const rankMapping = computeRankFromScore(score100);

      console.log('💾 Saving onboarding with completed flag...');
      
      const answersMap: Record<string, any> = {
        username: state.username,
        avatarUri: state.avatarUri,
        city: state.city,
        preferredSide: state.preferredSide,
      };
      
      state.answers.forEach((a) => {
        answersMap[`q${a.questionIndex}`] = a.value;
      });
      
      console.log('📊 Assessing ranking with data:', answersMap);
      await assessRanking(answersMap);

      console.log('✅ Onboarding completed, navigating to home...');
      router.replace('/(tabs)');
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      console.error('❌ Onboarding save error:', errorMessage);
      
      Alert.alert(
        'Error', 
        `Failed to save your profile:\n\n${errorMessage}\n\nPlease try again.`,
        [{ text: 'OK', style: 'default' }]
      );
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.colors.background, Colors.colors.surface]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.progressBar, { paddingTop: insets.top + 12 }]}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {t.onboarding.step} {currentStep + 1} {t.onboarding.of} {totalSteps}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {currentStep === 0 && (
            <StepAvatarUsername
              avatarUri={state.avatarUri}
              username={state.username}
              errors={errors}
              t={t}
              onUsernameChange={(text) => {
                setState((prev) => ({ ...prev, username: text }));
                setErrors((prev) => ({ ...prev, username: '' }));
              }}
              onPickImage={pickImage}
              onTakePhoto={takePhoto}
            />
          )}

          {currentStep === 1 && (
            <StepCity
              city={state.city}
              errors={errors}
              showSuggestions={showCitySuggestions}
              filteredCities={filteredCities}
              t={t}
              onCityChange={(text) => {
                setState((prev) => ({ ...prev, city: text }));
                setErrors((prev) => ({ ...prev, city: '' }));
                setShowCitySuggestions(text.length > 0);
              }}
              onCitySelect={(city) => {
                setState((prev) => ({ ...prev, city }));
                setShowCitySuggestions(false);
                setErrors((prev) => ({ ...prev, city: '' }));
              }}
              onFocus={() => setShowCitySuggestions(state.city.length > 0)}
              onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
            />
          )}

          {currentStep === 2 && (
            <StepPreferredSide
              preferredSide={state.preferredSide}
              error={errors.preferredSide}
              t={t}
              onSelectSide={(position) => {
                setState((prev) => ({ ...prev, preferredSide: position }));
                setErrors((prev) => ({ ...prev, preferredSide: '' }));
              }}
            />
          )}

          {currentQuestion && (
            <StepQuestion
              question={currentQuestion}
              questionNumber={currentStep - 2}
              totalQuestions={QUESTIONS.length}
              selectedValue={currentAnswer?.value}
              error={errors.question}
              t={t}
              onSelect={handleAnswerSelect}
            />
          )}

          {currentStep === totalSteps - 1 && (
            <StepResult
              avatarUri={state.avatarUri}
              username={state.username}
              city={state.city}
              answers={state.answers}
              t={t}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.footerButtons}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              testID="onboarding-back"
            >
              <ChevronLeft color={Colors.colors.primary} size={24} />
              <Text style={styles.backButtonText}>{t.onboarding.back}</Text>
            </TouchableOpacity>
          )}

          {currentStep < totalSteps - 1 ? (
            <TouchableOpacity
              style={[styles.nextButton, currentStep === 0 && styles.nextButtonFullWidth]}
              onPress={handleNext}
              testID="onboarding-next"
            >
              <LinearGradient
                colors={[Colors.colors.primary, Colors.colors.primaryDark]}
                style={styles.nextButtonGradient}
              >
                <Text style={styles.nextButtonText}>{t.onboarding.next}</Text>
                <ChevronRight color={Colors.colors.textPrimary} size={24} />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextButton, styles.nextButtonFullWidth]}
              onPress={handleFinish}
              disabled={isLoading || isSubmitting}
              testID="finish-onboarding"
            >
              <LinearGradient
                colors={[Colors.colors.success, Colors.colors.success]}
                style={styles.nextButtonGradient}
              >
                {isLoading || isSubmitting ? (
                  <ActivityIndicator color={Colors.colors.textPrimary} />
                ) : (
                  <Text style={styles.nextButtonText}>{t.onboarding.finish}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

function StepAvatarUsername({
  avatarUri,
  username,
  errors,
  t,
  onUsernameChange,
  onPickImage,
  onTakePhoto,
}: {
  avatarUri: string;
  username: string;
  errors: Record<string, string>;
  t: ReturnType<typeof getTranslation>;
  onUsernameChange: (text: string) => void;
  onPickImage: () => void;
  onTakePhoto: () => void;
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t.onboarding.setupProfile}</Text>
      <Text style={styles.stepSubtitle}>{t.onboarding.avatarUsername}</Text>

      <View style={styles.avatarSection}>
        <TouchableOpacity
          style={[styles.avatarPreview, errors.avatar && styles.avatarPreviewError]}
          onPress={onPickImage}
          testID="avatar-picker"
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <User color={Colors.colors.textSecondary} size={48} />
            </View>
          )}
        </TouchableOpacity>
        {errors.avatar && <Text style={styles.errorText}>{errors.avatar}</Text>}

        <View style={styles.avatarButtons}>
          <TouchableOpacity style={styles.avatarButton} onPress={onPickImage}>
            <Camera color={Colors.colors.primary} size={20} />
            <Text style={styles.avatarButtonText}>{t.onboarding.gallery}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarButton} onPress={onTakePhoto}>
            <Camera color={Colors.colors.primary} size={20} />
            <Text style={styles.avatarButtonText}>{t.onboarding.camera}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>{t.auth.username}</Text>
        <TextInput
          style={[styles.textInput, errors.username && styles.textInputError]}
          value={username}
          onChangeText={onUsernameChange}
          placeholder={t.auth.usernamePlaceholder}
          placeholderTextColor={Colors.colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={24}
          testID="username-input"
        />
        {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
        <Text style={styles.inputHint}>{t.onboarding.usernameHint}</Text>
      </View>
    </View>
  );
}

function StepCity({
  city,
  errors,
  showSuggestions,
  filteredCities,
  t,
  onCityChange,
  onCitySelect,
  onFocus,
  onBlur,
}: {
  city: string;
  errors: Record<string, string>;
  showSuggestions: boolean;
  filteredCities: string[];
  t: ReturnType<typeof getTranslation>;
  onCityChange: (text: string) => void;
  onCitySelect: (city: string) => void;
  onFocus: () => void;
  onBlur: () => void;
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t.onboarding.wherePlay}</Text>
      <Text style={styles.stepSubtitle}>{t.onboarding.citySubtitle}</Text>

      <View style={styles.inputSection}>
        <View style={styles.cityInputContainer}>
          <MapPin color={Colors.colors.primary} size={20} />
          <TextInput
            style={[styles.cityInput, errors.city && styles.textInputError]}
            value={city}
            onChangeText={onCityChange}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder={t.onboarding.cityPlaceholder}
            placeholderTextColor={Colors.colors.textMuted}
            maxLength={48}
            testID="city-input"
          />
        </View>
        {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}

        {showSuggestions && filteredCities.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {filteredCities.map((c) => (
              <TouchableOpacity
                key={c}
                style={styles.suggestionItem}
                onPress={() => onCitySelect(c)}
              >
                <Text style={styles.suggestionText}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function StepQuestion({
  question,
  questionNumber,
  totalQuestions,
  selectedValue,
  error,
  t,
  onSelect,
}: {
  question: { id: number; key: string; text: string; weight: number; options: { text: string; value: number }[] };
  questionNumber: number;
  totalQuestions: number;
  selectedValue: number | undefined;
  error: string | undefined;
  t: ReturnType<typeof getTranslation>;
  onSelect: (value: number) => void;
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.questionNumber}>
        {t.onboarding.questionNumber} {questionNumber} {t.onboarding.of} {totalQuestions}
      </Text>
      <Text style={styles.stepTitle}>{question.text}</Text>

      <View style={styles.optionsContainer}>
        {question.options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              selectedValue === option.value && styles.optionButtonSelected,
              error && !selectedValue && styles.optionButtonError,
            ]}
            onPress={() => onSelect(option.value)}
            testID={`quiz-option-${option.value}`}
          >
            <View style={styles.optionRadio}>
              {selectedValue === option.value && <View style={styles.optionRadioFill} />}
            </View>
            <Text
              style={[
                styles.optionText,
                selectedValue === option.value && styles.optionTextSelected,
              ]}
            >
              {option.text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

function StepPreferredSide({
  preferredSide,
  error,
  t,
  onSelectSide,
}: {
  preferredSide: CourtPosition | null;
  error: string | undefined;
  t: ReturnType<typeof getTranslation>;
  onSelectSide: (position: CourtPosition) => void;
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t.onboarding.whichSide}</Text>
      <Text style={styles.stepSubtitle}>
        {t.onboarding.sideSubtitle}
      </Text>

      <View style={styles.courtSelectorContainer}>
        <PadelCourtSelector
          selectedPosition={preferredSide || undefined}
          onSelectPosition={onSelectSide}
          showLabels={true}
        />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

function StepResult({
  avatarUri,
  username,
  city,
  answers,
  t,
}: {
  avatarUri: string;
  username: string;
  city: string;
  answers: OnboardingAnswer[];
  t: ReturnType<typeof getTranslation>;
}) {
  const totalScore = answers.reduce((sum, a) => sum + a.value, 0);
  const score100 = ((totalScore - 10) * 100) / 40;
  const rankMapping = computeRankFromScore(score100);

  const rankEmoji = {
    Cuivre: '🥉',
    Silver: '🥈',
    Gold: '🥇',
    Platinum: '💎',
  }[rankMapping.tier];

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t.onboarding.welcomeResult}</Text>
      <Text style={styles.stepSubtitle}>{t.onboarding.profileReady}</Text>

      <View style={styles.resultCard}>
        {avatarUri && (
          <Image source={{ uri: avatarUri }} style={styles.resultAvatar} />
        )}
        <Text style={styles.resultUsername}>{username}</Text>
        <View style={styles.resultLocation}>
          <MapPin color={Colors.colors.textSecondary} size={16} />
          <Text style={styles.resultCity}>{city}</Text>
        </View>
      </View>

      <View style={styles.rankCard}>
        <Text style={styles.rankCardTitle}>{t.onboarding.startingRank}</Text>
        <Text style={styles.rankEmoji}>{rankEmoji}</Text>
        <Text style={styles.rankText}>
          {rankMapping.tier} {rankMapping.sub}
        </Text>
        <Text style={styles.rankDescription}>
          {t.onboarding.rankDescription} {rankMapping.tier} {t.onboarding.rankDescriptionEnd}
        </Text>
      </View>
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
  progressBar: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: Colors.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.colors.border,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.colors.surfaceLight,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.colors.primary,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.colors.textSecondary,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 24,
  },
  stepContainer: {
    gap: 24,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: Colors.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  avatarSection: {
    alignItems: 'center',
    gap: 16,
  },
  avatarPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: Colors.colors.surfaceLight,
    borderWidth: 3,
    borderColor: Colors.colors.border,
  },
  avatarPreviewError: {
    borderColor: Colors.colors.error,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: Colors.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.colors.border,
  },
  avatarButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.colors.primary,
  },
  inputSection: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
  },
  textInput: {
    backgroundColor: Colors.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.colors.border,
    padding: 16,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
  },
  textInputError: {
    borderColor: Colors.colors.error,
  },
  inputHint: {
    fontSize: 12,
    color: Colors.colors.textSecondary,
  },
  cityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.colors.border,
    padding: 16,
  },
  cityInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
    padding: 0,
  },
  suggestionsContainer: {
    backgroundColor: Colors.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.colors.border,
    overflow: 'hidden',
  },
  suggestionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.colors.border,
  },
  suggestionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.colors.primary,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: Colors.colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.colors.border,
  },
  optionButtonSelected: {
    borderColor: Colors.colors.primary,
    backgroundColor: Colors.colors.primary + '10',
  },
  optionButtonError: {
    borderColor: Colors.colors.error + '40',
  },
  optionRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRadioFill: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.colors.primary,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.colors.textPrimary,
  },
  optionTextSelected: {
    fontWeight: '600' as const,
    color: Colors.colors.primary,
  },
  resultCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.colors.border,
    gap: 12,
  },
  resultAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  resultUsername: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  resultLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultCity: {
    fontSize: 16,
    color: Colors.colors.textSecondary,
  },
  rankCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.colors.border,
    gap: 12,
  },
  rankCardTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.colors.textSecondary,
    textTransform: 'uppercase' as const,
  },
  rankEmoji: {
    fontSize: 64,
  },
  rankText: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  rankDescription: {
    fontSize: 14,
    color: Colors.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  courtSelectorContainer: {
    marginVertical: 16,
  },
  errorText: {
    fontSize: 14,
    color: Colors.colors.error,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: Colors.colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.colors.border,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: Colors.colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.colors.border,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.colors.primary,
  },
  nextButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  nextButtonFullWidth: {
    flex: 1,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
});
