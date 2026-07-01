import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Line, Path, Pattern, Rect } from 'react-native-svg';
import {
  fetchFollowers,
  fetchFollowing,
  fetchMyFollowingIds,
  followUser,
  FollowUser,
  unfollowUser,
} from '@/api/follows';
import { fetchProfileByHandle } from '@/api/profile';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Palette } from '@/lib/theme';

type Tab = 'FOLLOWERS' | 'FOLLOWING';

export default function FollowsList() {
  const { handle, tab: initialTab } = useLocalSearchParams<{ handle: string; tab?: string }>();
  const { session } = useAuth();
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [tab, setTab] = useState<Tab>(initialTab === 'following' ? 'FOLLOWING' : 'FOLLOWERS');
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [subjectId, setSubjectId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!handle) return;
    setLoading(true);
    try {
      const p = await fetchProfileByHandle(handle);
      if (!p) {
        setUsers([]);
        return;
      }
      setSubjectId(p.id);
      const [list, mine] = await Promise.all([
        tab === 'FOLLOWERS' ? fetchFollowers(p.id) : fetchFollowing(p.id),
        session ? fetchMyFollowingIds(session.user.id) : Promise.resolve(new Set<string>()),
      ]);
      setUsers(list);
      setFollowingIds(mine);
    } catch (e: any) {
      console.warn('follows load failed', e?.message ?? e);
    } finally {
      setLoading(false);
    }
  }, [handle, tab, session]);

  useEffect(() => {
    load();
  }, [load]);

  async function onToggleFollow(user: FollowUser) {
    if (!session || user.id === session.user.id) return;
    const wasFollowing = followingIds.has(user.id);
    setFollowingIds((prev) => {
      const next = new Set(prev);
      if (wasFollowing) next.delete(user.id);
      else next.add(user.id);
      return next;
    });
    try {
      if (wasFollowing) await unfollowUser(session.user.id, user.id);
      else await followUser(session.user.id, user.id);
    } catch {
      // Roll back
      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (wasFollowing) next.add(user.id);
        else next.delete(user.id);
        return next;
      });
    }
  }

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
          <Text style={styles.headerTitle} numberOfLines={1}>@{handle}</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.tabRow}>
          {(['FOLLOWERS', 'FOLLOWING'] as Tab[]).map((t) => (
            <Pressable key={t} style={styles.tab} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
              {tab === t ? <View style={styles.tabIndicator} /> : null}
            </Pressable>
          ))}
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={C.accent} />
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(u) => u.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 4 }}
            renderItem={({ item }) => {
              const isMine = session?.user.id === item.id;
              const followingMe = followingIds.has(item.id);
              const initials = (item.handle ?? item.display_name ?? '??').slice(0, 2).toUpperCase();
              return (
                <Pressable
                  style={styles.row}
                  onPress={() => item.handle && router.push(`/pilot/${item.handle}`)}
                  disabled={!item.handle}
                >
                  <View style={styles.avatar}>
                    {item.avatar_url ? (
                      <Image source={{ uri: item.avatar_url }} style={styles.avatarImg} />
                    ) : (
                      <Text style={styles.avatarInitials}>{initials}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.display_name ?? item.handle ?? 'Builder'}
                    </Text>
                    <Text style={styles.handle} numberOfLines={1}>
                      @{item.handle ?? 'unknown'}
                    </Text>
                  </View>
                  {!isMine ? (
                    <Pressable
                      onPress={(e) => {
                        (e as any).stopPropagation?.();
                        onToggleFollow(item);
                      }}
                      style={[styles.followBtn, followingMe && styles.followBtnActive]}
                    >
                      <Text style={[styles.followBtnText, followingMe && styles.followBtnTextActive]}>
                        {followingMe ? 'FOLLOWING' : 'FOLLOW'}
                      </Text>
                    </Pressable>
                  ) : null}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>
                  {tab === 'FOLLOWERS'
                    ? `@${handle} has no followers yet.`
                    : `@${handle} is not following anyone yet.`}
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

function makeStyles(C: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    header: {
      paddingHorizontal: 20, paddingVertical: 14,
      flexDirection: 'row', alignItems: 'center', gap: 8,
      borderBottomWidth: 1, borderBottomColor: C.border,
    },
    iconBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: C.surface, borderWidth: 1, borderColor: C.borderMid,
      alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { flex: 1, textAlign: 'center', fontFamily: 'DMSans_500Medium', fontSize: 15, color: C.text },

    tabRow: {
      flexDirection: 'row',
      borderBottomWidth: 1, borderBottomColor: C.border,
      backgroundColor: C.bg,
    },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 14, position: 'relative' },
    tabText: { fontFamily: 'DMSans_500Medium', fontSize: 13, letterSpacing: 1.5, color: C.textDim },
    tabTextActive: { color: C.accent },
    tabIndicator: { position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, backgroundColor: C.accent, borderRadius: 1 },

    row: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingVertical: 12, paddingHorizontal: 4,
      borderBottomWidth: 1, borderBottomColor: C.border,
    },
    avatar: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: C.royalBright,
      borderWidth: 1.5, borderColor: C.accentRing,
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImg: { width: '100%', height: '100%' },
    avatarInitials: { fontFamily: 'BebasNeue_400Regular', fontSize: 16, letterSpacing: 1, color: C.goldLight },
    name: { fontFamily: 'DMSans_500Medium', fontSize: 15, color: C.text, marginBottom: 2 },
    handle: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: C.textMid },

    followBtn: {
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
      backgroundColor: C.accent,
    },
    followBtnActive: { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.borderGold },
    followBtnText: { fontFamily: 'DMSans_500Medium', fontSize: 12, letterSpacing: 1.5, color: C.onAccent },
    followBtnTextActive: { color: C.goldLight },

    empty: { padding: 40, alignItems: 'center' },
    emptyText: { color: C.textDim, textAlign: 'center', fontFamily: 'DMSans_300Light', fontSize: 15, lineHeight: 22 },
  });
}
