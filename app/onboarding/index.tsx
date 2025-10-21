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

import Colors from '@/constants/colors';
import { MOROCCO_CITIES, MoroccoCity } from '@/constants/cities';
import { profileService } from '@/services/profile';
import { useUserProfile } from '@/contexts/UserProfileContext';

interface OnboardingAnswer {
  questionIndex: number;
  value: number;
}

interface OnboardingState {
  avatarUri: string;
  username: string;
  city: string;
  answers: OnboardingAnswer[];
}

const QUESTIONS = [
  {
    id: 1,
    text: 'How long have you been playing padel?',
    options: [
      { text: 'Never played before', value: 1 },
      { text: 'Less than 6 months', value: 2 },
      { text: '6–12 months', value: 3 },
      { text: '1–3 years', value: 4 },
      { text: 'More than 3 years', value: 5 },
    ],
  },
  {
    id: 2,
    text: 'How often do you play?',
    options: [
      { text: 'Once a month or less', value: 1 },
      { text: 'Once every 2 weeks', value: 2 },
      { text: '1 match per week', value: 3 },
      { text: '2–3 matches per week', value: 4 },
      { text: '4+ matches per week', value: 5 },
    ],
  },
  {
    id: 3,
    text: 'Have you played official tournaments or leagues?',
    options: [
      { text: 'Never', value: 1 },
      { text: 'Friendly matches only', value: 2 },
      { text: 'Local amateur events', value: 3 },
      { text: 'Regional competitions', value: 4 },
      { text: 'National/international events', value: 5 },
    ],
  },
  {
    id: 4,
    text: 'Forehand/backhand consistency?',
    options: [
      { text: 'Rarely hit the ball clean', value: 1 },
      { text: 'Can rally a few shots', value: 2 },
      { text: 'Consistent in slow rallies', value: 3 },
      { text: 'Reliable at medium pace', value: 4 },
      { text: 'Very consistent under pressure', value: 5 },
    ],
  },
  {
    id: 5,
    text: 'Net play (volleys/smash) confidence?',
    options: [
      { text: 'Avoid the net', value: 1 },
      { text: 'Basic volleys only', value: 2 },
      { text: 'Comfortable at the net', value: 3 },
      { text: 'Aggressive finisher', value: 4 },
      { text: 'Control and place volleys precisely', value: 5 },
    ],
  },
  {
    id: 6,
    text: 'Tactics/positioning knowledge?',
    options: [
      { text: 'No idea where to stand', value: 1 },
      { text: "Follow partner's lead", value: 2 },
      { text: 'Basic understanding', value: 3 },
      { text: 'Know attack/defense positions', value: 4 },
      { text: 'Anticipate and control points', value: 5 },
    ],
  },
  {
    id: 7,
    text: 'Physical endurance & movement?',
    options: [
      { text: 'Struggle to keep up', value: 1 },
      { text: 'Move slowly', value: 2 },
      { text: 'Average fitness', value: 3 },
      { text: 'Good mobility & stamina', value: 4 },
      { text: 'Fast recovery & explosive', value: 5 },
    ],
  },
  {
    id: 8,
    text: 'Where do you usually play?',
    options: [
      { text: 'Never played / planning to start', value: 1 },
      { text: 'Public courts occasionally', value: 2 },
      { text: 'Local club regularly', value: 3 },
      { text: 'Private club / training sessions', value: 4 },
      { text: 'Professional academy', value: 5 },
    ],
  },
  {
    id: 9,
    text: 'Do you take lessons/coaching?',
    options: [
      { text: 'Never', value: 1 },
      { text: 'Once or twice', value: 2 },
      { text: 'Occasional classes', value: 3 },
      { text: 'Weekly coaching', value: 4 },
      { text: 'Personal coach / team training', value: 5 },
    ],
  },
  {
    id: 10,
    text: 'Typical match outcome?',
    options: [
      { text: 'Rarely win points', value: 1 },
      { text: 'Win some but lose often', value: 2 },
      { text: 'Balanced matches', value: 3 },
      { text: 'Win most friendlies', value: 4 },
      { text: 'Consistently win competitive matches', value: 5 },
    ],
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
  const { updateProfile } = useUserProfile();

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [state, setState] = useState<OnboardingState>({
    avatarUri: '',
    username: '',
    city: '',
    answers: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState<boolean>(false);

  const totalSteps = 2 + QUESTIONS.length + 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const currentQuestion = useMemo(() => {
    if (currentStep >= 2 && currentStep < 2 + QUESTIONS.length) {
      return QUESTIONS[currentStep - 2];
    }
    return null;
  }, [currentStep]);

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
    setIsLoading(true);
    try {
      const totalScore = state.answers.reduce((sum, a) => sum + a.value, 0);
      const score100 = ((totalScore - 10) * 100) / 40;
      const rankMapping = computeRankFromScore(score100);

      const rpBase = {
        Cuivre: 0,
        Silver: 180,
        Gold: 420,
        Platinum: 720,
      }[rankMapping.tier];

      const rpSub = (rankMapping.sub - 1) * 80;
      const rp = rpBase + rpSub + 40;

      await profileService.saveOnboarding({
        avatarUri: state.avatarUri,
        username: state.username,
        city: state.city,
        score: score100,
        rankTier: rankMapping.tier,
        rankSub: rankMapping.sub,
        rp,
      });

      await updateProfile({
        username: state.username,
        city: state.city as MoroccoCity,
        profilePicture: state.avatarUri,
      });

      router.replace('/(tabs)');
    } catch (error) {
      console.error('Onboarding save error:', error);
      Alert.alert('Error', 'Failed to save onboarding. Please try again.');
    } finally {
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
          Step {currentStep + 1} of {totalSteps}
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

          {currentQuestion && (
            <StepQuestion
              question={currentQuestion}
              questionNumber={currentStep - 1}
              totalQuestions={QUESTIONS.length}
              selectedValue={currentAnswer?.value}
              error={errors.question}
              onSelect={handleAnswerSelect}
            />
          )}

          {currentStep === totalSteps - 1 && (
            <StepResult
              avatarUri={state.avatarUri}
              username={state.username}
              city={state.city}
              answers={state.answers}
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
              <Text style={styles.backButtonText}>Back</Text>
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
                <Text style={styles.nextButtonText}>Next</Text>
                <ChevronRight color={Colors.colors.textPrimary} size={24} />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextButton, styles.nextButtonFullWidth]}
              onPress={handleFinish}
              disabled={isLoading}
              testID="quiz-submit"
            >
              <LinearGradient
                colors={[Colors.colors.success, Colors.colors.success]}
                style={styles.nextButtonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.colors.textPrimary} />
                ) : (
                  <Text style={styles.nextButtonText}>Finish</Text>
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
  onUsernameChange,
  onPickImage,
  onTakePhoto,
}: {
  avatarUri: string;
  username: string;
  errors: Record<string, string>;
  onUsernameChange: (text: string) => void;
  onPickImage: () => void;
  onTakePhoto: () => void;
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Set Up Your Profile</Text>
      <Text style={styles.stepSubtitle}>Choose an avatar and create your username</Text>

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
            <Text style={styles.avatarButtonText}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarButton} onPress={onTakePhoto}>
            <Camera color={Colors.colors.primary} size={20} />
            <Text style={styles.avatarButtonText}>Camera</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Username</Text>
        <TextInput
          style={[styles.textInput, errors.username && styles.textInputError]}
          value={username}
          onChangeText={onUsernameChange}
          placeholder="Enter your username"
          placeholderTextColor={Colors.colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={24}
          testID="username-input"
        />
        {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
        <Text style={styles.inputHint}>3-24 characters, letters, numbers, and underscores only</Text>
      </View>
    </View>
  );
}

function StepCity({
  city,
  errors,
  showSuggestions,
  filteredCities,
  onCityChange,
  onCitySelect,
  onFocus,
  onBlur,
}: {
  city: string;
  errors: Record<string, string>;
  showSuggestions: boolean;
  filteredCities: string[];
  onCityChange: (text: string) => void;
  onCitySelect: (city: string) => void;
  onFocus: () => void;
  onBlur: () => void;
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Where do you play?</Text>
      <Text style={styles.stepSubtitle}>Select your city or enter a custom location</Text>

      <View style={styles.inputSection}>
        <View style={styles.cityInputContainer}>
          <MapPin color={Colors.colors.primary} size={20} />
          <TextInput
            style={[styles.cityInput, errors.city && styles.textInputError]}
            value={city}
            onChangeText={onCityChange}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder="Enter your city"
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
  onSelect,
}: {
  question: typeof QUESTIONS[0];
  questionNumber: number;
  totalQuestions: number;
  selectedValue: number | undefined;
  error: string | undefined;
  onSelect: (value: number) => void;
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.questionNumber}>
        Question {questionNumber} of {totalQuestions}
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

function StepResult({
  avatarUri,
  username,
  city,
  answers,
}: {
  avatarUri: string;
  username: string;
  city: string;
  answers: OnboardingAnswer[];
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
      <Text style={styles.stepTitle}>Welcome to Padel League!</Text>
      <Text style={styles.stepSubtitle}>Your profile is ready</Text>

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
        <Text style={styles.rankCardTitle}>Your Starting Rank</Text>
        <Text style={styles.rankEmoji}>{rankEmoji}</Text>
        <Text style={styles.rankText}>
          {rankMapping.tier} {rankMapping.sub}
        </Text>
        <Text style={styles.rankDescription}>
          Based on your skill assessment, you&apos;re starting in {rankMapping.tier} tier. Play matches to climb the ranks!
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
