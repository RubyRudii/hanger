import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, Path, Pattern, Rect } from 'react-native-svg';

const C = {
  bg: '#050918',
  surface: '#0B1530',
  surface2: '#0F1C3A',
  accent: '#C9A84C',
  accentDim: 'rgba(201,168,76,0.13)',
  accentRing: 'rgba(201,168,76,0.28)',
  goldLight: '#F0D98A',
  royalBright: '#2952CC',
  white: '#FFFFFF',
  textMid: 'rgba(255,255,255,0.62)',
  textDim: 'rgba(255,255,255,0.32)',
  border: 'rgba(255,255,255,0.06)',
  borderMid: 'rgba(255,255,255,0.10)',
  borderGold: 'rgba(201,168,76,0.22)',
  greenHud: '#4ADE80',
};

const BENEFITS = [
  { icon: '🎖', title: 'Unlimited AI Judging', body: 'Submit any kit, any time. Senior pilot scores every build.' },
  { icon: '📡', title: 'Post to the Community Feed', body: 'Share your judged builds. Earn likes, climb the weekly leaderboard.' },
  { icon: '⚙️', title: 'XP & Rank Progression', body: 'Earn XP per build. Promote from Recruit to Captain and beyond.' },
  { icon: '🏅', title: 'Earn Medals', body: 'Unlock achievements as your hangar grows.' },
];

const PLANS = [
  { id: 'monthly', name: 'MONTHLY', price: '$4.99', sub: '/ month', highlight: false },
  { id: 'yearly', name: 'YEARLY', price: '$39.99', sub: '/ year · save 33%', highlight: true },
];

export function Paywall({ onClose }: { onClose?: () => void }) {
  function onSubscribe(planId: string) {
    Alert.alert(
      'In-app purchases coming soon',
      'RevenueCat + App Store / Play Store products are next. For now, the paywall is wired but not purchasable. Ping me when your dev accounts are set up and I\'ll wire it the rest of the way.',
    );
  }

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern id="gp" patternUnits="userSpaceOnUse" width={32} height={32}>
              <Line x1="0" y1="0" x2="32" y2="0" stroke="rgba(41,82,204,0.05)" strokeWidth={1} />
              <Line x1="0" y1="0" x2="0" y2="32" stroke="rgba(41,82,204,0.05)" strokeWidth={1} />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#gp)" />
        </Svg>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        {onClose ? (
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={10}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        ) : null}

        <View style={styles.heroIcon}>
          <View style={styles.heroRing} />
          <View style={styles.heroInner}>
            <Svg width={36} height={36} viewBox="0 0 20 20">
              <Path d="M10 2L11.5 7.5L17 9L11.5 10.5L10 16L8.5 10.5L3 9L8.5 7.5L10 2Z" fill={C.goldLight} />
            </Svg>
          </View>
        </View>

        <Text style={styles.eyebrow}>// PILOT'S COMMISSION</Text>
        <Text style={styles.title}>UNLOCK FULL{'\n'}OPERATIONS</Text>
        <Text style={styles.sub}>
          Hangar logging is free forever. Judge submissions and community feed posting require a pilot's commission.
        </Text>

        <View style={styles.benefits}>
          {BENEFITS.map((b) => (
            <View key={b.title} style={styles.benefit}>
              <Text style={styles.benefitIcon}>{b.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.benefitTitle}>{b.title}</Text>
                <Text style={styles.benefitBody}>{b.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.plans}>
          {PLANS.map((p) => (
            <Pressable
              key={p.id}
              style={[styles.plan, p.highlight && styles.planHighlight]}
              onPress={() => onSubscribe(p.id)}
            >
              {p.highlight ? (
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>BEST VALUE</Text>
                </View>
              ) : null}
              <Text style={[styles.planName, p.highlight && { color: C.goldLight }]}>{p.name}</Text>
              <Text style={[styles.planPrice, p.highlight && { color: C.goldLight }]}>{p.price}</Text>
              <Text style={styles.planSub}>{p.sub}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.legal}>
          Auto-renews monthly / annually. Cancel anytime in your App Store or Play Store settings.{'\n'}
          // TRANSMISSION SECURED · APPLE / GOOGLE PROCESSING
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  closeBtn: { alignSelf: 'flex-end', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface, borderWidth: 1, borderColor: C.borderMid },
  closeBtnText: { color: C.textMid, fontSize: 18 },

  heroIcon: { alignSelf: 'center', width: 96, height: 96, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  heroRing: { position: 'absolute', width: 96, height: 96, borderRadius: 48, borderWidth: 1, borderColor: C.accentRing },
  heroInner: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: C.royalBright,
    borderWidth: 2, borderColor: C.accent,
    alignItems: 'center', justifyContent: 'center',
  },

  eyebrow: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, letterSpacing: 2, color: C.accent, textAlign: 'center', marginTop: 18 },
  title: { fontFamily: 'BebasNeue_400Regular', fontSize: 40, letterSpacing: 2, color: C.white, textAlign: 'center', lineHeight: 42, marginTop: 6 },
  sub: { fontFamily: 'DMSans_300Light', fontSize: 13, color: C.textMid, textAlign: 'center', lineHeight: 20, marginTop: 14, paddingHorizontal: 8 },

  benefits: { marginTop: 28, gap: 12 },
  benefit: {
    flexDirection: 'row', gap: 14, alignItems: 'center',
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.border, borderRadius: 14,
    padding: 14,
  },
  benefitIcon: { fontSize: 26 },
  benefitTitle: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: C.white, marginBottom: 2 },
  benefitBody: { fontFamily: 'DMSans_300Light', fontSize: 11, color: C.textMid, lineHeight: 16 },

  plans: { flexDirection: 'row', gap: 10, marginTop: 24 },
  plan: {
    flex: 1, position: 'relative',
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.borderMid, borderRadius: 16,
    paddingVertical: 18, paddingHorizontal: 14, alignItems: 'center',
  },
  planHighlight: { borderColor: C.accent, backgroundColor: C.surface2 },
  planBadge: { position: 'absolute', top: -10, alignSelf: 'center', backgroundColor: C.accent, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  planBadgeText: { fontFamily: 'BebasNeue_400Regular', fontSize: 10, letterSpacing: 1.5, color: '#0A0F1E' },
  planName: { fontFamily: 'BebasNeue_400Regular', fontSize: 14, letterSpacing: 2.5, color: C.white, marginBottom: 8 },
  planPrice: { fontFamily: 'BebasNeue_400Regular', fontSize: 28, letterSpacing: 1, color: C.white, lineHeight: 28 },
  planSub: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: C.textDim, marginTop: 6, textAlign: 'center' },

  legal: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 9, color: C.textDim, textAlign: 'center', marginTop: 24, lineHeight: 14 },
});
