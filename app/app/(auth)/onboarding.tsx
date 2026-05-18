import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '@/lib/theme';

const SLIDES = [
  {
    icon: '🤖',
    title: 'AI scores\nyour builds',
    body:
      'Upload photos of your finished kit and our AI judge grades it across panel lining, weathering, paint finish, and composition — just like a real competition.',
  },
  {
    icon: '🏆',
    title: 'Climb the\nweekly board',
    body: 'Top builds rise. Every Sunday we crown a champion. Your hangar shows everything you’ve built and every score you’ve earned.',
  },
  {
    icon: '🛠',
    title: 'Build with\nthe community',
    body: 'Discover what other builders are running, get feedback on weathering technique, and find your next kit.',
  },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);

  function next() {
    if (step < SLIDES.length - 1) setStep(step + 1);
    else router.replace('/(auth)/sign-up');
  }

  const slide = SLIDES[step];
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.steps}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i <= step && styles.dotDone]} />
        ))}
      </View>
      <View style={styles.visual}>
        <View style={styles.glow}>
          <Text style={styles.icon}>{slide.icon}</Text>
        </View>
      </View>
      <Text style={styles.title}>{slide.title}</Text>
      <Text style={styles.body}>{slide.body}</Text>
      <View style={{ flex: 1 }} />
      <Pressable style={styles.btn} onPress={next}>
        <Text style={styles.btnText}>{step === SLIDES.length - 1 ? 'CREATE ACCOUNT →' : 'NEXT →'}</Text>
      </Pressable>
      <Pressable onPress={() => router.replace('/(auth)/sign-up')}>
        <Text style={styles.skip}>Skip intro</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg, padding: 24 },
  steps: { flexDirection: 'row', gap: 4, marginTop: 12, marginBottom: 28 },
  dot: { flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.borderStrong },
  dotDone: { backgroundColor: colors.accent },
  visual: {
    height: 200,
    borderRadius: 16,
    backgroundColor: colors.surface,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 48 },
  title: { fontFamily: fonts.display, fontSize: 36, letterSpacing: 2, color: colors.text, lineHeight: 40, marginBottom: 10 },
  body: { fontSize: 14, color: colors.textMuted, lineHeight: 22, fontFamily: fonts.bodyLight },
  btn: { backgroundColor: colors.accent, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 24 },
  btnText: { color: '#fff', fontSize: 14, fontFamily: fonts.bodyMedium, letterSpacing: 1 },
  skip: { textAlign: 'center', fontSize: 12, color: colors.textFaint, marginTop: 12, fontFamily: fonts.body },
});
