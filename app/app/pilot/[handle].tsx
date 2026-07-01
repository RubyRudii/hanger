import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Line, Path, Pattern, Rect } from 'react-native-svg';
import { fetchMyBuilds } from '@/api/builds';
import { followUser, isFollowing, unfollowUser } from '@/api/follows';
import { fetchProfileByHandle, PublicProfile } from '@/api/profile';
import { BuildSummary } from '@/components/BuildCard';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Palette } from '@/lib/theme';

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
  return `${Math.floor(d / 2592000)}mo`;
}

function gradePipColor(grade: string, C: Palette) {
  const up = grade.toUpperCase();
  if (up === 'MG') return { color: C.accent, border: C.borderGold };
  if (up === 'RG') return { color: C.blueHud, border: 'rgba(41,82,204,0.4)' };
  if (up === 'PG') return { color: '#F0997B', border: 'rgba(240,153,123,0.4)' };
  return { color: C.textMid, border: C.borderMid };
}

export default function PilotView() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const { session } = useAuth();
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [builds, setBuilds] = useState<BuildSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [following, setFollowing] = useState(false);
  const [togglingFollow, setTogglingFollow] = useState(false);

  useEffect(() => {
    if (!handle) return;
    (async () => {
      try {
        const p = await fetchProfileByHandle(handle);
        if (!p) {
          setNotFound(true);
          return;
        }
        setProfile(p);
        const [b, isFollow] = await Promise.all([
          fetchMyBuilds(p.id),
          session && session.user.id !== p.id
            ? isFollowing(session.user.id, p.id)
            : Promise.resolve(false),
        ]);
        setBuilds(b);
        setFollowing(isFollow);
      } catch (e: any) {
        console.warn('pilot load failed', e?.message ?? e);
      } finally {
        setLoading(false);
      }
    })();
  }, [handle, session?.user.id]);

  async function onToggleFollow() {
    if (!session || !profile || session.user.id === profile.id) return;
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    setProfile((prev) =>
      prev ? { ...prev, follower_count: Math.max(0, prev.follower_count + (wasFollowing ? -1 : 1)) } : prev,
    );
    setTogglingFollow(true);
    try {
      if (wasFollowing) await unfollowUser(session.user.id, profile.id);
      else await followUser(session.user.id, profile.id);
    } catch (e: any) {
      // Roll back
      setFollowing(wasFollowing);
      setProfile((prev) =>
        prev ? { ...prev, follower_count: Math.max(0, prev.follower_count + (wasFollowing ? 1 : -1)) } : prev,
      );
    } finally {
      setTogglingFollow(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={C.accent} />
        </SafeAreaView>
      </View>
    );
  }

  if (notFound || !profile) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={styles.header}>
            <Pressable style={styles.iconBtn} onPress={() => router.back()}>
              <Svg width={14} height={14} viewBox="0 0 14 14">
                <Path d="M9 11L5 7L9 3" stroke={C.textMid} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </Pressable>
            <Text style={styles.headerTitle}>NOT FOUND</Text>
            <View style={{ width: 36 }} />
          </View>
          <View style={styles.notFound}>
            <Text style={styles.notFoundTitle}>PILOT UNKNOWN</Text>
            <Text style={styles.notFoundBody}>@{handle} isn't a registered pilot.</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const kits = builds.length;
  const avg = kits ? Math.round(builds.reduce((s, b) => s + b.score, 0) / kits) : 0;
  const totalXp = builds.reduce((s, b) => s + b.score * 10, 0);
  const { current: rank, next: nextRank } = rankOf(totalXp);
  const rankBase = rank.min;
  const rankSpan = Math.max(nextRank.min - rankBase, 1);
  const rankPct = Math.min(100, Math.round(((totalXp - rankBase) / rankSpan) * 100));
  const initials = (profile.handle ?? profile.display_name ?? '??').slice(0, 2).toUpperCase();
  const pilotId = `${initials}-${new Date().getFullYear()}-${profile.id.slice(0, 4).toUpperCase()}`;

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
          <Pressable style={styles.iconBtn} onPress={() => router.back()}>
            <Svg width={14} height={14} viewBox="0 0 14 14">
              <Path d="M9 11L5 7L9 3" stroke={C.textMid} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
          <Text style={styles.headerTitle}>PILOT PROFILE</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
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
                  {profile.avatar_url ? (
                    <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
                  ) : (
                    <Text style={styles.avatarText}>{initials}</Text>
                  )}
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankBadgeText}>{rank.short}</Text>
                  </View>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pilotName}>{profile.display_name ?? profile.handle ?? 'Builder'}</Text>
                <Text style={styles.pilotCallsign}>// @{profile.handle ?? 'unknown'}</Text>
                <View style={styles.rankLine}>
                  <Svg width={9} height={9} viewBox="0 0 14 14">
                    <Path d="M7 1L8.5 5L13 5L9.5 7.5L11 12L7 9.5L3 12L4.5 7.5L1 5L5.5 5L7 1Z" fill={C.accent} />
                  </Svg>
                  <Text style={styles.rankLineText}>{rank.name}</Text>
                </View>
              </View>
            </View>

            {profile.bio ? (
              <View style={styles.bio}>
                <Text style={styles.bioText}>{profile.bio}</Text>
              </View>
            ) : null}

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
                <Text style={styles.statNum}>{profile.follower_count}</Text>
                <Text style={styles.statLabel}>FOLLOWERS</Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statNum}>{profile.following_count}</Text>
                <Text style={styles.statLabel}>FOLLOWING</Text>
              </View>
            </View>

            {session && session.user.id !== profile.id ? (
              <Pressable
                style={[styles.followBtn, following && styles.followBtnActive, togglingFollow && { opacity: 0.6 }]}
                onPress={onToggleFollow}
                disabled={togglingFollow}
              >
                <Text style={[styles.followBtnText, following && styles.followBtnTextActive]}>
                  {following ? 'FOLLOWING' : '+ FOLLOW'}
                </Text>
              </Pressable>
            ) : null}
          </View>

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
          </View>

          <View style={styles.tabSection}>
            <View style={styles.eyebrowRow}>
              <View style={styles.eyebrowDash} />
              <Text style={styles.sectionEyebrow}>HANGAR · {builds.length} BUILDS</Text>
            </View>

            {builds.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No builds filed yet.</Text>
              </View>
            ) : (
              <View style={styles.shelfGrid}>
                {builds.map((b) => {
                  const pip = gradePipColor(b.grade, C);
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
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(C: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: {
      paddingHorizontal: 20, paddingVertical: 14,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      borderBottomWidth: 1, borderBottomColor: C.border,
    },
    headerTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 18, letterSpacing: 3, color: C.text },
    iconBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: C.surface, borderWidth: 1, borderColor: C.borderMid,
      alignItems: 'center', justifyContent: 'center',
    },

    notFound: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 60, gap: 8 },
    notFoundTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 22, letterSpacing: 3, color: C.textMid },
    notFoundBody: { fontSize: 13, color: C.textDim, fontFamily: 'DMSans_300Light', textAlign: 'center' },

    pilotCard: {
      marginHorizontal: 20, marginTop: 20,
      backgroundColor: C.surface,
      borderWidth: 1, borderColor: C.borderGold, borderRadius: 20,
      padding: 18, overflow: 'hidden', position: 'relative',
    },
    pilotCardGlow: { position: 'absolute', top: -80, right: -60, width: 280, height: 280, borderRadius: 140, backgroundColor: C.orbHalo },
    watermark: {
      position: 'absolute', bottom: 12, right: 14,
      fontFamily: 'BebasNeue_400Regular', fontSize: 56, letterSpacing: 4,
      color: C.accentSoft, lineHeight: 56,
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
      position: 'relative', overflow: 'hidden',
    },
    avatarImg: { width: '100%', height: '100%' },
    avatarText: { fontFamily: 'BebasNeue_400Regular', fontSize: 30, letterSpacing: 2, color: C.goldLight },
    rankBadge: {
      position: 'absolute', bottom: -6, right: -8,
      backgroundColor: C.accent,
      paddingHorizontal: 6, paddingVertical: 3, borderRadius: 3,
      borderWidth: 1.5, borderColor: C.bg,
    },
    rankBadgeText: { fontFamily: 'BebasNeue_400Regular', fontSize: 9, letterSpacing: 0.5, color: C.onAccent },
    pilotName: { fontSize: 18, color: C.text, fontFamily: 'DMSans_500Medium', marginBottom: 3 },
    pilotCallsign: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: C.textMid, letterSpacing: 1, marginBottom: 8 },
    rankLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    rankLineText: { fontSize: 11, color: C.accent, fontFamily: 'DMSans_500Medium', letterSpacing: 1 },
    bio: {
      paddingVertical: 12, paddingHorizontal: 14,
      backgroundColor: C.surface2,
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
    statNum: { fontFamily: 'BebasNeue_400Regular', fontSize: 20, letterSpacing: 1, color: C.text, lineHeight: 22 },
    statLabel: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, letterSpacing: 1.5, color: C.textDim, marginTop: 5 },

    followBtn: {
      marginTop: 14,
      backgroundColor: C.accent,
      borderRadius: 12,
      paddingVertical: 12, alignItems: 'center',
      borderWidth: 1, borderColor: C.accent,
    },
    followBtnActive: { backgroundColor: 'transparent', borderColor: C.borderGold },
    followBtnText: { fontFamily: 'DMSans_500Medium', fontSize: 12, letterSpacing: 2, color: C.onAccent },
    followBtnTextActive: { color: C.goldLight },

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
    rankText: { fontFamily: 'BebasNeue_400Regular', fontSize: 14, letterSpacing: 1.5, color: C.text },
    rankXp: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, color: C.accent },
    rankBar: { width: '100%', height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' },
    rankBarFill: { height: '100%', backgroundColor: C.accent, borderRadius: 3 },

    tabSection: { paddingHorizontal: 20, paddingTop: 24 },
    eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    eyebrowDash: { width: 14, height: 1, backgroundColor: C.accent },
    sectionEyebrow: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, letterSpacing: 2, color: C.accent },

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
      backgroundColor: C.bg,
      borderWidth: 1, borderRadius: 3,
    },
    kitGradePipText: { fontFamily: 'BebasNeue_400Regular', fontSize: 9, letterSpacing: 1 },
    kitScoreBadge: {
      position: 'absolute', top: 8, right: 8,
      backgroundColor: C.bg,
      borderWidth: 1, borderColor: C.borderGold, borderRadius: 4,
      paddingHorizontal: 6, paddingVertical: 2,
    },
    kitScoreBadgeText: { fontFamily: 'BebasNeue_400Regular', fontSize: 13, letterSpacing: 1, color: C.goldLight },
    kitInfo: { paddingHorizontal: 12, paddingVertical: 10 },
    kitName: { fontSize: 12, color: C.text, fontFamily: 'DMSans_500Medium', marginBottom: 3 },
    kitMeta: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 9, color: C.textDim, letterSpacing: 0.5 },

    empty: { paddingVertical: 20, alignItems: 'center' },
    emptyText: { color: C.textDim, fontFamily: 'DMSans_300Light', fontSize: 13 },
  });
}
