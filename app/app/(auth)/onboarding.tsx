import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Line, Path, Pattern, Rect } from 'react-native-svg';

const C = {
  bg: '#050918',
  surface: '#0B1530',
  surface2: '#0F1C3A',
  accent: '#C9A84C',
  goldLight: '#F0D98A',
  royal: '#1A3A8F',
  royalBright: '#2952CC',
  white: '#FFFFFF',
  textMid: 'rgba(255,255,255,0.58)',
  textDim: 'rgba(255,255,255,0.30)',
  border: 'rgba(255,255,255,0.07)',
  borderMid: 'rgba(255,255,255,0.11)',
  borderGold: 'rgba(201,168,76,0.22)',
  accentRing: 'rgba(201,168,76,0.28)',
  accentDim: 'rgba(201,168,76,0.13)',
  gridLine: 'rgba(41,82,204,0.06)',
};

type Slide = { id: number; step: string; titleA: string; titleAccent: string; titleB: string; body: string; pills: string[]; visual: 'judge' | 'community' | 'backlog' };

const SLIDES: Slide[] = [
  {
    id: 0,
    step: '01 / 03',
    titleA: 'Pilot Judges',
    titleAccent: 'Build!',
    titleB: 'Your',
    body: 'Upload photos of your finished kit and our Pilot grades it across panel lining, weathering, paint finish, and composition — just like a real competition judge.',
    pills: ['Panel lining', 'Weathering', 'Paint finish', 'Composition'],
    visual: 'judge',
  },
  {
    id: 1,
    step: '02 / 03',
    titleA: 'Compete',
    titleAccent: 'world',
    titleB: 'with the',
    body: 'Browse builds from Gunpla builders everywhere. Like, comment, and climb the weekly leaderboard. Your score is your rank — earn it.',
    pills: ['Weekly rankings', 'Global feed', 'Builder profiles'],
    visual: 'community',
  },
  {
    id: 2,
    step: '03 / 03',
    titleA: 'Track your',
    titleAccent: 'shame pile',
    titleB: '',
    body: "Every builder has a backlog. Track what you own, what you're building, and what's on your wishlist — all in one place. No kit left behind.",
    pills: ['Owned', 'Building', 'Wishlist', 'Completed'],
    visual: 'backlog',
  },
];

