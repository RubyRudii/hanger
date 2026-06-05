import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Svg, { Circle, Defs, Line, Path, Pattern, Rect } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchFeed, fetchMyBuilds, fetchTopThisWeek } from '@/api/builds';
import { BuildSummary } from '@/components/BuildCard';
import { useAuth } from '@/context/AuthContext';

const C = {
  bg: '#050918',
  surface: '#0B1530',
  surface2: '#0F1C3A',
  surface3: '#142447',
  accent: '#C9A84C',
  accentDim: 'rgba(201,168,76,0.13)',
  accentRing: 'rgba(201,168,76,0.28)',
  royal: '#1A3A8F',
  royalBright: '#2952CC',
  white: '#FFFFFF',
  goldLight: '#F0D98A',
  textMid: 'rgba(255,255,255,0.62)',
  textDim: 'rgba(255,255,255,0.32)',
  textFaint: 'rgba(255,255,255,0.18)',
  border: 'rgba(255,255,255,0.06)',
  borderMid: 'rgba(255,255,255,0.10)',
  borderGold: 'rgba(201,168,76,0.22)',
  live: '#4ADE80',
  like: '#FF5577',
};

const FILTERS = ['ALL', 'FOLLOWING', 'HG', 'MG', 'RG', 'PG', 'TOP RATED'] as const;
type Filter = (typeof FILTERS)[number];

function gradePipColor(grade: string) {
  const up = grade.toUpperCase();
  if (up === 'MG') return { color: C.accent, border: C.borderGold };
  if (up === 'RG') return { color: '#7FA4FF', border: 'rgba(41,82,204,0.4)' };
  if (up === 'PG') return { color: '#F0997B', border: 'rgba(240,153,123,0.4)' };
  return { color: C.textMid, border: C.borderMid };
}

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

