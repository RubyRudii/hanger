import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { DMSans_300Light, DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { colors } from '@/lib/theme';

function AuthGate() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    const onSplash = segments.length === 0 || segments[0] === 'index';
    if (onSplash) return;
    if (!session && !inAuthGroup) router.replace('/(auth)/onboarding');
    else if (session && inAuthGroup) router.replace('/(tabs)/feed');
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="build/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="add-kit" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BebasNeue_400Regular,
    DMSans_300Light,
    DMSans_400Regular,
    DMSans_500Medium,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });
  const [fontTimeout, setFontTimeout] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFontTimeout(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const ready = fontsLoaded || !!fontError || fontTimeout;
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <AuthGate />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
