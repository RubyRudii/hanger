import { useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Palette } from '@/lib/theme';

export default function Splash() {
  const { session, loading } = useAuth();
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);

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

  const continueOp = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!session) return;
    // Gentle pulse on the "tap to continue" hint after the splash animates in.
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(continueOp, { toValue: 1, duration: 900, delay: 2200, useNativeDriver: true }),
        Animated.timing(continueOp, { toValue: 0.35, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [session]);

  function goHome() {
    if (session) router.replace('/(tabs)/feed');
  }

  const RootWrapper: any = session ? Pressable : View;
  const rootWrapperProps: any = session ? { onPress: goHome } : {};

  return (
    <RootWrapper style={styles.root} {...rootWrapperProps}>
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

      <SafeAreaView style={styles.page}>
        <Animated.View style={[styles.logoBlock, { opacity: logoOp, transform: [{ translateY: logoY }] }]}>
          <Text style={styles.logoText}>HANGER</Text>
          <Text style={styles.logoSub}>MECHA BUILDER COMMUNITY</Text>
        </Animated.View>

        <Animated.View style={[styles.taglineBlock, { opacity: taglineOp, transform: [{ translateY: taglineY }] }]}>
          <Text style={styles.tagline}>
            Build it. Judge it.{'\n'}
            <Text style={styles.taglineAccent}>Show the world.</Text>
          </Text>
          <Animated.View style={[styles.divider, { opacity: dividerOp }]} />
          <Text style={styles.taglineSub}>
            The first community built for serious mech builders.{'\n'}
            AI scoring. Real feedback. Global rankings.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.ctaBlock, { opacity: ctaOp, transform: [{ translateY: ctaY }] }]}>
          {session ? (
            <Pressable
              style={({ pressed }) => [styles.continueBlock, pressed && { opacity: 0.7 }]}
              onPress={goHome}
              hitSlop={20}
            >
              <Animated.Text style={[styles.continueHint, { opacity: continueOp }]}>
                ⌁  TAP TO CONTINUE  ⌁
              </Animated.Text>
            </Pressable>
          ) : (
            <>
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
            </>
          )}
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
    </RootWrapper>
  );
}

const ORB_TOP = '14%';

function makeStyles(C: Palette) {
  return StyleSheet.create({
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
      backgroundColor: C.royalSoft,
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
    ring1: { width: 240, height: 240, marginTop: 90, borderColor: C.accentRing },
    ring2: { width: 340, height: 340, marginTop: 40, borderColor: C.accentSoft },

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
      fontSize: 12, letterSpacing: 5, color: C.textDim, marginTop: 6,
      fontFamily: 'DMSans_300Light',
    },

    taglineBlock: { alignItems: 'center', marginBottom: 44 },
    tagline: {
      fontSize: 28, lineHeight: 38, color: C.text,
      fontFamily: 'DMSans_300Light', textAlign: 'center',
    },
    taglineAccent: { color: C.accent, fontFamily: 'DMSans_500Medium' },
    divider: { width: 36, height: 2, backgroundColor: C.accent, borderRadius: 1, marginVertical: 18 },
    taglineSub: {
      fontSize: 15, color: C.textMid, lineHeight: 22,
      fontFamily: 'DMSans_300Light', textAlign: 'center',
    },

    ctaBlock: { width: '100%', maxWidth: 320, alignItems: 'center' },
    btnPrimary: {
      width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      backgroundColor: C.royalBright,
      borderWidth: 1, borderColor: 'rgba(201,168,76,0.4)',
      borderRadius: 30, paddingVertical: 15, paddingHorizontal: 48,
    },
    btnPrimaryText: { fontSize: 15, letterSpacing: 2.5, color: C.goldLight, fontFamily: 'DMSans_500Medium' },
    btnArrow: { fontSize: 16, color: C.accent, fontFamily: 'DMSans_500Medium' },
    signInRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
    signInText: { fontSize: 15, color: C.textDim, fontFamily: 'DMSans_300Light' },
    signInLink: { fontSize: 15, color: C.textMid, fontFamily: 'DMSans_500Medium', textDecorationLine: 'underline' },
    continueBlock: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 18 },
    continueHint: { fontFamily: 'DMSans_500Medium', fontSize: 13, letterSpacing: 4, color: C.accent, textAlign: 'center' },

    badgeRow: { flexDirection: 'row', marginTop: 48 },
    gradeBadge: {
      borderWidth: 1, borderColor: C.borderMid, borderRadius: 6,
      paddingVertical: 5, paddingHorizontal: 13,
      backgroundColor: C.accentSoft, marginHorizontal: 4,
    },
    gradeBadgeText: {
      fontFamily: 'BebasNeue_400Regular', fontSize: 15, letterSpacing: 2, color: C.textDim,
    },

    version: { position: 'absolute', bottom: 28, alignSelf: 'center' },
    versionText: { fontSize: 12, letterSpacing: 3, color: C.textDim, fontFamily: 'DMSans_300Light' },
  });
}
