import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { ScoreBar } from '@/components/ScoreBar';
import { fetchBuild, DbBuild } from '@/api/builds';
import { colors, fonts, gradeFromScore } from '@/lib/theme';

export default function BuildDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [build, setBuild] = useState<DbBuild | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchBuild(id)
      .then(setBuild)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Screen>
        <Header title="LOADING…" showBack />
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </Screen>
    );
  }

  if (!build) {
    return (
      <Screen>
        <Header title="NOT FOUND" showBack />
        <Text style={styles.notFound}>This build doesn't exist or was removed.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="RESULTS" subtitle={build.kit_name} showBack />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {build.photo_url ? (
          <Image source={{ uri: build.photo_url }} style={styles.hero} />
        ) : null}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kit}>{build.kit_name}</Text>
              <Text style={styles.kitSub}>
                {build.grade}
                {build.modifications ? ` · ${build.modifications}` : ''}
              </Text>
            </View>
            <View>
              <Text style={styles.bigNum}>{build.score}</Text>
              <Text style={styles.gradeLetter}>{gradeFromScore(build.score)}</Text>
            </View>
          </View>
          <ScoreBar label="Panel lining" value={build.scores.panel_lining} />
          <ScoreBar label="Paint / finish" value={build.scores.paint_finish} />
          <ScoreBar label="Pose & comp." value={build.scores.pose_composition} />
          <ScoreBar label="Weathering" value={build.scores.weathering} />
          <ScoreBar label="Overall polish" value={build.scores.overall_polish} />
        </View>

        <View style={styles.verdict}>
          <Text style={styles.verdictLabel}>JUDGE'S VERDICT</Text>
          <Text style={styles.verdictText}>{build.verdict}</Text>
        </View>

        <View style={styles.tips}>
          <View style={styles.tip}>
            <Text style={styles.tipLabel}>STRENGTH</Text>
            <Text style={styles.tipText}>{build.strength}</Text>
          </View>
          <View style={styles.tip}>
            <Text style={styles.tipLabel}>WORK ON</Text>
            <Text style={styles.tipText}>{build.work_on}</Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { textAlign: 'center', color: colors.textDim, fontFamily: fonts.bodyLight, marginTop: 40 },
  hero: { width: '100%', height: 240, backgroundColor: colors.surface },
  heroCard: { backgroundColor: colors.surface, marginHorizontal: 20, marginTop: 14, marginBottom: 14, borderRadius: 16, padding: 18, borderWidth: 0.5, borderColor: colors.border },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 },
  kit: { fontSize: 16, fontFamily: fonts.bodyMedium, color: colors.text },
  kitSub: { fontSize: 11, color: colors.textDim, marginTop: 2, fontFamily: fonts.body },
  bigNum: { fontFamily: fonts.display, fontSize: 56, color: colors.accent, lineHeight: 56, textAlign: 'right' },
  gradeLetter: { fontFamily: fonts.display, fontSize: 16, letterSpacing: 2, color: colors.textMuted, textAlign: 'right' },
  verdict: { marginHorizontal: 20, marginBottom: 14, backgroundColor: colors.surface, borderRadius: 14, borderLeftWidth: 3, borderLeftColor: colors.accent, padding: 16 },
  verdictLabel: { fontSize: 9, letterSpacing: 2, color: colors.textFaint, fontFamily: fonts.bodyMedium, marginBottom: 6 },
  verdictText: { fontSize: 13, color: colors.textMuted, lineHeight: 21, fontFamily: fonts.bodyLight },
  tips: { marginHorizontal: 20, flexDirection: 'row', gap: 8 },
  tip: { flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 14, borderWidth: 0.5, borderColor: colors.border },
  tipLabel: { fontSize: 9, letterSpacing: 1.5, color: colors.textFaint, marginBottom: 5, fontFamily: fonts.bodyMedium },
  tipText: { fontSize: 12, color: colors.textMuted, lineHeight: 18, fontFamily: fonts.body },
});
