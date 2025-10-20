import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, CheckCircle, XCircle, AlertCircle, Copy } from 'lucide-react-native';
import { supabase, getSupabaseConfig } from '@/lib/supabase';
import Colors from '@/constants/colors';
import * as Clipboard from 'expo-clipboard';

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

interface TestResult {
  status: TestStatus;
  message: string;
  details?: string;
  errorCode?: string;
  envVarsUsed?: {
    url: string;
    keyPreview: string;
  };
}

export default function DebugSupabaseScreen() {
  const router = useRouter();
  const [isAutoRunComplete, setIsAutoRunComplete] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<TestResult>({ status: 'idle', message: '' });
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const config = getSupabaseConfig();
  const urlHost = config.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const maskedKey = `${config.anonKey.substring(0, 4)}...${config.anonKey.substring(config.anonKey.length - 4)}`;

  const copyToClipboard = async (text: string, field: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const testConnection = useCallback(async () => {
    setTestResult({ status: 'testing', message: 'Testing connection...' });

    try {
      console.log('Testing Supabase connection...');
      console.log('Using URL:', config.url);
      console.log('Using Key (first 20):', config.anonKey.substring(0, 20));

      const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });

      if (error) {
        console.error('Connection test failed:', error);
        const errorMessage = error.message || 'Unknown error';
        const errorCode = error.code || 'N/A';
        const errorHint = error.hint || 'N/A';
        
        const detailsText = `Error Message: ${errorMessage}\n\nError Code: ${errorCode}\n\nHint: ${errorHint}\n\nDetails: ${error.details || 'N/A'}`;
        
        setTestResult({
          status: 'error',
          message: errorMessage,
          details: detailsText,
          errorCode: errorCode,
          envVarsUsed: {
            url: config.url,
            keyPreview: maskedKey,
          },
        });
        return;
      }

      console.log('Connection test successful');
      setTestResult({
        status: 'success',
        message: 'Connected Successfully',
        details: 'Successfully connected to Supabase and queried the users table.',
        envVarsUsed: {
          url: config.url,
          keyPreview: maskedKey,
        },
      });
    } catch (err) {
      console.error('Connection test exception:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const errorStack = err instanceof Error ? err.stack : undefined;
      
      const detailsText = `Exception: ${errorMessage}${errorStack ? '\n\nStack: ' + errorStack : ''}`;
      
      setTestResult({
        status: 'error',
        message: errorMessage,
        details: detailsText,
        errorCode: 'EXCEPTION',
        envVarsUsed: {
          url: config.url,
          keyPreview: maskedKey,
        },
      });
    }
  }, [config.url, config.anonKey, maskedKey]);

  useEffect(() => {
    if (!isAutoRunComplete) {
      console.log('Auto-running Supabase connection test on mount');
      testConnection();
      setIsAutoRunComplete(true);
    }
  }, []);

  const StatusIcon = ({ status }: { status: TestStatus }) => {
    switch (status) {
      case 'success':
        return <CheckCircle color={Colors.colors.success} size={28} />;
      case 'error':
        return <XCircle color={Colors.colors.danger} size={28} />;
      case 'testing':
        return <ActivityIndicator size="small" color={Colors.colors.primary} />;
      default:
        return <AlertCircle color={Colors.colors.textSecondary} size={28} />;
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/auth/login' as any)}
            testID="back-button"
          >
            <ChevronLeft color={Colors.colors.textPrimary} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Supabase Diagnostics</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Environment</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Active Environment:</Text>
              <Text style={styles.infoValue}>{config.environment}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Configuration</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>EXPO_PUBLIC_SUPABASE_URL:</Text>
              <View style={styles.infoValueContainer}>
                <Text style={styles.infoValue}>{config.url}</Text>
                <TouchableOpacity
                  onPress={() => copyToClipboard(config.url, 'url')}
                  style={styles.copyButton}
                >
                  <Copy color={copiedField === 'url' ? Colors.colors.success : Colors.colors.textSecondary} size={16} />
                  {copiedField === 'url' && <Text style={styles.copiedText}>Copied!</Text>}
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Host:</Text>
              <Text style={styles.infoValue}>{urlHost}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>EXPO_PUBLIC_SUPABASE_ANON_KEY:</Text>
              <View style={styles.infoValueContainer}>
                <Text style={styles.infoValue}>{maskedKey}</Text>
                <TouchableOpacity
                  onPress={() => copyToClipboard(config.anonKey, 'key')}
                  style={styles.copyButton}
                >
                  <Copy color={copiedField === 'key' ? Colors.colors.success : Colors.colors.textSecondary} size={16} />
                  {copiedField === 'key' && <Text style={styles.copiedText}>Copied!</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connection Test</Text>
            <TouchableOpacity
              style={styles.testButton}
              onPress={testConnection}
              disabled={testResult.status === 'testing'}
              testID="test-connection-button"
            >
              <Text style={styles.testButtonText}>
                {testResult.status === 'testing' ? 'Testing...' : 'Run Test Again'}
              </Text>
            </TouchableOpacity>

            {testResult.status !== 'idle' && (
              <View style={[
                styles.resultCard,
                testResult.status === 'success' && styles.resultSuccess,
                testResult.status === 'error' && styles.resultError,
              ]}>
                <View style={styles.resultHeader}>
                  <StatusIcon status={testResult.status} />
                  <View style={styles.resultHeaderText}>
                    <Text style={[
                      styles.resultTitle,
                      testResult.status === 'success' && styles.resultTitleSuccess,
                      testResult.status === 'error' && styles.resultTitleError,
                    ]}>
                      {testResult.status === 'success' ? '✅ Connected' : '❌ Failed'}
                    </Text>
                    <Text style={styles.resultMessage}>{testResult.message}</Text>
                  </View>
                </View>

                {testResult.errorCode && (
                  <View style={styles.infoBox}>
                    <Text style={styles.infoBoxLabel}>Error Code:</Text>
                    <Text style={styles.infoBoxValue}>{testResult.errorCode}</Text>
                  </View>
                )}

                {testResult.envVarsUsed && (
                  <View style={styles.infoBox}>
                    <Text style={styles.infoBoxLabel}>Environment Variables Used:</Text>
                    <Text style={styles.infoBoxValue}>• EXPO_PUBLIC_SUPABASE_URL</Text>
                    <Text style={styles.infoBoxValue}>• EXPO_PUBLIC_SUPABASE_ANON_KEY</Text>
                    <Text style={[styles.infoBoxValue, { marginTop: 8 }]}>URL: {testResult.envVarsUsed.url}</Text>
                    <Text style={styles.infoBoxValue}>Key: {testResult.envVarsUsed.keyPreview}</Text>
                  </View>
                )}

                {testResult.details && (
                  <View style={styles.detailsBox}>
                    <Text style={styles.detailsLabel}>Details:</Text>
                    <ScrollView style={styles.detailsScroll} nestedScrollEnabled>
                      <Text style={styles.detailsText}>{testResult.details}</Text>
                    </ScrollView>
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Troubleshooting</Text>
            <View style={styles.troubleshootingBox}>
              <Text style={styles.troubleshootingText}>If you see &quot;Invalid API key&quot; errors:</Text>
              <Text style={styles.troubleshootingStep}>1. Check that EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set correctly in your .env file</Text>
              <Text style={styles.troubleshootingStep}>2. Ensure the anon key is valid and not expired</Text>
              <Text style={styles.troubleshootingStep}>3. Verify RLS policies allow anon access to the users table</Text>
              <Text style={styles.troubleshootingStep}>4. Restart the development server after changing .env</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: Colors.colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
    marginBottom: 12,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.colors.textSecondary,
    marginBottom: 4,
  },
  infoValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.colors.textPrimary,
    fontFamily: 'monospace' as const,
    flex: 1,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  copiedText: {
    fontSize: 11,
    color: Colors.colors.success,
    fontWeight: '500' as const,
  },
  testButton: {
    backgroundColor: Colors.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  testButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  resultCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    gap: 16,
  },
  resultSuccess: {
    backgroundColor: Colors.colors.success + '15',
    borderColor: Colors.colors.success,
  },
  resultError: {
    backgroundColor: Colors.colors.danger + '15',
    borderColor: Colors.colors.danger,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  resultHeaderText: {
    flex: 1,
    gap: 4,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  resultTitleSuccess: {
    color: Colors.colors.success,
  },
  resultTitleError: {
    color: Colors.colors.danger,
  },
  resultMessage: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.colors.textPrimary,
  },
  infoBox: {
    backgroundColor: Colors.colors.surfaceLight,
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  infoBoxLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.colors.textSecondary,
    marginBottom: 4,
  },
  infoBoxValue: {
    fontSize: 13,
    color: Colors.colors.textPrimary,
    fontFamily: 'monospace' as const,
  },
  detailsBox: {
    backgroundColor: Colors.colors.surfaceLight,
    padding: 12,
    borderRadius: 8,
    maxHeight: 200,
  },
  detailsLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.colors.textSecondary,
    marginBottom: 8,
  },
  detailsScroll: {
    maxHeight: 160,
  },
  detailsText: {
    fontSize: 12,
    color: Colors.colors.textPrimary,
    fontFamily: 'monospace' as const,
    lineHeight: 18,
  },
  troubleshootingBox: {
    gap: 8,
  },
  troubleshootingText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.colors.textPrimary,
    marginBottom: 4,
  },
  troubleshootingStep: {
    fontSize: 13,
    color: Colors.colors.textSecondary,
    lineHeight: 18,
  },
});
