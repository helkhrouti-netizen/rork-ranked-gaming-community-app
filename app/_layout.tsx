import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { UserProfileProvider, useUserProfile } from "@/contexts/UserProfileContext";
import Colors from "@/constants/colors";
import { trpc } from "@/lib/trpc";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isLoading, isAuthenticated, isOnboarded } = useUserProfile();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuth = segments[0] === 'auth';
    const inOnboarding = segments[0] === 'onboarding';

    if (!isAuthenticated && !inAuth) {
      router.replace('/auth/login');
    } else if (isAuthenticated && !isOnboarded && !inOnboarding) {
      router.replace('/onboarding');
    } else if (isAuthenticated && isOnboarded && (inAuth || inOnboarding)) {
      router.replace('/(tabs)');
    }
  }, [isLoading, isAuthenticated, isOnboarded, segments, router]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
      <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
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
        <UserProfileProvider>
          <GestureHandlerRootView style={styles.container}>
            <RootLayoutNav />
          </GestureHandlerRootView>
        </UserProfileProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.colors.background,
  },
});
