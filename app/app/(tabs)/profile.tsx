import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Line, Path, Pattern, Rect } from 'react-native-svg';
import { fetchMyBuilds } from '@/api/builds';
import { BuildSummary } from '@/components/BuildCard';
import { useAuth } from '@/context/AuthContext';

const C = {
  bg: '#050918',
  surface: '#0B1530',
  surface2: '#0F1C3A',
  accent: '#C9A84C',
  accentDim: 'rgba(201,168,76,0.13)',
  accentRing: 'rgba(201,168,76,0.28)',
  royal: '#1A3A8F',
  royalBright: '#2952CC',
  royalSoft: 'rgba(41,82,204,0.18)',
  white: '#FFFFFF',
  goldLight: '#F0D98A',
  greenHud: '#4ADE80',
  redHud: '#FF5577',
  blueHud: '#7FA4FF',
  textMid: 'rgba(255,255,255,0.62)',
  textDim: 'rgba(255,255,255,0.32)',
  textFaint: 'rgba(255,255,255,0.18)',
  border: 'rgba(255,255,255,0.06)',
  borderMid: 'rgba(255,255,255,0.10)',
  borderGold: 'rgba(201,168,76,0.22)',
};

const RANKS = [
  { min: 0, name: 'RECRUIT', short: 'REC' },
  { min: 500, name: 'ENSIGN', short: 'ENS' },
  { min: 1500, name: '2nd LIEUTENANT', short: '2nd LT' },
  { min: 3000, name: '1st LIEUTENANT', short: '1st LT' },
  { min: 5000, name: 'LIEUTENANT', short: 'LT' },
  { min: 8000, name: 'CAPTAIN', short: 'CPT' },
  { min: 12000, name: 'MAJOR', short: 'MAJ' },
];

function rankOf(xp: number) {
  let current = RANKS[0];
  let next = RANKS[1];
  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].min) {
      current = RANKS[i];
      next = RANKS[i + 1] ?? { min: RANKS[i].min + 4000, name: 'LEGEND', short: 'LEG' };
    }
  }
  return { current, next };
}

function timeAgoShort(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 3600) return `${Math.floor(d / 60)}m`;
  if (d < 86400) return `${Math.floor(d / 3600)}h`;
  if (d < 604800) return `${Math.floor(d / 86400)}d`;
  if (d < 2592000) return `${Math.floor(d / 604800)}w`;
  return `${Math.floor(d / 2592000)}m`;
}

function gradePipColor(grade: string) {
  const up = grade.toUpperCase();
  if (up === 'MG') return { color: C.accent, border: C.borderGold };
  if (up === 'RG') return { color: C.blueHud, border: 'rgba(41,82,204,0.4)' };
  if (up === 'PG') return { color: '#F0997B', border: 'rgba(240,153,123,0.4)' };
  return { color: C.textMid, border: C.borderMid };
}

type Tab = 'HANGAR' | 'MEDALS' | 'LOG';

