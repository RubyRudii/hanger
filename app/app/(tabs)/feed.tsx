import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { BuildCard, BuildSummary } from '@/components/BuildCard';
import { fetchFeed, fetchTopThisWeek } from '@/api/builds';
import { useAuth } from '@/context/AuthContext';
import { colors, fonts, gradeFromScore } from '@/lib/theme';

export default function Feed() {
  const { profile } = useAuth();
  const [feed, setFeed] = useState<BuildSummary[]>([]);
  const [top, setTop] = useState<BuildSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [f, t] = await Promise.all([fetchFeed(), fetchTopThisWeek()]);
      setFeed(f);
      setTop(t);
    } catch (e) {
      console.warn('feed load failed', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  const winner = top[0];

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.logo}>HANGER</Text>
        <Pressable style={styles.avatar} onPress={() => router.push('/(tabs)/profile')}>
          <Text style={styles.avatarText}>{(profile?.handle ?? '?').slice(0, 2).toUpperCase()}</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={feed}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 12 }}
          refreshControl={
            <RefreshControl
              tintColor={colors.accent}
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }
          ListHeaderComponent={
            <View>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>THIS WEEK'S TOP BUILDS</Text>
              </View>
              {winner ? (
                <Pressable style={styles.weekly} onPress={() => router.push(`/build/${winner.id}`)}>
                  <Text style={styles.rank}>01</Text>
                  <View style={styles.weeklyThumb}>
                    {winner.photo_url ? (
                      <Image source={{ uri: winner.photo_url }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <Text style={{ fontSize: 26 }}>🤖</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.weeklyName} numberOfLines={1}>
                      {winner.kit_name}
                    </Text>
                    <Text style={styles.weeklyUser} numberOfLines={1}>
                      {winner.builder_handle ? `@${winner.builder_handle}` : 'Anonymous'} · {winner.grade}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.weeklyScore}>{winner.score}</Text>
                    <Text style={styles.weeklyLabel}>{gradeFromScore(winner.score)}</Text>
                  </View>
                </Pressable>
              ) : (
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>No builds judged this week yet. Be the first.</Text>
                </View>
              )}
              <View style={[styles.section, { marginTop: 8 }]}>
                <Text style={styles.sectionTitle}>RECENT BUILDS</Text>
              </View>
            </View>
          }
          renderItem={({ item }) => <BuildCard build={item} onPress={() => router.push(`/build/${item.id}`)} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Nothing on the feed yet. Head to JUDGE to submit your first build.</Text>
            </View>
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontFamily: fonts.display, fontSize: 26, letterSpacing: 3, color: colors.accent },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.chip, borderWidth: 1.5, borderColor: 'rgba(232,52,26,0.4)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, color: colors.textMuted, fontFamily: fonts.bodyMedium },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  section: { paddingHorizontal: 0, paddingBottom: 10, paddingTop: 4 },
  sectionTitle: { fontSize: 11, letterSpacing: 2, color: colors.textDim, fontFamily: fonts.bodyMedium },
  weekly: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 0.5, borderColor: colors.border, padding: 16, marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  rank: { fontFamily: fonts.display, fontSize: 38, color: 'rgba(232,52,26,0.25)', width: 36 },
  weeklyThumb: { width: 54, height: 54, borderRadius: 10, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  weeklyName: { fontSize: 14, fontFamily: fonts.bodyMedium, color: colors.text, marginBottom: 2 },
  weeklyUser: { fontSize: 11, color: colors.textDim, fontFamily: fonts.body },
  weeklyScore: { fontFamily: fonts.display, fontSize: 26, color: colors.accent, lineHeight: 26 },
  weeklyLabel: { fontSize: 9, color: colors.textFaint, letterSpacing: 1, fontFamily: fonts.bodyMedium },
  empty: { padding: 18, alignItems: 'center' },
  emptyText: { fontSize: 12, color: colors.textDim, textAlign: 'center', fontFamily: fonts.bodyLight },
});
