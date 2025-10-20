import React, { useState, useRef, useEffect } from 'react';
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
import { Mail, Phone, ShieldCheck } from 'lucide-react-native';

import Colors from '@/constants/colors';
import { useUserProfile } from '@/contexts/UserProfileContext';

const CODE_LENGTH = 6;

export default function VerifyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { pendingVerification, verifyAccount, resendVerificationCode } = useUserProfile();

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [resendTimer, setResendTimer] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);

  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    if (!pendingVerification) {
      router.replace('/auth/login');
      return;
    }

    const mockCode = '123456';
    console.log(`Mock verification code for ${pendingVerification.authMethod}: ${mockCode}`);
    console.log(`Sent to: ${pendingVerification.emailOrPhone}`);
  }, [pendingVerification, router]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleCodeChange = (text: string, index: number) => {
    if (text.length > 1) {
      const pastedCode = text.slice(0, CODE_LENGTH).split('');
      const newCode = [...code];
      pastedCode.forEach((char, i) => {
        if (index + i < CODE_LENGTH) {
          newCode[index + i] = char;
        }
      });
      setCode(newCode);
      
      const nextIndex = Math.min(index + pastedCode.length, CODE_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const enteredCode = code.join('');
    
    if (enteredCode.length !== CODE_LENGTH) {
      setError('Please enter the complete verification code');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const mockCode = '123456';
      if (enteredCode !== mockCode) {
        throw new Error('Invalid verification code. Please try again.');
      }

      await verifyAccount(enteredCode);
      router.replace('/onboarding');
    } catch (err: any) {
      setError(err.message || 'Failed to verify. Please try again.');
      console.error('Verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    try {
      await resendVerificationCode();
      setResendTimer(60);
      setCanResend(false);
      setError('');
      
      const mockCode = '123456';
      console.log(`Resent verification code: ${mockCode}`);
      console.log(`Sent to: ${pendingVerification?.emailOrPhone}`);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please try again.');
      console.error('Resend error:', err);
    }
  };

  if (!pendingVerification) {
    return null;
  }

  const isEmail = pendingVerification.authMethod === 'email';

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
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={[Colors.colors.primary, Colors.colors.primaryDark]}
                style={styles.iconGradient}
              >
                {isEmail ? (
                  <Mail color={Colors.colors.textPrimary} size={40} strokeWidth={2.5} />
                ) : (
                  <Phone color={Colors.colors.textPrimary} size={40} strokeWidth={2.5} />
                )}
              </LinearGradient>
            </View>

            <Text style={styles.title}>Verify Your Account</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to{'\n'}
              <Text style={styles.subtitleBold}>{pendingVerification.emailOrPhone}</Text>
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.codeContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    if (ref) inputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.codeInput,
                    digit && styles.codeInputFilled,
                  ]}
                  value={digit}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  autoFocus={index === 0}
                />
              ))}
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[
                styles.verifyButton,
                (code.join('').length !== CODE_LENGTH || isLoading) &&
                  styles.verifyButtonDisabled,
              ]}
              onPress={handleVerify}
              disabled={code.join('').length !== CODE_LENGTH || isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  code.join('').length !== CODE_LENGTH || isLoading
                    ? [Colors.colors.surfaceLight, Colors.colors.surfaceLight]
                    : [Colors.colors.primary, Colors.colors.primaryDark]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.verifyButtonGradient}
              >
                <ShieldCheck
                  color={
                    code.join('').length !== CODE_LENGTH || isLoading
                      ? Colors.colors.textMuted
                      : Colors.colors.textPrimary
                  }
                  size={24}
                  strokeWidth={2.5}
                />
                <Text
                  style={[
                    styles.verifyButtonText,
                    (code.join('').length !== CODE_LENGTH || isLoading) &&
                      styles.verifyButtonTextDisabled,
                  ]}
                >
                  {isLoading ? 'Verifying...' : 'Verify Account'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>
                Didn&apos;t receive the code?{' '}
              </Text>
              {canResend ? (
                <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
                  <Text style={styles.resendButtonText}>Resend Code</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.resendTimerText}>
                  Resend in {resendTimer}s
                </Text>
              )}
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace('/auth/login')}
              activeOpacity={0.8}
            >
              <Text style={styles.backButtonText}>
                Back to{' '}
                <Text style={styles.backButtonTextBold}>Log In</Text>
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
  iconContainer: {
    marginBottom: 24,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
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
  subtitleBold: {
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  form: {
    flex: 1,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  codeInput: {
    width: 50,
    height: 60,
    backgroundColor: Colors.colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.colors.border,
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
    textAlign: 'center',
  },
  codeInputFilled: {
    borderColor: Colors.colors.primary,
    backgroundColor: Colors.colors.primary + '10',
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
  verifyButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonGradient: {
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  verifyButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
  },
  verifyButtonTextDisabled: {
    color: Colors.colors.textMuted,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  resendText: {
    fontSize: 14,
    color: Colors.colors.textSecondary,
    fontWeight: '500' as const,
  },
  resendButtonText: {
    fontSize: 14,
    color: Colors.colors.primary,
    fontWeight: '700' as const,
  },
  resendTimerText: {
    fontSize: 14,
    color: Colors.colors.textMuted,
    fontWeight: '600' as const,
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
  backButton: {
    padding: 16,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.colors.textSecondary,
    fontWeight: '500' as const,
  },
  backButtonTextBold: {
    fontWeight: '700' as const,
    color: Colors.colors.primary,
  },
});
