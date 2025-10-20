import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CheckCircle, XCircle, ArrowLeft, RefreshCw } from 'lucide-react-native';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

import Colors from '@/constants/colors';
import { db, auth, getFirebaseConfig } from '@/lib/firebase';

export default function FirebaseDiagnosticsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isTestRunning, setIsTestRunning] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);

  const firebaseConfig = useMemo(() => {
    const config = getFirebaseConfig();
    const apiKey = config.apiKey;
    const maskedApiKey = apiKey
      ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
      : 'Not set';

    return {
      projectId: config.projectId || 'Not set',
      authDomain: config.authDomain || 'Not set',
      apiKey: maskedApiKey,
      environment: config.environment,
    };
  }, []);

  useEffect(() => {
    runTest();
  }, []);

  const runTest = async () => {
    setIsTestRunning(true);
    setTestResult(null);

    try {
      const testDocRef = doc(db, 'diagnostics', 'test');
      
      await setDoc(testDocRef, {
        timestamp: new Date().toISOString(),
        test: 'Firebase connection test',
      });

      const testDoc = await getDoc(testDocRef);
      
      if (!testDoc.exists()) {
        throw new Error('Failed to read test document');
      }

      await deleteDoc(testDocRef);

      const currentUser = auth.currentUser;
      const authStatus = currentUser ? `Logged in as ${currentUser.email}` : 'Not logged in';

      setTestResult({
        success: true,
        message: 'Firebase connection successful',
        details: `Auth: ${authStatus}\nFirestore read/write: OK\nProject: ${firebaseConfig.projectId}`,
      });
    } catch (error: any) {
      console.error('Firebase test failed:', error);
      setTestResult({
        success: false,
        message: 'Firebase connection failed',
        details: error.message || 'Unknown error',
      });
    } finally {
      setIsTestRunning(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.colors.background, Colors.colors.surface]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={Colors.colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Firebase Diagnostics</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Environment Variables</Text>
          
          <View style={styles.configCard}>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>EXPO_PUBLIC_FIREBASE_PROJECT_ID</Text>
              <Text style={styles.configValue}>{firebaseConfig.projectId}</Text>
            </View>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN</Text>
              <Text style={styles.configValue}>{firebaseConfig.authDomain}</Text>
            </View>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>EXPO_PUBLIC_FIREBASE_API_KEY</Text>
              <Text style={styles.configValue}>{firebaseConfig.apiKey}</Text>
            </View>
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Environment</Text>
              <Text style={styles.configValue}>{firebaseConfig.environment}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Connection Test</Text>
            <TouchableOpacity
              style={styles.retestButton}
              onPress={runTest}
              disabled={isTestRunning}
            >
              <RefreshCw 
                color={Colors.colors.primary} 
                size={20} 
                style={isTestRunning ? styles.spinning : undefined}
              />
              <Text style={styles.retestButtonText}>Run Test</Text>
            </TouchableOpacity>
          </View>

          {isTestRunning ? (
            <View style={styles.testCard}>
              <ActivityIndicator color={Colors.colors.primary} size="large" />
              <Text style={styles.testRunningText}>Testing Firebase connection...</Text>
            </View>
          ) : testResult ? (
            <View
              style={[
                styles.testCard,
                testResult.success ? styles.testCardSuccess : styles.testCardError,
              ]}
            >
              <View style={styles.testCardHeader}>
                {testResult.success ? (
                  <CheckCircle color={Colors.colors.success} size={48} />
                ) : (
                  <XCircle color={Colors.colors.danger} size={48} />
                )}
                <Text
                  style={[
                    styles.testResultTitle,
                    { color: testResult.success ? Colors.colors.success : Colors.colors.danger },
                  ]}
                >
                  {testResult.message}
                </Text>
              </View>
              
              {testResult.details && (
                <View style={styles.testDetails}>
                  <Text style={styles.testDetailsLabel}>Details:</Text>
                  <Text style={styles.testDetailsText}>{testResult.details}</Text>
                </View>
              )}
            </View>
          ) : null}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>About Firebase Diagnostics</Text>
          <Text style={styles.infoText}>
            This page tests your Firebase connection by performing a write and read operation to Firestore.
            It also displays the environment variables currently being used.
          </Text>
          <Text style={styles.infoText}>
            Make sure all EXPO_PUBLIC_FIREBASE_* variables are set in your environment.
          </Text>
        </View>
      </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: Colors.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.colors.border,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
    marginBottom: 16,
  },
  configCard: {
    backgroundColor: Colors.colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.colors.border,
    gap: 16,
  },
  configRow: {
    gap: 8,
  },
  configLabel: {
    fontSize: 12,
    color: Colors.colors.textSecondary,
    fontWeight: '600' as const,
    fontFamily: 'monospace' as const,
  },
  configValue: {
    fontSize: 14,
    color: Colors.colors.textPrimary,
    fontWeight: '600' as const,
    fontFamily: 'monospace' as const,
  },
  retestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.colors.primary + '20',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.colors.primary,
  },
  retestButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.colors.primary,
  },
  testCard: {
    backgroundColor: Colors.colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: Colors.colors.border,
    alignItems: 'center',
    gap: 16,
  },
  testCardSuccess: {
    borderColor: Colors.colors.success,
    backgroundColor: Colors.colors.success + '10',
  },
  testCardError: {
    borderColor: Colors.colors.danger,
    backgroundColor: Colors.colors.danger + '10',
  },
  testCardHeader: {
    alignItems: 'center',
    gap: 12,
  },
  testResultTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    textAlign: 'center',
  },
  testRunningText: {
    fontSize: 16,
    color: Colors.colors.textSecondary,
    marginTop: 8,
  },
  testDetails: {
    width: '100%',
    backgroundColor: Colors.colors.background,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  testDetailsLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.colors.textSecondary,
    textTransform: 'uppercase' as const,
  },
  testDetailsText: {
    fontSize: 14,
    color: Colors.colors.textPrimary,
    fontFamily: 'monospace' as const,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: Colors.colors.primary + '15',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.colors.primary + '30',
    gap: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.colors.primary,
  },
  infoText: {
    fontSize: 14,
    color: Colors.colors.textSecondary,
    lineHeight: 20,
  },
  spinning: {
    transform: [{ rotate: '360deg' }],
  },
});
