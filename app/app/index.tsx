import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';
import { useAuth } from '@/context/AuthContext';

const C = {
  bg: '#050918',
  accent: '#C9A84C',
  accentText: '#F0D98A',
  royalBright: '#2952CC',
  white: '#FFFFFF',
  textMid: 'rgba(255,255,255,0.58)',
  textDim: 'rgba(255,255,255,0.30)',
  borderMid: 'rgba(255,255,255,0.11)',
  ring1: 'rgba(201,168,76,0.28)',
  ring2: 'rgba(201,168,76,0.09)',
  gridLine: 'rgba(41,82,204,0.07)',
  orbCore: 'rgba(26,58,143,0.55)',
  orbHalo: 'rgba(201,168,76,0.10)',
};

export default function Splash() {
  const { session, loading } = useAuth();

  const orbOp = useRef(new Animated.Value(0)).current;
  const ringOp = useRef(new Animated.Value(0)).current;
  const logoOp = useRef(new Animated.Value(0)).current;
  const logoY = useRef(new Animated.Value(28)).current;
  const taglineOp = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(20)).current;
  const dividerOp = useRef(new Animated.Value(0)).current;
  const ctaOp = useRef(new Animated.Value(0)).current;
  const ctaY = useRef(new Animated.Value(16)).current;
  const badgeOp = useRef(new Animated.Value(0)).current;
  const cornerOp = useRef(new Animated.Value(0)).current;
  const versionOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fade = (val: Animated.Value, duration: number, delay: number) =>
      Animated.timing(val, { toValue: 1, duration, delay, useNativeDriver: true });
    const slide = (val: Animated.Value, duration: number, delay: number) =>
      Animated.timing(val, { toValue: 0, duration, delay, useNativeDriver: true });

    fade(orbOp, 1000, 100).start();
    fade(ringOp, 1200, 300).start();
    Animated.parallel([fade(logoOp, 700, 550), slide(logoY, 700, 550)]).start();
    Animated.parallel([fade(taglineOp, 700, 800), slide(taglineY, 700, 800)]).start();
    fade(dividerOp, 500, 1100).start();
    Animated.parallel([fade(ctaOp, 600, 1050), slide(ctaY, 600, 1050)]).start();
    fade(badgeOp, 600, 1300).start();
    fade(cornerOp, 1000, 1400).start();
    fade(versionOp, 600, 1500).start();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (session) {
      const t = setTimeout(() => router.replace('/(tabs)/feed'), 600);
      return () => clearTimeout(t);
    }
  }, [session, loading]);

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern id="g" patternUnits="userSpaceOnUse" width={30} height={30}>
              <Line x1="0" y1="0" x2="30" y2="0" stroke={C.gridLine} strokeWidth={1} />
              <Line x1="0" y1="0" x2="0" y2="30" stroke={C.gridLine} strokeWidth={1} />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#g)" />
        </Svg>
      </View>

      <Animated.View style={[styles.orbHalo, { opacity: orbOp }]} pointerEvents="none" />
      <Animated.View style={[styles.orbMid, { opacity: orbOp }]} pointerEvents="none" />
      <Animated.View style={[styles.orbCore, { opacity: orbOp }]} pointerEvents="none" />

      <Animated.View style={[styles.ring, styles.ring2, { opacity: ringOp }]} pointerEvents="none" />
      <Animated.View style={[styles.ring, styles.ring1, { opacity: ringOp }]} pointerEvents="none" />

      <Animated.View style={[styles.corner, styles.cornerTL, { opacity: cornerOp }]} pointerEvents="none" />
      <Animated.View style={[styles.corner, styles.cornerTR, { opacity: cornerOp }]} pointerEvents="none" />
      <Animated.View style={[styles.corner, styles.cornerBL, { opacity: cornerOp }]} pointerEvents="none" />
      <Animated.View style={[styles.corner, styles.cornerBR, { opacity: cornerOp }]} pointerEvents="none" />

      <SafeAreaView style={styles.page}>
        <Animated.View style={[styles.logoBlock, { opacity: logoOp, transform: [{ translateY: logoY }] }]}>
          <Text style={styles.logoText}>HANGER</Text>
          <Text style={styles.logoSub}>GUNPLA BUILDER COMMUNITY</Text>
        </Animated.View>

        <Animated.View style={[styles.taglineBlock, { opacity: taglineOp, transform: [{ translateY: taglineY }] }]}>
          <Text style={styles.tagline}>
            Build it. Judge it.{'\n'}
            <Text style={styles.taglineAccent}>Show the world.</Text>
          </Text>
          <Animated.View style={[styles.divider, { opacity: dividerOp }]} />
          <Text style={styles.taglineSub}>
            The first community built for serious Gunpla builders.{'\n'}
            AI scoring. Real feedback. Global rankings.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.ctaBlock, { opacity: ctaOp, transform: [{ translateY: ctaY }] }]}>
          <Pressable
            style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.85 }]}
            onPress={() => router.push('/(auth)/onboarding')}
          >
            <Text style={styles.btnPrimaryText}>GET STARTED</Text>
            <Text style={styles.btnArrow}>  →</Text>
          </Pressable>
          <Pressable style={styles.signInRow} onPress={() => router.push('/(auth)/sign-in')}>
            <Text style={styles.signInText}>Already building? </Text>
            <Text style={styles.signInLink}>Sign in</Text>
          </Pressable>
        </Animated.View>

        <Animated.View style={[styles.badgeRow, { opacity: badgeOp }]}>
          {['HG', 'MG', 'RG', 'PG'].map((g) => (
            <View key={g} style={styles.gradeBadge}>
              <Text style={styles.gradeBadgeText}>{g}</Text>
            </View>
          ))}
        </Animated.View>
      </SafeAreaView>

      <Animated.View style={[styles.version, { opacity: versionOp }]} pointerEvents="none">
        <Text style={styles.versionText}>V 1.0 · ALPHA</Text>
      </Animated.View>
    </View>
  );
}