export default function Profile() {
  const { session, profile, signOut } = useAuth();
  const [builds, setBuilds] = useState<BuildSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('HANGAR');

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const data = await fetchMyBuilds(session.user.id);
      setBuilds(data);
    } catch (e) {
      console.warn('profile load failed', e);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const kits = builds.length;
  const avg = kits ? Math.round(builds.reduce((s, b) => s + b.score, 0) / kits) : 0;
  const totalXp = builds.reduce((s, b) => s + b.score * 10, 0);
  const { current: rank, next: nextRank } = rankOf(totalXp);
  const rankBase = rank.min;
  const rankSpan = Math.max(nextRank.min - rankBase, 1);
  const rankPct = Math.min(100, Math.round(((totalXp - rankBase) / rankSpan) * 100));
  const initials = (profile?.handle ?? profile?.display_name ?? '??').slice(0, 2).toUpperCase();
  const pilotId = `${initials}-${new Date().getFullYear()}-${session?.user.id.slice(0, 4).toUpperCase() ?? '0000'}`;
  const yearJoined = profile?.joined_year ?? new Date().getFullYear();

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern id="g" patternUnits="userSpaceOnUse" width={32} height={32}>
              <Line x1="0" y1="0" x2="32" y2="0" stroke="rgba(41,82,204,0.05)" strokeWidth={1} />
              <Line x1="0" y1="0" x2="0" y2="32" stroke="rgba(41,82,204,0.05)" strokeWidth={1} />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#g)" />
        </Svg>
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>PILOT PROFILE</Text>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconBtn} onPress={() => Alert.alert('Coming soon', 'Profile link copy / sharing not implemented yet.')}>
              <Svg width={14} height={14} viewBox="0 0 14 14">
                <Circle cx={11} cy={3} r={2} stroke="rgba(255,255,255,0.6)" strokeWidth={1.2} />
                <Circle cx={3} cy={7} r={2} stroke="rgba(255,255,255,0.6)" strokeWidth={1.2} />
                <Circle cx={11} cy={11} r={2} stroke="rgba(255,255,255,0.6)" strokeWidth={1.2} />
                <Path d="M4.5 6L9.5 4M4.5 8L9.5 10" stroke="rgba(255,255,255,0.6)" strokeWidth={1.2} />
              </Svg>
            </Pressable>
            <Pressable
              style={styles.iconBtn}
              onPress={() =>
                Alert.alert('Settings', undefined, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Sign out', style: 'destructive', onPress: signOut },
                ])
              }
            >
              <Svg width={14} height={14} viewBox="0 0 14 14">
                <Circle cx={7} cy={7} r={3.5} stroke="rgba(255,255,255,0.6)" strokeWidth={1.1} fill="none" />
                <Circle cx={7} cy={7} r={1.4} stroke="rgba(255,255,255,0.6)" strokeWidth={1.1} fill="none" />
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                  <Rect
                    key={angle}
                    x={6.4}
                    y={0.5}
                    width={1.2}
                    height={2.2}
                    fill="rgba(255,255,255,0.6)"
                    transform={`rotate(${angle} 7 7)`}
                  />
                ))}
              </Svg>
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={C.accent} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {/* Pilot ID Card */}
            <View style={styles.pilotCard}>
              <Text style={styles.watermark}>HANGER</Text>
              <View style={styles.pilotCardGlow} pointerEvents="none" />

              <View style={styles.idStrip}>
                <Text style={styles.idStripText}>// PILOT ID</Text>
                <View style={styles.idDash} />
                <Text style={styles.idStripText}>{pilotId}</Text>
              </View>

              <View style={styles.pilotRow}>
                <View style={styles.avatarWrap}>
                  <View style={styles.avatarRing} />
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankBadgeText}>{rank.short}</Text>
                    </View>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pilotName}>{profile?.display_name ?? profile?.handle ?? 'Builder'}</Text>
                  <Text style={styles.pilotCallsign}>// @{profile?.handle ?? 'unknown'}</Text>
                  <View style={styles.rankLine}>
                    <Svg width={9} height={9} viewBox="0 0 14 14">
                      <Path d="M7 1L8.5 5L13 5L9.5 7.5L11 12L7 9.5L3 12L4.5 7.5L1 5L5.5 5L7 1Z" fill={C.accent} />
                    </Svg>
                    <Text style={styles.rankLineText}>{rank.name}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.bio}>
                <Text style={styles.bioText}>
                  Joined <Text style={{ color: C.goldLight }}>{yearJoined}</Text>. {kits} kits filed, avg score{' '}
                  <Text style={{ color: C.goldLight }}>{avg || '—'}</Text>. Logged for active duty.
                </Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statCell}>
                  <Text style={styles.statNum}>{kits}</Text>
                  <Text style={styles.statLabel}>KITS</Text>
                </View>
                <View style={styles.statCell}>
                  <Text style={[styles.statNum, { color: C.accent }]}>{avg || '—'}</Text>
                  <Text style={styles.statLabel}>AVG</Text>
                </View>
                <View style={styles.statCell}>
                  <Text style={styles.statNum}>0</Text>
                  <Text style={styles.statLabel}>FOLLOWERS</Text>
                </View>
                <View style={styles.statCell}>
                  <Text style={styles.statNum}>—</Text>
                  <Text style={styles.statLabel}>RANK</Text>
                </View>
              </View>
            </View>

            {/* Rank progress */}
            <View style={styles.rankProgress}>
              <View style={styles.rankProgressHeader}>
                <View style={styles.rankCurrent}>
                  <View style={styles.rankIcon}>
                    <Svg width={14} height={14} viewBox="0 0 14 14">
                      <Path d="M7 1L8.5 5L13 5L9.5 7.5L11 12L7 9.5L3 12L4.5 7.5L1 5L5.5 5L7 1Z" fill={C.accent} />
                    </Svg>
                  </View>
                  <Text style={styles.rankText}>{rank.name}</Text>
                </View>
                <Text style={styles.rankXp}>
                  {totalXp.toLocaleString()} / {nextRank.min.toLocaleString()} XP
                </Text>
              </View>
              <View style={styles.rankBar}>
                <View style={[styles.rankBarFill, { width: `${rankPct}%` }]} />
              </View>
              <View style={styles.rankProgressFooter}>
                <Text style={styles.rankFooterText}>// CURRENT RANK</Text>
                <Text style={[styles.rankFooterText, { color: C.goldLight }]}>NEXT: {nextRank.name} ▸</Text>
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
              {(['HANGAR', 'MEDALS', 'LOG'] as Tab[]).map((t) => (
                <Pressable key={t} style={styles.tab} onPress={() => setTab(t)}>
                  <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
                  {tab === t ? <View style={styles.tabIndicator} /> : null}
                </Pressable>
              ))}
            </View>

            {/* Tab content */}
            {tab === 'HANGAR' ? <HangarTab builds={builds} /> : null}
            {tab === 'MEDALS' ? <MedalsTab builds={builds} totalXp={totalXp} /> : null}
            {tab === 'LOG' ? <LogTab builds={builds} rank={rank.name} /> : null}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

