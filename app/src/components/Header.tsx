import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors, fonts } from '@/lib/theme';

export function Header({ title, subtitle, showBack }: { title: string; subtitle?: string; showBack?: boolean }) {
  return (
    <View style={styles.wrap}>
      {showBack ? (
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backArrow}>‹</Text>
        </Pressable>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  back: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { color: colors.textMuted, fontSize: 22, lineHeight: 24, marginTop: -2 },
  title: { fontFamily: fonts.display, fontSize: 22, letterSpacing: 2, color: colors.text },
  sub: { fontSize: 11, color: colors.textDim, fontFamily: fonts.body, marginTop: 2 },
});