export default function Feed() {
  const { profile, session } = useAuth();
  const [feed, setFeed] = useState<BuildSummary[]>([]);
  const [champion, setChampion] = useState<BuildSummary | null>(null);
  const [myCount, setMyCount] = useState(0);
  const [myAvg, setMyAvg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('ALL');

  const load = useCallback(async () => {
    try {
      const [f, t, mine] = await Promise.all([
        fetchFeed(),
        fetchTopThisWeek(),
        session ? fetchMyBuilds(session.user.id) : Promise.resolve([]),
      ]);
      setFeed(f);
      setChampion(t[0] ?? null);
      setMyCount(mine.length);
      setMyAvg(mine.length ? Math.round(mine.reduce((s, b) => s + b.score, 0) / mine.length) : 0);
    } catch (e) {
      console.warn('feed load failed', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const filtered = feed.filter((b) => {
    if (filter === 'ALL' || filter === 'FOLLOWING') return true;
    if (filter === 'TOP RATED') return b.score >= 85;
    return b.grade?.toUpperCase() === filter;
  });

  const initials = (profile?.handle ?? profile?.display_name ?? '?').slice(0, 2).toUpperCase();

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
          <View style={styles.headerLeft}>
            <Text style={styles.logo}>HANGER</Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable style={styles.iconBtn}>
              <Svg width={16} height={16} viewBox="0 0 16 16">
                <Path
                  d="M3 6.5C3 4.0147 5.0147 2 7.5 2H8.5C10.9853 2 13 4.0147 13 6.5V9.5L14 11H2L3 9.5V6.5Z"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth={1.2}
                />
                <Path
                  d="M6.5 13C6.5 13.8284 7.1716 14.5 8 14.5C8.8284 14.5 9.5 13.8284 9.5 13"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth={1.2}
                />
              </Svg>
              <View style={styles.badgeDot} />
            </Pressable>
            <Pressable style={styles.avatar} onPress={() => router.push('/(tabs)/profile')}>
              <Text style={styles.avatarText}>{initials}</Text>
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={C.accent} />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(b) => b.id}
            contentContainerStyle={{ paddingBottom: 24 }}
            refreshControl={
              <RefreshControl
                tintColor={C.accent}
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  load();
                }}
              />
            }
            ListHeaderComponent={
              <View>
                <View style={styles.statsStrip}>
                  <View style={styles.statCell}>
                    <Text style={styles.statNum}>{myCount}</Text>
                    <Text style={styles.statLabel}>YOUR KITS</Text>
                  </View>
                  <View style={styles.statCell}>
                    <Text style={[styles.statNum, { color: C.accent }]}>{myAvg || '—'}</Text>
                    <Text style={styles.statLabel}>AVG SCORE</Text>
                  </View>
                  <View style={styles.statCell}>
                    <Text style={styles.statNum}>—</Text>
                    <Text style={styles.statLabel}>GLOBAL RANK</Text>
                  </View>
                </View>

                <View style={styles.section}>
                  <View style={styles.sectionHead}>
                    <Text style={styles.sectionTitle}>
                      THIS WEEK'S <Text style={{ color: C.accent }}>CHAMPION</Text>
                    </Text>
                    <Text style={styles.sectionMore}>VIEW ALL ↗</Text>
                  </View>

                  {champion ? (
                    <Pressable style={styles.featured} onPress={() => router.push(`/build/${champion.id}`)}>
                      <View style={styles.featuredGlow} pointerEvents="none" />
                      <View style={styles.crownBadge}>
                        <Svg width={11} height={11} viewBox="0 0 16 16">
                          <Path d="M2 5L5 8L8 3L11 8L14 5V12H2V5Z M2 13H14V14H2V13Z" fill={C.goldLight} />
                        </Svg>
                        <Text style={styles.crownBadgeText}>WEEKLY #1</Text>
                      </View>
                      <Text style={styles.featuredRank}>01</Text>
                      <View style={styles.featuredImg}>
                        {champion.photo_url ? (
                          <Image source={{ uri: champion.photo_url }} style={{ width: '100%', height: '100%' }} />
                        ) : (
                          <Text style={{ fontSize: 36 }}>🤖</Text>
                        )}
                      </View>
                      <View style={styles.featuredInfo}>
                        <Text style={styles.featuredName} numberOfLines={1}>
                          {champion.kit_name}
                        </Text>
                        <Text style={styles.featuredMeta}>
                          {champion.builder_handle ? `@${champion.builder_handle}` : 'Anonymous'} · {champion.grade} ·{' '}
                          {timeAgo(champion.created_at)}
                        </Text>
                        <View style={styles.featuredBottom}>
                          <View>
                            <Text style={styles.featuredScore}>{champion.score}</Text>
                            <Text style={styles.featuredScoreLabel}>PILOT SCORE</Text>
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  ) : (
                    <View style={[styles.featured, styles.featuredEmpty]}>
                      <Text style={styles.emptyText}>
                        No champion yet this week.{'\n'}Submit a build to be the first.
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.section}>
                  <View style={styles.sectionHead}>
                    <Text style={styles.sectionTitle}>
                      RECENT <Text style={{ color: C.accent }}>BUILDS</Text>
                    </Text>
                    <Text style={styles.sectionMore}>FILTER ↗</Text>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 14 }}
                    contentContainerStyle={{ gap: 8, paddingRight: 20 }}
                  >
                    {FILTERS.map((f) => (
                      <Pressable
                        key={f}
                        style={[styles.filterPill, filter === f && styles.filterPillActive]}
                        onPress={() => setFilter(f)}
                      >
                        <Text style={[styles.filterPillText, filter === f && styles.filterPillTextActive]}>{f}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              </View>
            }
            renderItem={({ item, index }) => <FeedCard build={item} index={index} />}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>
                  No builds yet.{'\n'}Tap JUDGE to submit your first.
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

function FeedCard({ build, index }: { build: BuildSummary; index: number }) {
  const op = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, { toValue: 1, duration: 360, delay: 50 * index, useNativeDriver: true }),
      Animated.timing(ty, { toValue: 0, duration: 360, delay: 50 * index, useNativeDriver: true }),
    ]).start();
  }, []);
  const pip = gradePipColor(build.grade);

  return (
    <Animated.View style={{ opacity: op, transform: [{ translateY: ty }], paddingHorizontal: 20 }}>
      <Pressable style={styles.feedCard} onPress={() => router.push(`/build/${build.id}`)}>
        <View style={styles.feedImg}>
          {build.photo_url ? (
            <Image source={{ uri: build.photo_url }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <Text style={{ fontSize: 26 }}>🤖</Text>
          )}
          <View style={[styles.gradePip, { borderColor: pip.border }]}>
            <Text style={[styles.gradePipText, { color: pip.color }]}>{build.grade.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.feedInfo}>
          <Text style={styles.feedName} numberOfLines={1}>
            {build.kit_name}
          </Text>
          <View style={styles.feedMeta}>
            <Text style={styles.feedUser}>{build.builder_handle ? `@${build.builder_handle}` : 'Anonymous'}</Text>
            <View style={styles.metaDot} />
            <Text style={{ color: C.textDim, fontSize: 11 }}>{timeAgo(build.created_at)}</Text>
          </View>
        </View>
        <View style={styles.feedRight}>
          <Text style={styles.feedScore}>{build.score}</Text>
        </View>
      </Pressable>
      <View style={{ height: 10 }} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { fontFamily: 'BebasNeue_400Regular', fontSize: 26, letterSpacing: 4, color: C.accent, lineHeight: 26 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.live, shadowColor: C.live, shadowOpacity: 0.6, shadowRadius: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.borderMid,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute', top: 7, right: 7,
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: C.accent, borderWidth: 1, borderColor: C.bg,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.royalBright,
    borderWidth: 1.5, borderColor: C.accentRing,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: 'BebasNeue_400Regular', fontSize: 13, letterSpacing: 1, color: C.goldLight },

  statsStrip: {
    flexDirection: 'row',
    backgroundColor: C.border,
    gap: 1,
  },
  statCell: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, backgroundColor: C.bg, alignItems: 'center' },
  statNum: { fontFamily: 'BebasNeue_400Regular', fontSize: 22, letterSpacing: 1.5, color: C.white, lineHeight: 22 },
  statLabel: { fontSize: 9, letterSpacing: 2, color: C.textDim, marginTop: 4, fontFamily: 'DMSans_500Medium' },

  section: { paddingHorizontal: 20, paddingTop: 24 },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontSize: 11, letterSpacing: 3, color: C.textMid, fontFamily: 'DMSans_500Medium' },
  sectionMore: { fontSize: 11, letterSpacing: 1.5, color: C.accent, fontFamily: 'DMSans_500Medium' },

  featured: {
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.borderGold,
    borderRadius: 18, padding: 18,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    overflow: 'hidden', position: 'relative',
  },
  featuredEmpty: { justifyContent: 'center', paddingVertical: 28 },
  featuredGlow: {
    position: 'absolute', top: 0, right: 0,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(201,168,76,0.10)',
  },
  crownBadge: {
    position: 'absolute', top: 14, right: 14,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderWidth: 1, borderColor: C.borderGold,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    zIndex: 1,
  },
  crownBadgeText: { fontFamily: 'BebasNeue_400Regular', fontSize: 10, letterSpacing: 1.5, color: C.goldLight },
  featuredRank: { fontFamily: 'BebasNeue_400Regular', fontSize: 52, color: 'rgba(201,168,76,0.18)', width: 44, lineHeight: 52 },
  featuredImg: {
    width: 72, height: 72, borderRadius: 14,
    backgroundColor: C.surface3,
    borderWidth: 1, borderColor: C.borderMid,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  featuredInfo: { flex: 1, minWidth: 0, paddingRight: 60 },
  featuredName: { fontSize: 15, color: C.white, fontFamily: 'DMSans_500Medium', marginBottom: 4 },
  featuredMeta: { fontSize: 11, color: C.textDim, marginBottom: 8, fontFamily: 'DMSans_300Light' },
  featuredBottom: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featuredScore: { fontFamily: 'BebasNeue_400Regular', fontSize: 28, color: C.accent, letterSpacing: 1.5, lineHeight: 28 },
  featuredScoreLabel: { fontSize: 8, letterSpacing: 1.5, color: C.textDim, marginTop: 2, fontFamily: 'DMSans_500Medium' },

  filterPill: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: C.borderMid,
  },
  filterPillActive: { backgroundColor: C.accent, borderColor: C.accent },
  filterPillText: { fontSize: 11, color: C.textMid, fontFamily: 'DMSans_500Medium', letterSpacing: 1 },
  filterPillTextActive: { color: '#0A0F1E' },

  feedCard: {
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.border,
    borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  feedImg: {
    width: 58, height: 58, borderRadius: 12,
    backgroundColor: C.surface3,
    borderWidth: 1, borderColor: C.borderMid,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative', overflow: 'visible',
  },
  gradePip: {
    position: 'absolute', bottom: -6, alignSelf: 'center',
    paddingHorizontal: 6, paddingVertical: 1,
    borderRadius: 4, borderWidth: 1,
    backgroundColor: C.bg,
  },
  gradePipText: { fontFamily: 'BebasNeue_400Regular', fontSize: 9, letterSpacing: 1 },
  feedInfo: { flex: 1, minWidth: 0 },
  feedName: { fontSize: 14, color: C.white, fontFamily: 'DMSans_500Medium', marginBottom: 3 },
  feedMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  feedUser: { color: C.textMid, fontSize: 11, fontFamily: 'DMSans_400Regular' },
  metaDot: { width: 2, height: 2, borderRadius: 1, backgroundColor: C.textFaint },
  feedRight: { alignItems: 'flex-end' },
  feedScore: { fontFamily: 'BebasNeue_400Regular', fontSize: 24, color: C.accent, letterSpacing: 1, lineHeight: 24 },

  emptyWrap: { padding: 40, alignItems: 'center' },
  emptyText: { color: C.textDim, textAlign: 'center', fontFamily: 'DMSans_300Light', fontSize: 13, lineHeight: 20 },
});
