import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import Svg, { Defs, Line, Path, Pattern, Rect } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchFeed, fetchMyBuilds, fetchTopThisWeek } from '@/api/builds';
import { fetchMyFollowingIds } from '@/api/follows';
import { fetchMyLikedBuildIds, likeBuild, unlikeBuild } from '@/api/likes';
import { listBlockedIds } from '@/api/moderation';
import { BuildSummary } from '@/components/BuildCard';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Palette } from '@/lib/theme';

const FILTERS = ['ALL', 'FOLLOWING', 'HG', 'MG', 'RG', 'PG', 'TOP RATED'] as const;
type Filter = (typeof FILTERS)[number];

function gradePipColor(grade: string, C: Palette) {
  const up = grade.toUpperCase();
  if (up === 'MG') return { color: C.accent, border: C.borderGold };
  if (up === 'RG') return { color: C.blueHud, border: 'rgba(41,82,204,0.4)' };
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
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [feed, setFeed] = useState<BuildSummary[]>([]);
  const [champion, setChampion] = useState<BuildSummary | null>(null);
  const [myCount, setMyCount] = useState(0);
  const [myAvg, setMyAvg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const [f, t, mine, liked, following, blocked] = await Promise.all([
        fetchFeed(),
        fetchTopThisWeek(),
        session ? fetchMyBuilds(session.user.id) : Promise.resolve([]),
        session ? fetchMyLikedBuildIds(session.user.id) : Promise.resolve(new Set<string>()),
        session ? fetchMyFollowingIds(session.user.id) : Promise.resolve(new Set<string>()),
        session ? listBlockedIds(session.user.id) : Promise.resolve(new Set<string>()),
      ]);
      const notBlocked = (b: BuildSummary) => !blocked.has(b.user_id);
      setFeed(f.filter(notBlocked));
      setChampion(t.find(notBlocked) ?? null);
      setMyCount(mine.length);
      setMyAvg(mine.length ? Math.round(mine.reduce((s, b) => s + b.score, 0) / mine.length) : 0);
      setLikedIds(liked);
      setFollowingIds(following);
      setBlockedIds(blocked);
    } catch (e) {
      console.warn('feed load failed', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  async function onToggleLike(build: BuildSummary) {
    if (!session) return;
    const liked = likedIds.has(build.id);
    // Optimistic update
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (liked) next.delete(build.id);
      else next.add(build.id);
      return next;
    });
    const bump = (target: BuildSummary | null) =>
      target && target.id === build.id
        ? { ...target, like_count: Math.max(0, target.like_count + (liked ? -1 : 1)) }
        : target;
    setFeed((prev) => prev.map((b) => bump(b) ?? b));
    setChampion((prev) => bump(prev));
    try {
      if (liked) await unlikeBuild(session.user.id, build.id);
      else await likeBuild(session.user.id, build.id);
    } catch (e: any) {
      // Roll back on error
      console.warn('toggle like failed', e?.message ?? e);
      load();
    }
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const filtered = feed.filter((b) => {
    if (filter === 'ALL') return true;
    if (filter === 'FOLLOWING') return followingIds.has(b.user_id);
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
              <Line x1="0" y1="0" x2="32" y2="0" stroke={C.gridLine} strokeWidth={1} />
              <Line x1="0" y1="0" x2="0" y2="32" stroke={C.gridLine} strokeWidth={1} />
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
                  stroke={C.textMid}
                  strokeWidth={1.2}
                />
                <Path
                  d="M6.5 13C6.5 13.8284 7.1716 14.5 8 14.5C8.8284 14.5 9.5 13.8284 9.5 13"
                  stroke={C.textMid}
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
                      <Text style={styles.featuredRank}>01</Text>
                      <View style={styles.featuredImg}>
                        {champion.photo_url ? (
                          <Image source={{ uri: champion.photo_url }} style={{ width: '100%', height: '100%' }} />
                        ) : (
                          <Text style={{ fontSize: 36 }}>🤖</Text>
                        )}
                      </View>
                      <View style={styles.featuredInfo}>
                        <View style={styles.crownBadge}>
                          <Svg width={11} height={11} viewBox="0 0 16 16">
                            <Path d="M2 5L5 8L8 3L11 8L14 5V12H2V5Z M2 13H14V14H2V13Z" fill="#D4A63C" />
                          </Svg>
                          <Text style={styles.crownBadgeText}>WEEKLY #1</Text>
                        </View>
                        <Text style={styles.featuredName} numberOfLines={1}>
                          {champion.kit_name}
                        </Text>
                        <Text style={styles.featuredMeta}>
                          <Text
                            onPress={() =>
                              champion.builder_handle && router.push(`/pilot/${champion.builder_handle}`)
                            }
                            style={{ color: champion.builder_handle ? C.textMid : C.textDim }}
                          >
                            {champion.builder_handle ? `@${champion.builder_handle}` : 'Anonymous'}
                          </Text>
                          {' · '}
                          {champion.grade} · {timeAgo(champion.created_at)}
                        </Text>
                        <View style={styles.featuredBottom}>
                          <View>
                            <Text style={styles.featuredScore}>{champion.score}</Text>
                            <Text style={styles.featuredScoreLabel}>PILOT SCORE</Text>
                          </View>
                          <Pressable hitSlop={6} onPress={() => onToggleLike(champion)} style={styles.likeBtn}>
                            <Heart filled={likedIds.has(champion.id)} color={likedIds.has(champion.id) ? C.like : C.textMid} />
                            <Text style={[styles.likeCount, likedIds.has(champion.id) && { color: C.like }]}>
                              {champion.like_count}
                            </Text>
                          </Pressable>
                          <View style={styles.commentStat}>
                            <SpeechBubble color={C.textMid} />
                            <Text style={styles.likeCount}>{champion.comment_count}</Text>
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  ) : (
                    <View style={[styles.featured, styles.featuredEmpty]}>
                      <EmptyState
                        compact
                        icon={
                          <Svg width={38} height={38} viewBox="0 0 16 16">
                            <Path
                              d="M2 5L5 8L8 3L11 8L14 5V12H2V5Z M2 13H14V14H2V13Z"
                              fill="#E63946"
                            />
                          </Svg>
                        }
                        title="NO CHAMPION YET"
                        body="First build submitted this week takes the crown."
                        ctaLabel="SUBMIT A BUILD"
                        onCta={() => router.push('/(tabs)/judge')}
                      />
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
            renderItem={({ item, index }) => (
              <FeedCard
                build={item}
                index={index}
                liked={likedIds.has(item.id)}
                onToggleLike={() => onToggleLike(item)}
              />
            )}
            ListEmptyComponent={
              filter === 'FOLLOWING' && followingIds.size === 0 ? (
                <EmptyState
                  icon={<Text style={{ fontSize: 30 }}>👥</Text>}
                  title="NOT FOLLOWING ANYONE"
                  body="Tap an @handle on any build to visit a pilot and follow them."
                  ctaLabel="BROWSE ALL BUILDS"
                  onCta={() => setFilter('ALL')}
                />
              ) : filter === 'FOLLOWING' ? (
                <EmptyState
                  icon={<Text style={{ fontSize: 30 }}>📡</Text>}
                  title="QUIET IN HERE"
                  body="None of the pilots you follow have filed a build yet."
                  ctaLabel="BROWSE ALL"
                  onCta={() => setFilter('ALL')}
                />
              ) : filter === 'ALL' ? (
                <EmptyState
                  icon={<Text style={{ fontSize: 32 }}>🚀</Text>}
                  title="THE FEED AWAITS"
                  body="Be the first pilot to file a build. Submit for review and land on the community feed."
                  ctaLabel="OPEN JUDGE"
                  onCta={() => router.push('/(tabs)/judge')}
                />
              ) : (
                <EmptyState
                  icon={<Text style={{ fontSize: 30 }}>🔍</Text>}
                  title="NO MATCHES"
                  body={`Nothing on the feed matches “${filter}” yet.`}
                  ctaLabel="SHOW ALL"
                  onCta={() => setFilter('ALL')}
                />
              )
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

function FeedCard({
  build,
  index,
  liked,
  onToggleLike,
}: {
  build: BuildSummary;
  index: number;
  liked: boolean;
  onToggleLike: () => void;
}) {
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const op = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(12)).current;
  const lastTap = useRef(0);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, { toValue: 1, duration: 360, delay: 50 * index, useNativeDriver: true }),
      Animated.timing(ty, { toValue: 0, duration: 360, delay: 50 * index, useNativeDriver: true }),
    ]).start();
  }, []);

  function handlePress() {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      // Double tap → like (Instagram-style: only adds a like, never unlikes)
      lastTap.current = 0;
      if (!liked) {
        onToggleLike();
      }
      pulse.setValue(0);
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 420, delay: 100, useNativeDriver: true }),
      ]).start();
    } else {
      lastTap.current = now;
      setTimeout(() => {
        if (lastTap.current === now) router.push(`/build/${build.id}`);
      }, 280);
    }
  }

  const pip = gradePipColor(build.grade, C);
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.2] });

  return (
    <Animated.View style={{ opacity: op, transform: [{ translateY: ty }], paddingHorizontal: 20 }}>
      <Pressable style={styles.feedCard} onPress={handlePress}>
        <View style={styles.feedImg}>
          {build.photo_url ? (
            <Image source={{ uri: build.photo_url }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <Text style={{ fontSize: 26 }}>🤖</Text>
          )}
          <View style={[styles.gradePip, { borderColor: pip.border }]}>
            <Text style={[styles.gradePipText, { color: pip.color }]}>{build.grade.toUpperCase()}</Text>
          </View>
          <Animated.View
            pointerEvents="none"
            style={[styles.heartPulse, { opacity: pulse, transform: [{ scale: pulseScale }] }]}
          >
            <Heart filled color={C.like} size={36} />
          </Animated.View>
        </View>
        <View style={styles.feedInfo}>
          <Text style={styles.feedName} numberOfLines={1}>
            {build.kit_name}
          </Text>
          <View style={styles.feedMeta}>
            <Pressable
              onPress={() => build.builder_handle && router.push(`/pilot/${build.builder_handle}`)}
              disabled={!build.builder_handle}
              hitSlop={4}
            >
              <Text style={styles.feedUser}>{build.builder_handle ? `@${build.builder_handle}` : 'Anonymous'}</Text>
            </Pressable>
            <View style={styles.metaDot} />
            <Text style={{ color: C.textDim, fontSize: 13 }}>{timeAgo(build.created_at)}</Text>
          </View>
          <View style={styles.feedLikeRow}>
            <Pressable hitSlop={6} onPress={onToggleLike} style={styles.likeBtn}>
              <Heart filled={liked} color={liked ? C.like : C.textDim} />
              <Text style={[styles.likeCount, liked && { color: C.like }]}>{build.like_count}</Text>
            </Pressable>
            <View style={styles.commentStat}>
              <SpeechBubble color={C.textDim} />
              <Text style={styles.likeCount}>{build.comment_count}</Text>
            </View>
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

function Heart({ filled, color, size = 20 }: { filled: boolean; color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path
        d="M8 14s-5.5-3.5-5.5-7.5C2.5 4.5 4 3 6 3c1.2 0 2.2.6 2.5 1 .3-.4 1.3-1 2.5-1 2 0 3.5 1.5 3.5 3.5C13.5 10.5 8 14 8 14z"
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SpeechBubble({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path
        d="M2.5 3.5h11c.55 0 1 .45 1 1v6c0 .55-.45 1-1 1H8l-3 2.5v-2.5H2.5c-.55 0-1-.45-1-1v-6c0-.55.45-1 1-1z"
        stroke={color}
        strokeWidth={1.3}
        fill="none"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function makeStyles(C: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    header: {
      paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      borderBottomWidth: 1, borderBottomColor: C.border,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    logo: { fontFamily: 'BebasNeue_400Regular', fontSize: 26, letterSpacing: 4, color: C.accent, lineHeight: 26 },
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
    avatarText: { fontFamily: 'BebasNeue_400Regular', fontSize: 15, letterSpacing: 1, color: C.goldLight },

    statsStrip: {
      flexDirection: 'row',
      backgroundColor: C.border,
      gap: 1,
    },
    statCell: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, backgroundColor: C.bg, alignItems: 'center' },
    statNum: { fontFamily: 'BebasNeue_400Regular', fontSize: 22, letterSpacing: 1.5, color: C.text, lineHeight: 22 },
    statLabel: { fontSize: 10, letterSpacing: 0.8, color: C.textDim, marginTop: 4, fontFamily: 'DMSans_500Medium' },

    section: { paddingHorizontal: 20, paddingTop: 24 },
    sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 },
    sectionTitle: { fontSize: 13, letterSpacing: 3, color: C.textMid, fontFamily: 'DMSans_500Medium' },
    sectionMore: { fontSize: 13, letterSpacing: 1.5, color: C.accent, fontFamily: 'DMSans_500Medium' },

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
      backgroundColor: C.orbHalo,
    },
    crownBadge: {
      alignSelf: 'flex-start',
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: 'rgba(212, 166, 60, 0.15)',
      borderWidth: 1, borderColor: 'rgba(212, 166, 60, 0.55)',
      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
      marginBottom: 6,
    },
    crownBadgeText: { fontFamily: 'BebasNeue_400Regular', fontSize: 11, letterSpacing: 1.5, color: '#B58B24' },
    featuredRank: { fontFamily: 'BebasNeue_400Regular', fontSize: 52, color: C.accentDim, width: 44, lineHeight: 52 },
    featuredImg: {
      width: 72, height: 72, borderRadius: 14,
      backgroundColor: C.surface3,
      borderWidth: 1, borderColor: C.borderMid,
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    },
    featuredInfo: { flex: 1, minWidth: 0 },
    featuredName: { fontSize: 17, color: C.text, fontFamily: 'DMSans_500Medium', marginBottom: 4 },
    featuredMeta: { fontSize: 13, color: C.textDim, marginBottom: 8, fontFamily: 'DMSans_300Light' },
    featuredBottom: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    featuredScore: { fontFamily: 'BebasNeue_400Regular', fontSize: 28, color: C.accent, letterSpacing: 1.5, lineHeight: 28 },
    featuredScoreLabel: { fontSize: 11, letterSpacing: 1.5, color: C.textDim, marginTop: 2, fontFamily: 'DMSans_500Medium' },

    filterPill: {
      paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
      borderWidth: 1, borderColor: C.borderMid,
    },
    filterPillActive: { backgroundColor: C.accent, borderColor: C.accent },
    filterPillText: { fontSize: 13, color: C.textMid, fontFamily: 'DMSans_500Medium', letterSpacing: 1 },
    filterPillTextActive: { color: C.onAccent },

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
    gradePipText: { fontFamily: 'BebasNeue_400Regular', fontSize: 11, letterSpacing: 1 },
    feedInfo: { flex: 1, minWidth: 0 },
    feedName: { fontSize: 16, color: C.text, fontFamily: 'DMSans_500Medium', marginBottom: 3 },
    feedMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    feedUser: { color: C.textMid, fontSize: 13, fontFamily: 'DMSans_400Regular' },
    metaDot: { width: 2, height: 2, borderRadius: 1, backgroundColor: C.textFaint },
    feedRight: { alignItems: 'flex-end' },
    feedScore: { fontFamily: 'BebasNeue_400Regular', fontSize: 24, color: C.accent, letterSpacing: 1, lineHeight: 24 },
    feedLikeRow: { flexDirection: 'row', marginTop: 6, alignItems: 'center', gap: 4 },
    likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2, paddingRight: 6 },
    commentStat: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2, paddingRight: 6 },
    likeCount: { fontSize: 14, color: C.textDim, fontFamily: 'JetBrainsMono_400Regular' },
    heartPulse: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      alignItems: 'center', justifyContent: 'center',
    },

    emptyWrap: { padding: 40, alignItems: 'center' },
    emptyText: { color: C.textDim, textAlign: 'center', fontFamily: 'DMSans_300Light', fontSize: 15, lineHeight: 20 },
  });
}
