import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Stack } from 'expo-router';

type TestResult = {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
};

export default function TestSupabaseScreen() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);

    addResult({ name: 'Basic Internet Test', status: 'pending', message: 'Testing basic connectivity...' });

    try {
      const response = await fetch('https://www.google.com', {
        method: 'HEAD',
      });
      
      addResult({
        name: 'Basic Internet Test',
        status: 'success',
        message: `Internet OK (Status: ${response.status})`,
        details: { status: response.status }
      });
    } catch (error: any) {
      addResult({
        name: 'Basic Internet Test',
        status: 'error',
        message: `No internet: ${error.message}`,
        details: { error: error.message, type: error.name }
      });
    }

    addResult({ name: 'Supabase Network Test', status: 'pending', message: 'Testing Supabase connectivity...' });

    try {
      const response = await fetch('https://mcgqjqkknmojspocvvxl.supabase.co/rest/v1/', {
        method: 'HEAD',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jZ3FqcWtrbm1vanNwb2N2dnhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNDcyODYsImV4cCI6MjA3NjYyMzI4Nn0.8w6XKdRnusmh_DtrWHwxRlFV0LwNuC1ezxmsA-mHqVs'
        }
      });
      
      addResult({
        name: 'Supabase Network Test',
        status: 'success',
        message: `Supabase reachable (Status: ${response.status})`,
        details: { status: response.status, statusText: response.statusText }
      });
    } catch (error: any) {
      addResult({
        name: 'Supabase Network Test',
        status: 'error',
        message: `Cannot reach Supabase: ${error.message}`,
        details: {
          error: error.message,
          type: error.name,
          description: 'Cannot reach Supabase server. This may be a firewall or network issue.'
        }
      });
    }

    addResult({ name: 'Connection Test', status: 'pending', message: 'Starting...' });

    try {
      const start = Date.now();
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      const duration = Date.now() - start;

      if (error) {
        addResult({
          name: 'Database Query',
          status: 'error',
          message: `Failed: ${error.message}`,
          details: error
        });
      } else {
        addResult({
          name: 'Database Query',
          status: 'success',
          message: `Success (${duration}ms)`,
          details: data
        });
      }
    } catch (error: any) {
      addResult({
        name: 'Database Query',
        status: 'error',
        message: error?.message || 'Unknown error',
        details: error
      });
    }

    addResult({ name: 'Auth Session Check', status: 'pending', message: 'Checking session...' });

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        addResult({
          name: 'Auth Session',
          status: 'error',
          message: `Failed: ${error.message}`,
          details: error
        });
      } else if (session) {
        addResult({
          name: 'Auth Session',
          status: 'success',
          message: `Logged in as ${session.user.email}`,
          details: { userId: session.user.id, email: session.user.email }
        });
      } else {
        addResult({
          name: 'Auth Session',
          status: 'success',
          message: 'No active session (not logged in)',
          details: null
        });
      }
    } catch (error: any) {
      addResult({
        name: 'Auth Session',
        status: 'error',
        message: error?.message || 'Unknown error',
        details: error
      });
    }

    addResult({ name: 'Direct Auth API Test', status: 'pending', message: 'Testing auth endpoint directly...' });

    try {
      const testResponse = await fetch('https://mcgqjqkknmojspocvvxl.supabase.co/auth/v1/health', {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jZ3FqcWtrbm1vanNwb2N2dnhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNDcyODYsImV4cCI6MjA3NjYyMzI4Nn0.8w6XKdRnusmh_DtrWHwxRlFV0LwNuC1ezxmsA-mHqVs'
        }
      });
      
      const healthData = await testResponse.json();
      
      addResult({
        name: 'Direct Auth API Test',
        status: 'success',
        message: `Auth API is healthy`,
        details: healthData
      });
    } catch (error: any) {
      addResult({
        name: 'Direct Auth API Test',
        status: 'error',
        message: `Auth API test failed: ${error.message}`,
        details: error
      });
    }

    addResult({ name: 'Test Signup', status: 'pending', message: 'Testing signup...' });

    try {
      const testEmail = `test_${Date.now()}@example.com`;
      const testPassword = 'TestPassword123!';
      
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            username: 'TestUser',
          }
        }
      });

      if (error) {
        if (error.message.includes('Invalid API key')) {
          addResult({
            name: 'Test Signup',
            status: 'error',
            message: '❌ INVALID API KEY - Auth is not configured in Supabase dashboard',
            details: {
              error: error.message,
              solution: 'Go to Supabase Dashboard > Authentication > Settings and configure email provider'
            }
          });
        } else if (error.message.includes('Network request failed')) {
          addResult({
            name: 'Test Signup',
            status: 'error',
            message: '❌ NETWORK ERROR - Cannot connect to Supabase',
            details: {
              error: error.message,
              solution: 'This could be a firewall, VPN, or network configuration issue. Try connecting from a different network.'
            }
          });
        } else {
          addResult({
            name: 'Test Signup',
            status: 'error',
            message: `Failed: ${error.message}`,
            details: error
          });
        }
      } else if (data.user) {
        addResult({
          name: 'Test Signup',
          status: 'success',
          message: `Created test user: ${testEmail}`,
          details: { userId: data.user.id, email: data.user.email }
        });

        await supabase.auth.signOut();
      }
    } catch (error: any) {
      addResult({
        name: 'Test Signup',
        status: 'error',
        message: error?.message || 'Unknown error',
        details: error
      });
    }

    addResult({ name: 'API Key Validation', status: 'pending', message: 'Validating API key...' });

    try {
      const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jZ3FqcWtrbm1vanNwb2N2dnhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNDcyODYsImV4cCI6MjA3NjYyMzI4Nn0.8w6XKdRnusmh_DtrWHwxRlFV0LwNuC1ezxmsA-mHqVs';
      const parts = anonKey.split('.');
      
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        const isExpired = payload.exp * 1000 < Date.now();
        
        addResult({
          name: 'API Key Validation',
          status: isExpired ? 'error' : 'success',
          message: isExpired ? 'API key is EXPIRED' : 'API key is valid',
          details: {
            issuer: payload.iss,
            role: payload.role,
            ref: payload.ref,
            expires: new Date(payload.exp * 1000).toISOString(),
            isExpired
          }
        });
      } else {
        addResult({
          name: 'API Key Validation',
          status: 'error',
          message: 'Invalid API key format',
          details: null
        });
      }
    } catch (error: any) {
      addResult({
        name: 'API Key Validation',
        status: 'error',
        message: error?.message || 'Unknown error',
        details: error
      });
    }

    setIsRunning(false);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Supabase Test' }} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Supabase Configuration Test</Text>
        <Text style={styles.subtitle}>Test authentication and database connection</Text>
      </View>

      <TouchableOpacity 
        style={[styles.button, isRunning && styles.buttonDisabled]}
        onPress={runTests}
        disabled={isRunning}
      >
        {isRunning ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Run Tests</Text>
        )}
      </TouchableOpacity>

      <ScrollView style={styles.results}>
        {results.map((result, index) => (
          <View key={index} style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultName}>{result.name}</Text>
              <View style={[
                styles.statusBadge,
                result.status === 'success' && styles.statusSuccess,
                result.status === 'error' && styles.statusError,
                result.status === 'pending' && styles.statusPending,
              ]}>
                <Text style={styles.statusText}>
                  {result.status === 'success' && '✓'}
                  {result.status === 'error' && '✗'}
                  {result.status === 'pending' && '⋯'}
                </Text>
              </View>
            </View>
            <Text style={styles.resultMessage}>{result.message}</Text>
            {result.details && (
              <View style={styles.details}>
                <Text style={styles.detailsText}>
                  {JSON.stringify(result.details, null, 2)}
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {results.length > 0 && (
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            Tests: {results.filter(r => r.status === 'success').length} passed, {results.filter(r => r.status === 'error').length} failed
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    margin: 20,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  results: {
    flex: 1,
    padding: 20,
  },
  resultCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  statusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusSuccess: {
    backgroundColor: '#34C759',
  },
  statusError: {
    backgroundColor: '#FF3B30',
  },
  statusPending: {
    backgroundColor: '#FF9500',
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  resultMessage: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  details: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  detailsText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666',
  },
  summary: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
});
