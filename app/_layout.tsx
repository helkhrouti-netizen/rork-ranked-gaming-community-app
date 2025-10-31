import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, View, ActivityIndicator, LogBox, Text, TouchableOpacity } from "react-native";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import Colors from "@/constants/colors";
import { trpc } from "@/lib/trpc";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { boot, getBootErrorMessage, BootError } from "@/lib/boot";
import { logBootTimeout, logDBHealthError, logRLSError, logI18nError, logConfigError } from "@/lib/client-logger";
import { AlertTriangle } from "lucide-react-native";

LogBox.ignoreLogs([
  'Deep imports from the \'react-native/Libraries/Utilities/PolyfillFunctions',
  'Deep imports from the \'react-native\' package are deprecated',
]);

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function BootErrorScreen({ error, onRetry }: { error: BootError; onRetry: () => void }) {
  const { language } = useLanguage();
  const errorMessage = getBootErrorMessage(error, language);

  return (
    <View style={styles.errorContainer}>
      <View style={styles.errorContent}>
        <AlertTriangle size={64} color={Colors.colors.error} style={styles.errorIcon} />
        <Text style={styles.errorTitle}>
          {language === 'fr' ? 'Erreur de démarrage' : 'Startup Error'}
        </Text>
        <Text style={styles.errorMessage}>{errorMessage}</Text>
        <Text style={styles.errorCode}>Code: {error.code}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>
            {language === 'fr' ? 'Réessayer' : 'Retry'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function RootLayoutNav() {
  const { isLoading, isAuthenticated, isOnboarded } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [bootError, setBootError] = useState<BootError | null>(null);


  const performBoot = async () => {
    setIsBooting(true);
    setBootError(null);
    
    try {
      const result = await boot();
      
      if (!result.success && result.error) {
        setBootError(result.error);
        
        switch (result.error.code) {
          case 'BOOT_TIMEOUT':
            logBootTimeout(result.step || 'unknown', result.error.originalError);
            break;
          case 'DB_HEALTH':
            logDBHealthError(result.error.originalError);
            break;
          case 'RLS_AUTH':
            logRLSError('boot', 'initialization', result.error.originalError);
            break;
          case 'I18N_INIT':
            logI18nError(result.error.originalError);
            break;
          case 'CONFIG_ERROR':
            logConfigError(result.error.originalError);
            break;
        }
      }
    } catch (error: any) {
      console.error('❌ Unexpected boot error:', error);
      setBootError({
        code: 'UNKNOWN',
        message: error?.message || 'Unexpected error during boot',
        originalError: error,
      });
    } finally {
      setIsBooting(false);
    }
  };

  useEffect(() => {
    performBoot();
    setIsNavigationReady(true);
  }, []);

  useEffect(() => {
    if (isLoading || !isNavigationReady || isBooting) return;
    if (bootError) return;

    const inAuth = segments[0] === 'auth';
    const inOnboarding = segments[0] === 'onboarding';

    if (!isAuthenticated && !inAuth) {
      router.replace('/auth/login');
    } else if (isAuthenticated && !isOnboarded && !inOnboarding) {
      router.replace('/onboarding');
    } else if (isAuthenticated && isOnboarded && (inAuth || inOnboarding)) {
      router.replace('/(tabs)');
    }
  }, [isLoading, isAuthenticated, isOnboarded, segments, router, isNavigationReady, isBooting, bootError]);

  if (bootError) {
    return <BootErrorScreen error={bootError} onRetry={performBoot} />;
  }

  return (
    <>
      {(isLoading || isBooting) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.colors.primary} />
        </View>
      )}
      <Stack screenOptions={{ headerBackTitle: "Back" }}>
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="match/create"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="match/[id]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="tournament/[id]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="match/result/[id]"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [trpcReactClient] = useState(() => 
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${process.env.EXPO_PUBLIC_RORK_API_BASE_URL || ''}/api/trpc`,
          transformer: superjson,
        }),
      ],
    })
  );

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcReactClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AuthProvider>
            <GestureHandlerRootView style={styles.container}>
              <ErrorBoundary>
                <RootLayoutNav />
              </ErrorBoundary>
            </GestureHandlerRootView>
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.colors.background,
    zIndex: 1000,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.colors.background,
    padding: 24,
    zIndex: 1000,
  },
  errorContent: {
    alignItems: 'center',
    maxWidth: 400,
  },
  errorIcon: {
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center' as const,
  },
  errorMessage: {
    fontSize: 16,
    color: Colors.colors.textSecondary,
    marginBottom: 12,
    textAlign: 'center' as const,
    lineHeight: 24,
  },
  errorCode: {
    fontSize: 14,
    color: Colors.colors.textSecondary,
    marginBottom: 32,
    fontFamily: 'Courier' as const,
    opacity: 0.7,
  },
  retryButton: {
    backgroundColor: Colors.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 140,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    textAlign: 'center' as const,
  },
});
