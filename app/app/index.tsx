import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '@/lib/theme';
import { useAuth } from '@/context/AuthContext';

export default function Splash() {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (session) {
      const t = setTimeout(() => router.replace('/(tabs)/feed'), 600);
      return () => clearTimeout(t);
    }
  }, [session, loading]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.grid} pointerEvents="none" />
      <View style={styles.accent} pointerEvents="none" />
      <View style={styles.center}>
        <Text style={styles.logo}>HANGER</Text>
        <Text style={styles.sub}>GUNPLA BUILDER COMMUNITY</Text>
        <Text style={styles.tagline}>Build it. Judge it.{'\n'}Show the world.</Text>
        <Pressable style={styles.btn} onPress={() => router.push('/(auth)/onboarding')}>
          <Text style={styles.btnText}>GET STARTED</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/(auth)/sign-in')}>
          <Text style={styles.login}>
            Already building? <Text style={styles.loginAccent}>Sign in</Text>
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  grid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    borderColor: colors.accentGrid,
  },
  accent: {
    position: 'absolute',
    top: '20%',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(232,52,26,0.08)',
  },
  center: { alignItems: 'center', paddingHorizontal: 28, zIndex: 2 },
  logo: { fontFamily: fonts.display, fontSize: 72, letterSpacing: 6, color: colors.accent, lineHeight: 72 },
  sub: { fontSize: 11, letterSpacing: 4, color: 'rgba(255,255,255,0.35)', marginTop: 4, fontFamily: fonts.bodyLight },
  tagline: { fontSize: 14, color: colors.textMuted, marginTop: 28, textAlign: 'center', lineHeight: 21, fontFamily: fonts.bodyLight },
  btn: { marginTop: 32, backgroundColor: colors.accent, paddingVertical: 14, paddingHorizontal: 44, borderRadius: 30 },
  btnText: { color: '#fff', fontSize: 13, fontFamily: fonts.bodyMedium, letterSpacing: 1.5 },
  login: { marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: fonts.body },
  loginAccent: { color: 'rgba(255,255,255,0.7)' },
});
