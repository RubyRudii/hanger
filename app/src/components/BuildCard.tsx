import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, gradeFromScore } from '@/lib/theme';

export type BuildSummary = {
  id: string;
  kit_name: string;
  grade: string;
  photo_url: string | null;
  score: number;
  created_at: string;
  builder_handle: string | null;
};

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function BuildCard({ build, onPress }: { build: BuildSummary; onPress?: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.thumb}>
        {build.photo_url ? (
          <Image source={{ uri: build.photo_url }} style={styles.img} />
        ) : (
          <Text style={styles.thumbFallback}>🤖</Text>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {build.kit_name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {build.builder_handle ? `@${build.builder_handle}` : 'Anonymous'} · {build.grade} · {timeAgo(build.created_at)}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.score}>{build.score}</Text>
        <Text style={styles.gradeText}>{gradeFromScore(build.score)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  img: { width: '100%', height: '100%' },
  thumbFallback: { fontSize: 26 },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 13, fontFamily: fonts.bodyMedium, color: colors.text, marginBottom: 2 },
  meta: { fontSize: 11, fontFamily: fonts.body, color: colors.textDim },
  right: { alignItems: 'flex-end' },
  score: { fontFamily: fonts.display, fontSize: 22, color: colors.accent, lineHeight: 22 },
  gradeText: { fontSize: 9, letterSpacing: 1, color: colors.textDim, fontFamily: fonts.bodyMedium },
});