const ORB_TOP = '14%';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, overflow: 'hidden' },
  page: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 40 },

  orbHalo: {
    position: 'absolute', top: ORB_TOP, alignSelf: 'center',
    width: 420, height: 420, borderRadius: 210,
    backgroundColor: C.orbHalo,
    opacity: 0.6,
  },
  orbMid: {
    position: 'absolute', top: ORB_TOP, alignSelf: 'center',
    width: 320, height: 320, borderRadius: 160, marginTop: 50,
    backgroundColor: 'rgba(26,58,143,0.28)',
  },
  orbCore: {
    position: 'absolute', top: ORB_TOP, alignSelf: 'center',
    width: 200, height: 200, borderRadius: 100, marginTop: 110,
    backgroundColor: C.orbCore,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 60,
    elevation: 30,
  },

  ring: { position: 'absolute', top: ORB_TOP, alignSelf: 'center', borderRadius: 999, borderWidth: 1 },
  ring1: { width: 240, height: 240, marginTop: 90, borderColor: C.ring1 },
  ring2: { width: 340, height: 340, marginTop: 40, borderColor: C.ring2 },

  corner: { position: 'absolute', width: 40, height: 40, borderColor: C.borderMid },
  cornerTL: { top: 30, left: 24, borderTopWidth: 1, borderLeftWidth: 1 },
  cornerTR: { top: 30, right: 24, borderTopWidth: 1, borderRightWidth: 1 },
  cornerBL: { bottom: 30, left: 24, borderBottomWidth: 1, borderLeftWidth: 1 },
  cornerBR: { bottom: 30, right: 24, borderBottomWidth: 1, borderRightWidth: 1 },

  logoBlock: { alignItems: 'center', marginBottom: 44 },
  logoText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 80, letterSpacing: 10, color: C.accent, lineHeight: 84,
  },
  logoSub: {
    fontSize: 10, letterSpacing: 5, color: C.textDim, marginTop: 6,
    fontFamily: 'DMSans_300Light',
  },

  taglineBlock: { alignItems: 'center', marginBottom: 44 },
  tagline: {
    fontSize: 28, lineHeight: 38, color: C.white,
    fontFamily: 'DMSans_300Light', textAlign: 'center',
  },
  taglineAccent: { color: C.accent, fontFamily: 'DMSans_500Medium' },
  divider: { width: 36, height: 2, backgroundColor: C.accent, borderRadius: 1, marginVertical: 18 },
  taglineSub: {
    fontSize: 13, color: C.textMid, lineHeight: 22,
    fontFamily: 'DMSans_300Light', textAlign: 'center',
  },

  ctaBlock: { width: '100%', maxWidth: 320, alignItems: 'center' },
  btnPrimary: {
    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.royalBright,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.4)',
    borderRadius: 30, paddingVertical: 15, paddingHorizontal: 48,
  },
  btnPrimaryText: { fontSize: 13, letterSpacing: 2.5, color: C.accentText, fontFamily: 'DMSans_500Medium' },
  btnArrow: { fontSize: 16, color: C.accent, fontFamily: 'DMSans_500Medium' },
  signInRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  signInText: { fontSize: 13, color: C.textDim, fontFamily: 'DMSans_300Light' },
  signInLink: { fontSize: 13, color: C.textMid, fontFamily: 'DMSans_500Medium', textDecorationLine: 'underline' },

  badgeRow: { flexDirection: 'row', marginTop: 48 },
  gradeBadge: {
    borderWidth: 1, borderColor: C.borderMid, borderRadius: 6,
    paddingVertical: 5, paddingHorizontal: 13,
    backgroundColor: 'rgba(255,255,255,0.02)', marginHorizontal: 4,
  },
  gradeBadgeText: {
    fontFamily: 'BebasNeue_400Regular', fontSize: 13, letterSpacing: 2, color: C.textDim,
  },

  version: { position: 'absolute', bottom: 28, alignSelf: 'center' },
  versionText: { fontSize: 10, letterSpacing: 3, color: C.textDim, fontFamily: 'DMSans_300Light' },
});
