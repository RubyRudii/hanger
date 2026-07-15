import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Line, Path, Pattern, Rect } from 'react-native-svg';
import { fetchTopThisWeek } from '@/api/builds';
import { listBlockedIds } from '@/api/moderation';
import { BuildSummary } from '@/components/BuildCard';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Palette } from '@/lib/theme';

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 3600) return `${Math.floor(d / 60)}m`;
  if (d < 86400) return `${Math.floor(d / 3600)}h`;
  if (d < 604800) return `${Math.floor(d / 86400)}d`;
  return `${Math.floor(d / 604800)}w`;
}

function rankColor(rank: number, C: Palette) {
  if (rank === 1) return C.accent;
  if (rank === 2) return '#B8B8B8';
  if (rank === 3) return '#CD7F32';
  return C.textDim;
}

export default function Leaderboard() {
  const { session } = useAuth();
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [builds, setBuilds] = useState<BuildSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [top, blocked] = await Promise.all([
        fetchTopThisWeek(10),
        session ? listBlockedIds(session.user.id) : Promise.resolve(new Set<string>()),
      ]);
      setBuilds(top.filter((b) => !blocked.has((b as any).user_id ?? '')));
    } catch (e: any) {
      console.warn('leaderboard load failed', e?.message ?? e);
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
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>LEADERBOARD</Text>
            <Text style={styles.headerSub}>// THIS WEEK'S TOP BUILDS</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={C.accent} />
          </View>
        ) : (
          <FlatList
            data={builds}
            keyExtractor={(b) => b.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 12 }}
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
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item, index }) => (
              <LeaderboardRow build={item} rank={index + 1} onPress={() => router.push(`/build/${item.id}`)} />
            )}
            ListEmptyComponent={
              <EmptyState
                icon={
                  <Svg width={36} height={36} viewBox="0 0 16 16">
                    <Path d="M2 5L5 8L8 3L11 8L14 5V12H2V5Z M2 13H14V14H2V13Z" fill={C.accent} />
                  </Svg>
                }
                title="NO BUILDS THIS WEEK"
                body="The leaderboard resets every week. Submit a build to claim the crown."
                ctaLabel="OPEN JUDGE"
                onCta={() => router.push('/(tabs)/judge')}
              />
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

function LeaderboardRow({
  build,
  rank,
  onPress,
}: {
  build: BuildSummary;
  rank: number;
  onPress: () => void;
}) {
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const podium = rank <= 3;

  return (
    <Pressable style={[styles.row, podium && styles.rowPodium]} onPress={onPress}>
      <View style={styles.rankBox}>
        <Text style={[styles.rankNum, { color: rankColor(rank, C) }]}>{String(rank).padStart(2, '0')}</Text>
      </View>
      <View style={styles.thumb}>
        {build.photo_url ? (
          <Image source={{ uri: build.photo_url }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <Text style={{ fontSize: 26 }}>🤖</Text>
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.kitName} numberOfLines={1}>
          {build.kit_name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {build.builder_handle ? `@${build.builder_handle}` : 'Anonymous'} · {build.grade} · {timeAgo(build.created_at)} ago
        </Text>
      </View>
      <View style={styles.scoreCol}>
        <Text style={styles.score}>{build.score}</Text>
        <Text style={styles.scoreLabel}>PILOT SCORE</Text>
      </View>
    </Pressable>
  );
}

function makeStyles(C: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    header: {
      paddingHorizontal: 20, paddingVertical: 14,
      flexDirection: 'row', alignItems: 'center', gap: 12,
      borderBottomWidth: 1, borderBottomColor: C.border,
    },
    iconBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: C.surface, borderWidth: 1, borderColor: C.borderMid,
      alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 18, letterSpacing: 3, color: C.text },
    headerSub: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, letterSpacing: 1.5, color: C.textDim, marginTop: 3 },

    row: {
      backgroundColor: C.surface,
      borderWidth: 1, borderColor: C.border, borderRadius: 14,
      padding: 12,
      flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    rowPodium: { borderColor: C.borderGold },

    rankBox: { width: 40, alignItems: 'center' },
    rankNum: { fontFamily: 'BebasNeue_400Regular', fontSize: 26, letterSpacing: 1, lineHeight: 26 },

    thumb: {
      width: 52, height: 52, borderRadius: 10,
      backgroundColor: C.surface2,
      borderWidth: 1, borderColor: C.borderMid,
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    },

    kitName: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: C.text, marginBottom: 3 },
    meta: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: C.textDim, letterSpacing: 0.5 },

    scoreCol: { alignItems: 'flex-end', minWidth: 60 },
    score: { fontFamily: 'BebasNeue_400Regular', fontSize: 24, color: C.accent, letterSpacing: 1, lineHeight: 24 },
    scoreLabel: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, letterSpacing: 1.5, color: C.textDim, marginTop: 3 },
  });
}