export default function Onboarding() {
  const [current, setCurrent] = useState(0);
  const slideX = useRef(new Animated.Value(0)).current;
  const slideOp = useRef(new Animated.Value(1)).current;
  const isLast = current === SLIDES.length - 1;
  const slide = SLIDES[current];

  function go(idx: number) {
    if (idx === current) return;
    const dir = idx > current ? 1 : -1;
    Animated.parallel([
      Animated.timing(slideX, { toValue: -60 * dir, duration: 220, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(slideOp, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => {
      setCurrent(idx);
      slideX.setValue(60 * dir);
      Animated.parallel([
        Animated.timing(slideX, { toValue: 0, duration: 320, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(slideOp, { toValue: 1, duration: 320, useNativeDriver: true }),
      ]).start();
    });
  }

  function next() {
    if (isLast) router.replace('/(auth)/sign-up');
    else go(current + 1);
  }
  function back() {
    if (current > 0) go(current - 1);
  }
  function skip() {
    router.replace('/(auth)/sign-up');
  }

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

      <View style={[styles.corner, styles.cornerTL]} pointerEvents="none" />
      <View style={[styles.corner, styles.cornerTR]} pointerEvents="none" />
      <View style={[styles.corner, styles.cornerBL]} pointerEvents="none" />
      <View style={[styles.corner, styles.cornerBR]} pointerEvents="none" />

      <SafeAreaView style={styles.shell}>
        <View style={styles.topbar}>
          <Text style={styles.logoSm}>HANGER</Text>
          <Pressable onPress={skip}>
            <Text style={styles.skipBtn}>SKIP →</Text>
          </Pressable>
        </View>

        <View style={styles.progress}>
          {SLIDES.map((s, i) => (
            <View
              key={s.id}
              style={[
                styles.dot,
                i < current && styles.dotDone,
                i === current && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <View style={styles.viewport}>
          <Animated.View style={[styles.slide, { opacity: slideOp, transform: [{ translateX: slideX }] }]}>
            {slide.visual === 'judge' ? <JudgeVisual /> : null}
            {slide.visual === 'community' ? <CommunityVisual /> : null}
            {slide.visual === 'backlog' ? <BacklogVisual /> : null}

            <Text style={styles.slideStep}>{slide.step}</Text>
            <Text style={styles.slideTitle}>
              {slide.titleA}
              {slide.titleB ? <Text>{'\n'}{slide.titleB} </Text> : <Text> </Text>}
              <Text style={styles.slideTitleAccent}>{slide.titleAccent}</Text>
            </Text>
            <Text style={styles.slideBody}>{slide.body}</Text>
            <View style={styles.pills}>
              {slide.pills.map((p) => (
                <View key={p} style={styles.pill}>
                  <Text style={styles.pillText}>{p}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </View>

        <View style={styles.controls}>
          {current > 0 ? (
            <Pressable style={styles.btnBack} onPress={back}>
              <Svg width={16} height={16} viewBox="0 0 16 16">
                <Path d="M10 12L6 8L10 4" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </Pressable>
          ) : (
            <View style={[styles.btnBack, { opacity: 0 }]} pointerEvents="none" />
          )}
          <Pressable
            style={({ pressed }) => [isLast ? styles.btnFinish : styles.btnNext, pressed && { opacity: 0.85 }]}
            onPress={next}
          >
            <Text style={isLast ? styles.btnFinishText : styles.btnNextText}>{isLast ? "LET'S BUILD" : 'NEXT'}</Text>
            <Text style={isLast ? styles.btnFinishArrow : styles.btnNextArrow}>{isLast ? '  ✦' : '  →'}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function JudgeVisual() {
  const pulse = useRef(new Animated.Value(0)).current;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 1400, useNativeDriver: false }),
      ])
    ).start();
    Animated.timing(barAnim, { toValue: 1, duration: 800, delay: 300, useNativeDriver: false, easing: Easing.out(Easing.cubic) }).start();
  }, []);

  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  const bars = [92, 85, 89, 78, 94];
  const labels = ['Panel', 'Paint', 'Pose', 'Weather', 'Polish'];

  return (
    <View style={[styles.visual, styles.visualGradient]}>
      <View style={styles.stars}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.star, i < 3 && styles.starLit]} />
        ))}
      </View>

      <View style={styles.ringWrap}>
        <View style={styles.ringOuterFaint} />
        <View style={styles.ringOuter} />
        <Animated.View style={[styles.scoreRing, { opacity: pulseOpacity }]}>
          <Text style={styles.scoreNum}>91</Text>
          <Text style={styles.scoreLabel}>PILOT SCORE</Text>
        </Animated.View>
      </View>

      <View style={styles.scoreBars}>
        {bars.map((pct, i) => (
          <View key={i} style={styles.sbar}>
            <Text style={styles.sbarLabel}>{labels[i]}</Text>
            <View style={styles.sbarTrack}>
              <Animated.View
                style={[
                  styles.sbarFill,
                  { width: barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${pct}%`] }) },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function CommunityVisual() {
  const cells = [
    { kit: '⚪', score: 94, user: '@zeropilot' },
    { kit: '🔵', score: 89, user: '@msbuilder' },
    { kit: '🔴', score: 91, user: '@redcomet' },
    { kit: '🟡', score: 82, user: '@gundamkid' },
    { kit: '⚫', score: 87, user: '@plamo_uk' },
    { kit: '🟢', score: 96, user: '@gn_drive' },
  ];
  return (
    <View style={styles.visual}>
      <View style={styles.cgGrid}>
        {cells.map((c, i) => (
          <View key={i} style={styles.cgCell}>
            <View style={styles.cgKit}>
              <Text style={{ fontSize: 20 }}>{c.kit}</Text>
            </View>
            <Text style={styles.cgScore}>{c.score}</Text>
            <Text style={styles.cgUser}>{c.user}</Text>
          </View>
        ))}
      </View>
      <View style={styles.cgRankBadge}>
        <Text style={styles.cgRankBadgeText}>WEEKLY #1</Text>
      </View>
    </View>
  );
}

function BacklogVisual() {
  const rows = [
    { name: 'Hi-Nu Gundam Ver. Ka', grade: 'MG · MASTER GRADE', status: 'BUILDING', kind: 'building' as const },
    { name: 'Zaku II Ver. 2.0', grade: 'MG · MASTER GRADE', status: 'OWNED', kind: 'owned' as const },
    { name: 'Barbatos 6th Form', grade: 'MG · MASTER GRADE', status: 'WISHLIST', kind: 'wish' as const },
    { name: 'Strike Freedom', grade: 'RG · REAL GRADE', status: 'OWNED', kind: 'owned' as const },
  ];
  return (
    <View style={[styles.visual, { padding: 0, justifyContent: 'flex-start' }]}>
      {rows.map((r, i) => (
        <View key={i} style={[styles.blRow, i === rows.length - 1 && { borderBottomWidth: 0 }]}>
          <View style={styles.blBox}>
            <Text style={{ fontSize: 16 }}>📦</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.blName}>{r.name}</Text>
            <Text style={styles.blGrade}>{r.grade}</Text>
          </View>
          <View
            style={[
              styles.blStatus,
              r.kind === 'building' && styles.sBuilding,
              r.kind === 'owned' && styles.sOwned,
              r.kind === 'wish' && styles.sWish,
            ]}
          >
            <Text
              style={[
                styles.blStatusText,
                r.kind === 'building' && { color: C.accent },
                r.kind === 'owned' && { color: '#7FA4FF' },
                r.kind === 'wish' && { color: C.textMid },
              ]}
            >
              {r.status}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, overflow: 'hidden' },
  shell: { flex: 1, paddingHorizontal: 28, paddingBottom: 28, maxWidth: 520, alignSelf: 'center', width: '100%' },

  corner: { position: 'absolute', width: 36, height: 36, borderColor: C.borderGold },
  cornerTL: { top: 20, left: 20, borderTopWidth: 1, borderLeftWidth: 1 },
  cornerTR: { top: 20, right: 20, borderTopWidth: 1, borderRightWidth: 1 },
  cornerBL: { bottom: 20, left: 20, borderBottomWidth: 1, borderLeftWidth: 1 },
  cornerBR: { bottom: 20, right: 20, borderBottomWidth: 1, borderRightWidth: 1 },

  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
  logoSm: { fontFamily: 'BebasNeue_400Regular', fontSize: 22, letterSpacing: 4, color: C.accent },
  skipBtn: { fontSize: 12, color: C.textDim, fontFamily: 'DMSans_300Light', letterSpacing: 1 },

  progress: { flexDirection: 'row', gap: 6, marginTop: 24 },
  dot: { height: 3, borderRadius: 2, backgroundColor: C.borderMid, flex: 1 },
  dotActive: { backgroundColor: C.accent, flex: 2.8 },
  dotDone: { backgroundColor: 'rgba(201,168,76,0.35)' },

  viewport: { flex: 1, justifyContent: 'center', overflow: 'hidden' },
  slide: { width: '100%' },

  visual: {
    width: '100%',
    height: 210,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.borderGold,
    marginBottom: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  visualGradient: { backgroundColor: C.surface },

  // Judge visual
  stars: { position: 'absolute', top: 14, left: 18, flexDirection: 'row', gap: 3 },
  star: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(201,168,76,0.25)' },
  starLit: { backgroundColor: C.accent },

  ringWrap: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center', position: 'absolute', left: 32, top: 35 },
  ringOuterFaint: { position: 'absolute', width: 146, height: 146, borderRadius: 73, borderWidth: 1, borderColor: 'rgba(201,168,76,0.10)' },
  ringOuter: { position: 'absolute', width: 126, height: 126, borderRadius: 63, borderWidth: 1, borderColor: C.accentRing },
  scoreRing: {
    width: 110, height: 110, borderRadius: 55,
    borderWidth: 3, borderColor: C.royalBright,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  scoreNum: { fontFamily: 'BebasNeue_400Regular', fontSize: 42, color: C.goldLight, lineHeight: 42, letterSpacing: 2 },
  scoreLabel: { fontSize: 9, letterSpacing: 2, color: C.textDim, fontFamily: 'DMSans_300Light', marginTop: 2 },

  scoreBars: { position: 'absolute', right: 16, top: 30, gap: 7 },
  sbar: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sbarLabel: { fontSize: 9, color: C.textDim, width: 44, fontFamily: 'DMSans_300Light' },
  sbarTrack: { width: 56, height: 3, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden' },
  sbarFill: { height: '100%', borderRadius: 2, backgroundColor: C.accent },

  // Community visual
  cgGrid: {
    flex: 1, width: '100%',
    flexDirection: 'row', flexWrap: 'wrap',
  },
  cgCell: {
    width: '33.33%', height: '50%',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.surface,
    borderRightWidth: 1, borderBottomWidth: 1, borderColor: C.border,
    gap: 5,
  },
  cgKit: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: C.surface2,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  cgScore: { fontFamily: 'BebasNeue_400Regular', fontSize: 14, color: C.accent, letterSpacing: 1 },
  cgUser: { fontSize: 9, color: C.textDim, fontFamily: 'DMSans_300Light' },
  cgRankBadge: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: C.royal,
    borderWidth: 1, borderColor: C.accentRing,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  cgRankBadgeText: { fontFamily: 'BebasNeue_400Regular', fontSize: 11, letterSpacing: 1.5, color: C.goldLight },

  // Backlog visual
  blRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
    width: '100%',
  },
  blBox: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: C.surface2,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  blName: { fontSize: 12, color: C.white, fontFamily: 'DMSans_500Medium' },
  blGrade: { fontSize: 9, color: C.textDim, letterSpacing: 1, marginTop: 1, fontFamily: 'DMSans_300Light' },
  blStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  blStatusText: { fontSize: 9, fontFamily: 'DMSans_500Medium', letterSpacing: 1 },
  sBuilding: { backgroundColor: 'rgba(201,168,76,0.15)', borderColor: C.borderGold },
  sOwned: { backgroundColor: 'rgba(41,82,204,0.20)', borderColor: 'rgba(41,82,204,0.30)' },
  sWish: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: C.border },

  // Slide text
  slideStep: { fontSize: 10, letterSpacing: 3, color: C.accent, fontFamily: 'DMSans_500Medium', marginBottom: 8 },
  slideTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 42, letterSpacing: 2, lineHeight: 44, color: C.white, marginBottom: 12 },
  slideTitleAccent: { color: C.accent },
  slideBody: { fontSize: 14, color: C.textMid, lineHeight: 23, fontFamily: 'DMSans_300Light' },

  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  pill: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: C.borderGold,
    backgroundColor: C.accentDim,
  },
  pillText: { fontSize: 11, color: C.accent, fontFamily: 'DMSans_400Regular' },

  // Bottom controls
  controls: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 24 },
  btnBack: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 1, borderColor: C.borderMid,
    alignItems: 'center', justifyContent: 'center',
  },
  btnNext: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.royalBright,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.38)',
    borderRadius: 30, paddingVertical: 15, paddingHorizontal: 24,
  },
  btnNextText: { fontSize: 13, letterSpacing: 2, color: C.goldLight, fontFamily: 'DMSans_500Medium' },
  btnNextArrow: { fontSize: 16, color: C.accent, fontFamily: 'DMSans_500Medium' },
  btnFinish: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.accent,
    borderRadius: 30, paddingVertical: 15, paddingHorizontal: 24,
  },
  btnFinishText: { fontSize: 13, letterSpacing: 2, color: '#0A0F1E', fontFamily: 'DMSans_500Medium' },
  btnFinishArrow: { fontSize: 16, color: '#0A0F1E', fontFamily: 'DMSans_500Medium' },
});
