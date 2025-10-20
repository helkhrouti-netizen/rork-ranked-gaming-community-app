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
import { Mail, Phone, Lock, User } from 'lucide-react-native';

import Colors from '@/constants/colors';
import { useUserProfile } from '@/contexts/UserProfileContext';

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signup } = useUserProfile();

  const [signupMethod, setSignupMethod] = useState<'email' | 'phone'>('email');
  const [emailOrPhone, setEmailOrPhone] = useState<string>('');
  const [username, setUsername] = useState<string>('');
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

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (!emailOrPhone.trim()) {
      setError(`Please enter your ${signupMethod === 'email' ? 'email' : 'phone number'}`);
      return;
    }

    if (signupMethod === 'email' && !emailOrPhone.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    if (password.trim().length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await signup(emailOrPhone.trim(), password.trim(), username.trim(), signupMethod);
      router.replace('/auth/verify');
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
      console.error('Signup error:', err);
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
            <Text style={styles.emoji}>🎾</Text>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to start playing</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.methodSelector}>
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  signupMethod === 'email' && styles.methodButtonActive,
                ]}
                onPress={() => {
                  setSignupMethod('email');
                  setEmailOrPhone('');
                  setError('');
                }}
                activeOpacity={0.7}
              >
                <Mail
                  color={
                    signupMethod === 'email'
                      ? Colors.colors.textPrimary
                      : Colors.colors.textSecondary
                  }
                  size={20}
                  strokeWidth={2.5}
                />
                <Text
                  style={[
                    styles.methodButtonText,
                    signupMethod === 'email' && styles.methodButtonTextActive,
                  ]}
                >
                  Email
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodButton,
                  signupMethod === 'phone' && styles.methodButtonActive,
                ]}
                onPress={() => {
                  setSignupMethod('phone');
                  setEmailOrPhone('');
                  setError('');
                }}
                activeOpacity={0.7}
              >
                <Phone
                  color={
                    signupMethod === 'phone'
                      ? Colors.colors.textPrimary
                      : Colors.colors.textSecondary
                  }
                  size={20}
                  strokeWidth={2.5}
                />
                <Text
                  style={[
                    styles.methodButtonText,
                    signupMethod === 'phone' && styles.methodButtonTextActive,
                  ]}
                >
                  Phone
                </Text>
              </TouchableOpacity>
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

            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                {signupMethod === 'email' ? (
                  <Mail color={Colors.colors.primary} size={20} strokeWidth={2.5} />
                ) : (
                  <Phone color={Colors.colors.primary} size={20} strokeWidth={2.5} />
                )}
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>
                  {signupMethod === 'email' ? 'Email Address' : 'Phone Number'}
                </Text>
                <TextInput
                  style={styles.input}
                  value={emailOrPhone}
                  onChangeText={setEmailOrPhone}
                  placeholder={
                    signupMethod === 'email'
                      ? 'example@email.com'
                      : '+212 6XX XXX XXX'
                  }
                  placeholderTextColor={Colors.colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType={signupMethod === 'email' ? 'email-address' : 'phone-pad'}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Lock color={Colors.colors.primary} size={20} strokeWidth={2.5} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a password"
                  placeholderTextColor={Colors.colors.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Lock color={Colors.colors.primary} size={20} strokeWidth={2.5} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
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
                (!emailOrPhone.trim() ||
                  !username.trim() ||
                  !password.trim() ||
                  !confirmPassword.trim() ||
                  isLoading) &&
                  styles.signupButtonDisabled,
              ]}
              onPress={handleSignup}
              disabled={
                !emailOrPhone.trim() ||
                !username.trim() ||
                !password.trim() ||
                !confirmPassword.trim() ||
                isLoading
              }
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  !emailOrPhone.trim() ||
                  !username.trim() ||
                  !password.trim() ||
                  !confirmPassword.trim() ||
                  isLoading
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
                    (!emailOrPhone.trim() ||
                      !username.trim() ||
                      !password.trim() ||
                      !confirmPassword.trim() ||
                      isLoading) &&
                      styles.signupButtonTextDisabled,
                  ]}
                >
                  {isLoading ? 'Creating Account...' : 'Sign Up'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.replace('/auth/login')}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>
                Already have an account?{' '}
                <Text style={styles.loginButtonTextBold}>Log In</Text>
              </Text>
            </TouchableOpacity>
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
  methodSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: Colors.colors.border,
  },
  methodButtonActive: {
    borderColor: Colors.colors.primary,
    backgroundColor: Colors.colors.primary + '10',
  },
  methodButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.colors.textSecondary,
  },
  methodButtonTextActive: {
    color: Colors.colors.textPrimary,
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
});
