import { ReactNode, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Palette } from '@/lib/theme';

export function EmptyState({
  icon,
  title,
  body,
  ctaLabel,
  onCta,
  compact,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  ctaLabel?: string;
  onCta?: () => void;
  compact?: boolean;
}) {
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  return (
    <View style={[styles.root, compact && styles.rootCompact]}>
      {icon ? (
        <View style={styles.iconWrap}>
          <View style={styles.iconRing} />
          <View style={styles.iconInner}>{icon}</View>
        </View>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {ctaLabel && onCta ? (
        <Pressable style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]} onPress={onCta}>
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function makeStyles(C: Palette) {
  return StyleSheet.create({
    root: { paddingHorizontal: 32, paddingVertical: 44, alignItems: 'center', gap: 14 },
    rootCompact: { paddingVertical: 28, gap: 10 },

    iconWrap: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    iconRing: { position: 'absolute', width: 90, height: 90, borderRadius: 45, borderWidth: 1, borderColor: C.accentRing },
    iconInner: {
      width: 64, height: 64, borderRadius: 32,
      backgroundColor: C.surface2,
      borderWidth: 1, borderColor: C.borderGold,
      alignItems: 'center', justifyContent: 'center',
    },

    title: {
      fontFamily: 'BebasNeue_400Regular', fontSize: 22, letterSpacing: 3,
      color: C.textMid, textAlign: 'center',
    },
    body: {
      color: C.textDim, textAlign: 'center',
      fontFamily: 'DMSans_300Light', fontSize: 14, lineHeight: 21,
      maxWidth: 320,
    },
    cta: {
      marginTop: 8,
      backgroundColor: C.accent,
      paddingHorizontal: 22, paddingVertical: 12, borderRadius: 24,
    },
    ctaText: {
      color: C.onAccent, fontFamily: 'DMSans_500Medium',
      fontSize: 13, letterSpacing: 1.5,
    },
  });
}
