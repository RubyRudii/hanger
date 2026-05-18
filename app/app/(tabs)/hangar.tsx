import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { fetchMyBuilds } from '@/api/builds';
import { BuildSummary } from '@/components/BuildCard';
import { useAuth } from '@/context/AuthContext';
import { colors, fonts } from '@/lib/theme';

export default function Hangar() {
  const { session } = useAuth();
  const [builds, setBuilds] = useState<BuildSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const data = await fetchMyBuilds(session.user.id);
      setBuilds(data);
    } catch (e) {
      console.warn('hangar load failed', e);
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
    <Screen>
      <Header title="MY HANGAR" subtitle={`${builds.length} ${builds.length === 1 ? 'kit' : 'kits'} on the shelf`} />
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={builds}
          keyExtractor={(b) => b.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 1 }}
          ItemSeparatorComponent={() => <View style={{ height: 1 }} />}
          contentContainerStyle={{ backgroundColor: 'rgba(255,255,255,0.05)', paddingBottom: 24 }}
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
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Your hangar is empty.</Text>
              <Pressable style={styles.cta} onPress={() => router.push('/(tabs)/judge')}>
                <Text style={styles.ctaText}>JUDGE A BUILD →</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.cell} onPress={() => router.push(`/build/${item.id}`)}>
              <View style={styles.thumb}>
                {item.photo_url ? (
                  <Image source={{ uri: item.photo_url }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <Text style={{ fontSize: 26 }}>🤖</Text>
                )}
              </View>
              <Text style={styles.name} numberOfLines={1}>
                {item.kit_name}
              </Text>
              <Text style={styles.score}>{item.score}</Text>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cell: { flex: 1, backgroundColor: colors.bg, padding: 14, alignItems: 'center', gap: 6 },
  thumb: { width: 64, height: 64, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  name: { fontSize: 11, fontFamily: fonts.bodyMedium, color: colors.textMuted, textAlign: 'center' },
  score: { fontFamily: fonts.display, fontSize: 17, color: colors.accent },
  empty: { padding: 40, alignItems: 'center', gap: 12 },
  emptyText: { color: colors.textDim, fontFamily: fonts.bodyLight, fontSize: 13 },
  cta: { backgroundColor: colors.accent, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  ctaText: { color: '#fff', fontFamily: fonts.bodyMedium, fontSize: 12, letterSpacing: 1 },
});
