import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/lib/theme';

export function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(0, Math.min(100, value))}%` }]} />
      </View>
      <Text style={styles.num}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  label: { fontSize: 11, color: colors.textDim, width: 100, fontFamily: fonts.body },
  track: { flex: 1, height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.accent, borderRadius: 2 },
  num: { fontSize: 11, color: colors.textMuted, width: 24, textAlign: 'right', fontFamily: fonts.body },
});
