/**
 * HANGER — Splash Screen (Screen 1)
 * 
 * Stack:  React Native + Expo
 * Fonts:  expo-font  +  @expo-google-fonts/bebas-neue  +  @expo-google-fonts/dm-sans
 * Nav:    @react-navigation/native  (call onFinish() to push to Onboarding)
 *
 * Install deps (run once in your project root):
 *   npx expo install expo-font expo-linear-gradient
 *   npx expo install @expo-google-fonts/bebas-neue @expo-google-fonts/dm-sans
 *   npx expo install @react-navigation/native @react-navigation/native-stack
 *   npx expo install react-native-screens react-native-safe-area-context
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useFonts,
  BebasNeue_400Regular,
} from '@expo-google-fonts/bebas-neue';
import {
  DM_Sans_300Light,
  DM_Sans_400Regular,
  DM_Sans_500Medium,
} from '@expo-google-fonts/dm-sans';

// ─── Design tokens ────────────────────────────────────────────────────────────
const COLORS = {
  bg:         '#0A0A0B',
  surface:    '#141416',
  accent:     '#E8341A',
  accentDim:  'rgba(232, 52, 26, 0.15)',
  accentGlow: 'rgba(232, 52, 26, 0.06)',
  white:      '#FFFFFF',
  textMid:    'rgba(255,255,255,0.55)',
  textDim:    'rgba(255,255,255,0.30)',
  border:     'rgba(255,255,255,0.07)',
};

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Grid overlay (decorative red lines) ─────────────────────────────────────
function GridOverlay() {
  const CELL = 28;
  const cols = Math.ceil(SW / CELL) + 1;
  const rows = Math.ceil(SH / CELL) + 1;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* vertical lines */}
      {Array.from({ length: cols }).map((_, i) => (
        <View
          key={`v${i}`}
          style={{
            position: 'absolute',
            left: i * CELL,
            top: 0,
            bottom: 0,
            width: StyleSheet.hairlineWidth,
            backgroundColor: COLORS.accentGlow,
          }}
        />
      ))}
      {/* horizontal lines */}
      {Array.from({ length: rows }).map((_, i) => (
        <View
          key={`h${i}`}
          style={{
            position: 'absolute',
            top: i * CELL,
            left: 0,
            right: 0,
            height: StyleSheet.hairlineWidth,
            backgroundColor: COLORS.accentGlow,
          }}
        />
      ))}
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SplashScreen({ navigation }) {
  // If you're not using React Navigation yet, replace with:
  //   export default function SplashScreen({ onFinish, onLogin })

  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    DM_Sans_300Light,
    DM_Sans_400Regular,
    DM_Sans_500Medium,
  });

  // ── Animation values ──────────────────────────────────────────────────────
  const glowScale   = useRef(new Animated.Value(0.8)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const logoY       = useRef(new Animated.Value(24)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineY    = useRef(new Animated.Value(16)).current;
  const taglineOp   = useRef(new Animated.Value(0)).current;
  const btnY        = useRef(new Animated.Value(20)).current;
  const btnOp       = useRef(new Animated.Value(0)).current;
  const loginOp     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!fontsLoaded) return;

    // Staggered entrance sequence
    Animated.sequence([
      // 1. Glow pulse in
      Animated.parallel([
        Animated.spring(glowScale,   { toValue: 1,   useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      // 2. Logo slides up
      Animated.parallel([
        Animated.spring(logoY,       { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      // 3. Tagline fades up
      Animated.parallel([
        Animated.spring(taglineY,  { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
        Animated.timing(taglineOp, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      // 4. CTA buttons appear
      Animated.parallel([
        Animated.spring(btnY,  { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
        Animated.timing(btnOp, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(loginOp, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
    ]).start();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleGetStarted = () => {
    // Navigate to onboarding — swap for your actual screen name
    navigation?.navigate('Onboarding');
  };

  const handleSignIn = () => {
    // Navigate to login/auth screen
    navigation?.navigate('Login');
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Background */}
      <View style={StyleSheet.absoluteFill}>
        <GridOverlay />
      </View>

      {/* Ambient glow orb behind logo */}
      <Animated.View
        style={[
          styles.glowOrb,
          { opacity: glowOpacity, transform: [{ scale: glowScale }] },
        ]}
      />

      <SafeAreaView style={styles.safe}>

        {/* ── Logo block ── */}
        <Animated.View
          style={[
            styles.logoBlock,
            { opacity: logoOpacity, transform: [{ translateY: logoY }] },
          ]}
        >
          <Text style={styles.logoText}>HANGER</Text>
          <Text style={styles.logoSub}>GUNPLA BUILDER COMMUNITY</Text>
        </Animated.View>

        {/* ── Tagline ── */}
        <Animated.View
          style={[
            styles.taglineBlock,
            { opacity: taglineOp, transform: [{ translateY: taglineY }] },
          ]}
        >
          <Text style={styles.tagline}>
            Build it.{'\n'}Judge it.{'\n'}
            <Text style={styles.taglineAccent}>Show the world.</Text>
          </Text>

          {/* Accent divider */}
          <View style={styles.divider} />

          <Text style={styles.taglineSub}>
            The first community built for serious Gunpla builders.{'\n'}
            AI scoring. Real feedback. Global rankings.
          </Text>
        </Animated.View>

        {/* ── CTA buttons ── */}
        <Animated.View
          style={[
            styles.ctaBlock,
            { opacity: btnOp, transform: [{ translateY: btnY }] },
          ]}
        >
          {/* Primary CTA */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleGetStarted}
            activeOpacity={0.82}
          >
            <Text style={styles.primaryBtnText}>GET STARTED</Text>
            <Text style={styles.primaryBtnArrow}>→</Text>
          </TouchableOpacity>

          {/* Secondary / sign-in */}
          <Animated.View style={{ opacity: loginOp }}>
            <TouchableOpacity
              style={styles.signInRow}
              onPress={handleSignIn}
              activeOpacity={0.7}
            >
              <Text style={styles.signInText}>Already building? </Text>
              <Text style={styles.signInLink}>Sign in</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* ── Bottom grade badges (decorative) ── */}
        <Animated.View style={[styles.badgeRow, { opacity: btnOp }]}>
          {['HG', 'MG', 'RG', 'PG'].map((g) => (
            <View key={g} style={styles.gradeBadge}>
              <Text style={styles.gradeText}>{g}</Text>
            </View>
          ))}
        </Animated.View>

      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  safe: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Glow orb
  glowOrb: {
    position: 'absolute',
    top: SH * 0.22,
    alignSelf: 'center',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: COLORS.accentDim,
  },

  // Logo
  logoBlock: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 76,
    letterSpacing: 8,
    color: COLORS.accent,
    lineHeight: 76,
  },
  logoSub: {
    fontFamily: 'DM_Sans_300Light',
    fontSize: 10,
    letterSpacing: 4,
    color: COLORS.textDim,
    marginTop: 4,
  },

  // Tagline
  taglineBlock: {
    alignItems: 'center',
    marginBottom: 48,
  },
  tagline: {
    fontFamily: 'DM_Sans_300Light',
    fontSize: 28,
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 38,
  },
  taglineAccent: {
    color: COLORS.accent,
    fontFamily: 'DM_Sans_500Medium',
  },
  divider: {
    width: 32,
    height: 2,
    backgroundColor: COLORS.accent,
    borderRadius: 1,
    marginVertical: 16,
  },
  taglineSub: {
    fontFamily: 'DM_Sans_300Light',
    fontSize: 13,
    color: COLORS.textMid,
    textAlign: 'center',
    lineHeight: 20,
  },

  // CTA
  ctaBlock: {
    width: '100%',
    alignItems: 'center',
    gap: 14,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 48,
    width: '100%',
    gap: 10,
  },
  primaryBtnText: {
    fontFamily: 'DM_Sans_500Medium',
    fontSize: 14,
    letterSpacing: 2,
    color: COLORS.white,
  },
  primaryBtnArrow: {
    fontSize: 16,
    color: COLORS.white,
  },
  signInRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signInText: {
    fontFamily: 'DM_Sans_400Regular',
    fontSize: 13,
    color: COLORS.textDim,
  },
  signInLink: {
    fontFamily: 'DM_Sans_500Medium',
    fontSize: 13,
    color: COLORS.textMid,
  },

  // Grade badges
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 40,
  },
  gradeBadge: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  gradeText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 13,
    letterSpacing: 2,
    color: COLORS.textDim,
  },
});
