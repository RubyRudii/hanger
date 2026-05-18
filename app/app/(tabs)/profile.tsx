import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { fetchMyBuilds } from '@/api/builds';
import { BuildSummary } from '@/components/BuildCard';
import { useAuth } from '@/context/AuthContext';
import { colors, fonts } from '@/lib/theme';

export default function Profile() {
  const { session, profile, signOut } = useAuth();
  const [builds, setBuilds] = useState<BuildSummary[]>([]);
  const [loading, setLoading] = useState(true);

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

  const avg = builds.length ? Math.round(builds.reduce((s, b) => s + b.score, 0) / builds.length) : 0;
  const initials = (profile?.handle ?? profile?.display_name ?? '??').slice(0, 2).toUpperCase();

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.av}>
          <Text style={styles.avText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{profile?.display_name ?? profile?.handle ?? 'Builder'}</Text>
        <Text style={styles.handle}>
          @{profile?.handle ?? 'unknown'} · Joined {profile?.joined_year ?? new Date().getFullYear()}
        </Text>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{builds.length}</Text>
            <Text style={styles.statLabel}>KITS</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{avg}</Text>
            <Text style={styles.statLabel}>AVG SCORE</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{builds.filter((b) => b.score >= 90).length}</Text>
            <Text style={styles.statLabel}>S-GRADE</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={builds.slice(0, 6)}
          keyExtractor={(b) => b.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 1 }}
          ItemSeparatorComponent={() => <View style={{ height: 1 }} />}
          contentContainerStyle={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          ListFooterComponent={
            <Pressable style={styles.signOut} onPress={signOut}>
              <Text style={styles.signOutText}>SIGN OUT</Text>
            </Pressable>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No builds yet.</Text>
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
                  <Text style={{ fontSize: 22 }}>🤖</Text>
                )}
              </View>
              <Text style={styles.cellName} numberOfLines={1}>
                {item.kit_name}
              </Text>
              <Text style={styles.cellScore}>{item.score}</Text>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.surface, paddingTop: 28, paddingBottom: 20, paddingHorizontal: 20, alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.05)' },
  av: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(232,52,26,0.4)' },
  avText: { fontFamily: fonts.display, fontSize: 28, color: '#fff' },
  name: { fontSize: 18, fontFamily: fonts.bodyMedium, color: colors.text, marginTop: 12 },
  handle: { fontSize: 12, color: colors.textDim, fontFamily: fonts.body, marginTop: 2 },
  stats: { flexDirection: 'row', gap: 36, marginTop: 18 },
  stat: { alignItems: 'center' },
  statNum: { fontFamily: fonts.display, fontSize: 24, color: colors.text },
  statLabel: { fontSize: 9, letterSpacing: 1.5, color: colors.textDim, marginTop: 2, fontFamily: fonts.bodyMedium },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cell: { flex: 1, backgroundColor: colors.bg, padding: 14, alignItems: 'center', gap: 6 },
  thumb: { width: 54, height: 54, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cellName: { fontSize: 11, fontFamily: fonts.bodyMedium, color: colors.textMuted, textAlign: 'center' },
  cellScore: { fontFamily: fonts.display, fontSize: 16, color: colors.accent },
  empty: { padding: 40, alignItems: 'center', gap: 12, backgroundColor: colors.bg },
  emptyText: { color: colors.textDim, fontFamily: fonts.bodyLight, fontSize: 13 },
  cta: { backgroundColor: colors.accent, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  ctaText: { color: '#fff', fontFamily: fonts.bodyMedium, fontSize: 12, letterSpacing: 1 },
  signOut: { padding: 20, alignItems: 'center', backgroundColor: colors.bg, marginTop: 8 },
  signOutText: { fontSize: 11, color: colors.textDim, letterSpacing: 2, fontFamily: fonts.bodyMedium },
});
