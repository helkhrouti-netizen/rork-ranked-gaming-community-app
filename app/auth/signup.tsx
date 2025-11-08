import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, User, Lock, Phone } from 'lucide-react-native';

import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/constants/translations';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signup } = useAuth();
  const { language } = useLanguage();
  const t = getTranslation(language);

  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSignup = async () => {
    setError('');

    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!phoneNumber.trim()) {
      setError('Please enter your phone number');
      return;
    }

    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber.replace(/[\s-]/g, ''))) {
      setError('Please enter a valid phone number (e.g., +212 6XX XXX XXX)');
      return;
    }

    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await signup(
        email.trim().toLowerCase(),
        password.trim(),
        username.trim(),
        phoneNumber.trim()
      );

      console.log('✅ Sign up successful, profile created in database');
      router.replace('/onboarding');
    } catch (err: any) {
      let userMessage = err.message || 'Failed to create account. Please try again.';
      
      if (err.message && err.message.includes('Network request failed')) {
        userMessage = 'Network error: Cannot connect to server. Please check your internet connection or try the test button below.';
      } else if (err.message && err.message.includes('Invalid API key')) {
        userMessage = 'Server configuration error. Please contact support.';
      }
      
      setError(userMessage);
      console.error('Signup error:', err);
      console.error('Error details:', {
        message: err.message,
        name: err.name,
        stack: err.stack
      });
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
            <LanguageSwitcher />
            <Text style={styles.emoji}>🎾</Text>
            <Text style={styles.title}>{t.auth.createAccount}</Text>
            <Text style={styles.subtitle}>{t.auth.signupSubtitle}</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <User color={Colors.colors.primary} size={20} strokeWidth={2.5} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>{t.auth.username}</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder={t.auth.usernamePlaceholder}
                  placeholderTextColor={Colors.colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="signup-username-input"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Mail color={Colors.colors.primary} size={20} strokeWidth={2.5} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>{t.auth.email}</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t.auth.emailPlaceholder}
                  placeholderTextColor={Colors.colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  testID="signup-email-input"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Phone color={Colors.colors.primary} size={20} strokeWidth={2.5} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>{t.auth.phoneNumber}</Text>
                <TextInput
                  style={styles.input}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="+212 6XX XXX XXX"
                  placeholderTextColor={Colors.colors.textMuted}
                  keyboardType="phone-pad"
                  testID="signup-phone-input"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Lock color={Colors.colors.primary} size={20} strokeWidth={2.5} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>{t.auth.password}</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t.auth.passwordPlaceholder}
                  placeholderTextColor={Colors.colors.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="signup-password-input"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Lock color={Colors.colors.primary} size={20} strokeWidth={2.5} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>{t.auth.confirmPassword}</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder={t.auth.confirmPasswordPlaceholder}
                  placeholderTextColor={Colors.colors.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[
                styles.signupButton,
                (!username.trim() || !email.trim() || !phoneNumber.trim() || !password.trim() || !confirmPassword.trim() || isLoading) &&
                  styles.signupButtonDisabled,
              ]}
              onPress={handleSignup}
              disabled={!username.trim() || !email.trim() || !phoneNumber.trim() || !password.trim() || !confirmPassword.trim() || isLoading}
              activeOpacity={0.8}
              testID="signup-submit-button"
            >
              <LinearGradient
                colors={
                  !username.trim() || !email.trim() || !phoneNumber.trim() || !password.trim() || !confirmPassword.trim() || isLoading
                    ? [Colors.colors.surfaceLight, Colors.colors.surfaceLight]
                    : [Colors.colors.primary, Colors.colors.primaryDark]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.signupButtonGradient}
              >
                <Text
                  style={[
                    styles.signupButtonText,
                    (!username.trim() || !email.trim() || !phoneNumber.trim() || !password.trim() || !confirmPassword.trim() || isLoading) &&
                      styles.signupButtonTextDisabled,
                  ]}
                >
                  {isLoading ? t.auth.creatingAccount : t.auth.signup}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t.auth.or}</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.replace('/auth/login' as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>
                {t.auth.alreadyHaveAccount}{' '}
                <Text style={styles.loginButtonTextBold}>{t.auth.login}</Text>
              </Text>
            </TouchableOpacity>

            {error && error.includes('Network error') && (
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => router.push('/test-supabase' as any)}
                activeOpacity={0.8}
              >
                <Text style={styles.testButtonText}>
                  🧪 RUN CONNECTION TEST
                </Text>
              </TouchableOpacity>
            )}
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
    marginBottom: 40,
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
  form: {
    flex: 1,
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
    marginBottom: 16,
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
  signupButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  signupButtonDisabled: {
    opacity: 0.5,
  },
  signupButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  signupButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  signupButtonTextDisabled: {
    color: Colors.colors.textMuted,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: Colors.colors.textSecondary,
    fontWeight: '600' as const,
  },
  loginButton: {
    padding: 16,
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 16,
    color: Colors.colors.textSecondary,
    fontWeight: '500' as const,
  },
  loginButtonTextBold: {
    fontWeight: '700' as const,
    color: Colors.colors.primary,
  },
  testButton: {
    marginTop: 16,
    padding: 16,
    backgroundColor: Colors.colors.warning + '30',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.colors.warning,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.colors.warning,
  },
});