function HangarTab({ builds }: { builds: BuildSummary[] }) {
  return (
    <View style={styles.tabSection}>
      <View style={styles.shelfControls}>
        <Text style={styles.shelfCount}>
          DISPLAYED: <Text style={{ color: C.accent }}>{builds.length} KITS</Text>
        </Text>
        <View style={styles.sortBtn}>
          <Svg width={10} height={10} viewBox="0 0 10 10">
            <Path d="M2 2H8M3 5H7M4 8H6" stroke={C.textMid} strokeWidth={1} strokeLinecap="round" />
          </Svg>
          <Text style={styles.sortBtnText}>RECENT ↓</Text>
        </View>
      </View>

      {builds.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No kits on the shelf yet.</Text>
          <Pressable style={styles.cta} onPress={() => router.push('/(tabs)/judge')}>
            <Text style={styles.ctaText}>FILE FIRST BUILD →</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.shelfGrid}>
          {builds.map((b) => {
            const pip = gradePipColor(b.grade);
            return (
              <Pressable key={b.id} style={styles.kitCard} onPress={() => router.push(`/build/${b.id}`)}>
                <View style={styles.kitPhoto}>
                  {b.photo_url ? (
                    <Image source={{ uri: b.photo_url }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <Text style={{ fontSize: 40 }}>🤖</Text>
                  )}
                  <View style={[styles.kitGradePip, { borderColor: pip.border }]}>
                    <Text style={[styles.kitGradePipText, { color: pip.color }]}>{b.grade.toUpperCase()}</Text>
                  </View>
                  <View style={styles.kitScoreBadge}>
                    <Text style={styles.kitScoreBadgeText}>{b.score}</Text>
                  </View>
                </View>
                <View style={styles.kitInfo}>
                  <Text style={styles.kitName} numberOfLines={1}>
                    {b.kit_name}
                  </Text>
                  <Text style={styles.kitMeta}>
                    {b.grade.toUpperCase()} · {timeAgoShort(b.created_at)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

function MedalsTab({ builds, totalXp }: { builds: BuildSummary[]; totalXp: number }) {
  const medals = [
    { id: 'first', name: 'FIRST BUILD', icon: '🥇', earned: builds.length >= 1 },
    { id: 'high', name: '90+ SCORE', icon: '⭐', earned: builds.some((b) => b.score >= 90) },
    { id: 'ten', name: '10 KITS', icon: '🏆', earned: builds.length >= 10 },
    { id: 'mg', name: 'MG PILOT', icon: '🎯', earned: builds.some((b) => b.grade.toUpperCase() === 'MG') },
    { id: 'streak', name: 'WEEK STREAK', icon: '🔥', earned: streakDays(builds) >= 7 },
    { id: 'xp1k', name: '1K XP', icon: '⚡', earned: totalXp >= 1000 },
    { id: 'rg', name: 'RG PILOT', icon: '🛡️', earned: builds.some((b) => b.grade.toUpperCase() === 'RG') },
    { id: 'perfect', name: 'PERFECT 100', icon: '🌟', earned: builds.some((b) => b.score >= 100) },
    { id: 'top100', name: 'TOP 100', icon: '👑', earned: false },
    { id: 'pg', name: 'PG CLUB', icon: '💎', earned: builds.some((b) => b.grade.toUpperCase() === 'PG') },
    { id: 'newtype', name: 'NEWTYPE', icon: '🔮', earned: builds.length >= 25 },
    { id: 'fifty', name: '50 KITS', icon: '⚔️', earned: builds.length >= 50 },
  ];
  const earnedCount = medals.filter((m) => m.earned).length;
  return (
    <View style={styles.tabSection}>
      <View style={styles.shelfControls}>
        <Text style={styles.shelfCount}>
          EARNED: <Text style={{ color: C.accent }}>{earnedCount} / {medals.length}</Text>
        </Text>
      </View>
      <View style={styles.achieveGrid}>
        {medals.map((m) => (
          <View key={m.id} style={[styles.achieveCard, m.earned ? styles.achieveEarned : styles.achieveLocked]}>
            <View style={[styles.achieveIcon, m.earned && styles.achieveIconEarned]}>
              <Text style={{ fontSize: 18 }}>{m.icon}</Text>
            </View>
            <Text style={[styles.achieveName, m.earned && { color: C.goldLight }]}>{m.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function LogTab({ builds, rank }: { builds: BuildSummary[]; rank: string }) {
  if (builds.length === 0) {
    return (
      <View style={styles.tabSection}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No activity yet.</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.tabSection}>
      <View style={styles.shelfControls}>
        <Text style={styles.shelfCount}>
          RECENT <Text style={{ color: C.accent }}>// LAST 30 DAYS</Text>
        </Text>
      </View>
      {builds.slice(0, 12).map((b) => {
        const grade = b.score >= 90 ? 'GRADE S' : b.score >= 85 ? 'GRADE A' : b.score >= 75 ? 'GRADE B' : 'GRADE C';
        return (
          <View key={b.id} style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Svg width={16} height={16} viewBox="0 0 16 16">
                <Path d="M8 2L9.5 6.5L14 7L10.5 10L12 14L8 11.5L4 14L5.5 10L2 7L6.5 6.5L8 2Z" stroke={C.accent} strokeWidth={1.3} strokeLinejoin="round" />
              </Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.activityText}>
                Earned <Text style={{ color: C.accent }}>{grade}</Text> on <Text style={{ color: C.white, fontFamily: 'DMSans_500Medium' }}>{b.kit_name}</Text> — {b.score} / 100
              </Text>
              <Text style={styles.activityTime}>
                {timeAgoShort(b.created_at).toUpperCase()} AGO · +{b.score * 10} XP
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function streakDays(builds: BuildSummary[]): number {
  if (builds.length === 0) return 0;
  const days = new Set(builds.map((b) => new Date(b.created_at).toISOString().slice(0, 10)));
  return days.size;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    paddingHorizontal: 20, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 18, letterSpacing: 3, color: C.white },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.borderMid,
    alignItems: 'center', justifyContent: 'center',
  },

  pilotCard: {
    marginHorizontal: 20, marginTop: 20,
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.borderGold, borderRadius: 20,
    padding: 18, overflow: 'hidden', position: 'relative',
  },
  pilotCardGlow: { position: 'absolute', top: -80, right: -60, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(201,168,76,0.10)' },
  watermark: {
    position: 'absolute', bottom: 12, right: 14,
    fontFamily: 'BebasNeue_400Regular', fontSize: 56, letterSpacing: 4,
    color: 'rgba(201,168,76,0.05)', lineHeight: 56,
  },

  idStrip: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  idStripText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, letterSpacing: 1.5, color: C.accent },
  idDash: { flex: 1, height: 1, backgroundColor: C.accentRing },

  pilotRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  avatarWrap: { width: 78, height: 78, alignItems: 'center', justifyContent: 'center' },
  avatarRing: { position: 'absolute', width: 94, height: 94, borderRadius: 47, borderWidth: 1, borderColor: C.accentRing },
  avatar: {
    width: 78, height: 78, borderRadius: 39,
    backgroundColor: C.royalBright,
    borderWidth: 2, borderColor: C.accent,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  avatarText: { fontFamily: 'BebasNeue_400Regular', fontSize: 30, letterSpacing: 2, color: C.goldLight },
  rankBadge: {
    position: 'absolute', bottom: -6, right: -8,
    backgroundColor: C.accent,
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 3,
    borderWidth: 1.5, borderColor: C.bg,
  },
  rankBadgeText: { fontFamily: 'BebasNeue_400Regular', fontSize: 9, letterSpacing: 0.5, color: '#0A0F1E' },

  pilotName: { fontSize: 18, color: C.white, fontFamily: 'DMSans_500Medium', marginBottom: 3 },
  pilotCallsign: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: C.textMid, letterSpacing: 1, marginBottom: 8 },
  rankLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rankLineText: { fontSize: 11, color: C.accent, fontFamily: 'DMSans_500Medium', letterSpacing: 1 },

  bio: {
    paddingVertical: 12, paddingHorizontal: 14,
    backgroundColor: 'rgba(5,9,24,0.4)',
    borderLeftWidth: 2, borderLeftColor: C.accent,
    borderTopRightRadius: 8, borderBottomRightRadius: 8,
    marginBottom: 16,
  },
  bioText: { fontSize: 12, color: C.textMid, lineHeight: 19, fontFamily: 'DMSans_300Light' },

  statsRow: {
    flexDirection: 'row',
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: C.border,
    backgroundColor: C.border,
    gap: 1,
  },
  statCell: { flex: 1, backgroundColor: C.surface, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center' },
  statNum: { fontFamily: 'BebasNeue_400Regular', fontSize: 20, letterSpacing: 1, color: C.white, lineHeight: 22 },
  statLabel: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, letterSpacing: 1.5, color: C.textDim, marginTop: 5 },

  rankProgress: {
    marginHorizontal: 20, marginTop: 16,
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.border, borderRadius: 14,
    padding: 16,
  },
  rankProgressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  rankCurrent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rankIcon: {
    width: 28, height: 28, borderRadius: 6,
    backgroundColor: C.accentDim,
    borderWidth: 1, borderColor: C.borderGold,
    alignItems: 'center', justifyContent: 'center',
  },
  rankText: { fontFamily: 'BebasNeue_400Regular', fontSize: 14, letterSpacing: 1.5, color: C.white },
  rankXp: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, color: C.accent },
  rankBar: { width: '100%', height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  rankBarFill: { height: '100%', backgroundColor: C.accent, borderRadius: 3 },
  rankProgressFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  rankFooterText: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 9, color: C.textDim, letterSpacing: 0.5 },

  tabs: {
    flexDirection: 'row', gap: 4,
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
    marginBottom: 16,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, position: 'relative' },
  tabText: { fontFamily: 'DMSans_500Medium', fontSize: 11, letterSpacing: 1.5, color: C.textDim },
  tabTextActive: { color: C.accent },
  tabIndicator: { position: 'absolute', bottom: -13, left: 0, right: 0, height: 2, backgroundColor: C.accent, borderRadius: 1 },

  tabSection: { paddingHorizontal: 20 },
  shelfControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  shelfCount: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, letterSpacing: 1.5, color: C.textDim },
  sortBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.borderMid, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  sortBtnText: { fontSize: 10, color: C.textMid, fontFamily: 'DMSans_500Medium', letterSpacing: 1 },

  shelfGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kitCard: {
    width: '48%',
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.border, borderRadius: 14,
    overflow: 'hidden',
  },
  kitPhoto: {
    height: 100, backgroundColor: C.surface2,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  kitGradePip: {
    position: 'absolute', top: 8, left: 8,
    paddingHorizontal: 5, paddingVertical: 2,
    backgroundColor: 'rgba(5,9,24,0.85)',
    borderWidth: 1, borderRadius: 3,
  },
  kitGradePipText: { fontFamily: 'BebasNeue_400Regular', fontSize: 9, letterSpacing: 1 },
  kitScoreBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(5,9,24,0.85)',
    borderWidth: 1, borderColor: C.borderGold, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  kitScoreBadgeText: { fontFamily: 'BebasNeue_400Regular', fontSize: 13, letterSpacing: 1, color: C.goldLight },
  kitInfo: { paddingHorizontal: 12, paddingVertical: 10 },
  kitName: { fontSize: 12, color: C.white, fontFamily: 'DMSans_500Medium', marginBottom: 3 },
  kitMeta: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 9, color: C.textDim, letterSpacing: 0.5 },

  achieveGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  achieveCard: {
    width: '31%', aspectRatio: 1,
    backgroundColor: C.surface,
    borderWidth: 1, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 8,
    alignItems: 'center', justifyContent: 'center',
    gap: 6,
  },
  achieveEarned: { borderColor: C.borderGold },
  achieveLocked: { borderColor: C.border, opacity: 0.4 },
  achieveIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.surface2,
    borderWidth: 1, borderColor: C.borderMid,
    alignItems: 'center', justifyContent: 'center',
  },
  achieveIconEarned: { backgroundColor: C.royalSoft, borderColor: C.borderGold },
  achieveName: {
    fontFamily: 'BebasNeue_400Regular', fontSize: 11, letterSpacing: 1,
    color: C.white, textAlign: 'center', lineHeight: 12,
  },

  activityItem: {
    flexDirection: 'row', gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border, borderStyle: 'dashed',
  },
  activityIcon: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.borderMid,
    alignItems: 'center', justifyContent: 'center',
  },
  activityText: { fontSize: 12, color: C.textMid, lineHeight: 18, fontFamily: 'DMSans_300Light' },
  activityTime: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 9, color: C.textDim, letterSpacing: 0.5, marginTop: 3 },

  empty: { padding: 40, alignItems: 'center', gap: 12 },
  emptyText: { color: C.textDim, textAlign: 'center', fontFamily: 'DMSans_300Light', fontSize: 13 },
  cta: { backgroundColor: C.accent, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  ctaText: { color: '#0A0F1E', fontFamily: 'DMSans_500Medium', fontSize: 12, letterSpacing: 1 },
});
