import { useMemo } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Palette } from '@/lib/theme';

type Props = {
  visible: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Themed replacement for React Native's default Alert confirmation.
 *  Uses the app's blue/gold aesthetic with corner brackets and BebasNeue. */
export function ConfirmDialog({
  visible,
  title,
  body,
  confirmLabel = 'CONFIRM',
  cancelLabel = 'CANCEL',
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C, destructive), [C, destructive]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={busy ? undefined : onCancel}>
      <Pressable style={styles.scrim} onPress={busy ? undefined : onCancel}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={[styles.corner, styles.cornerTL]} pointerEvents="none" />
          <View style={[styles.corner, styles.cornerTR]} pointerEvents="none" />
          <View style={[styles.corner, styles.cornerBL]} pointerEvents="none" />
          <View style={[styles.corner, styles.cornerBR]} pointerEvents="none" />

          <Text style={styles.title}>{title}</Text>
          {body ? <Text style={styles.body}>{body}</Text> : null}

          <View style={styles.buttons}>
            <Pressable
              style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }, busy && { opacity: 0.4 }]}
              onPress={onCancel}
              disabled={busy}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.85 }, busy && { opacity: 0.7 }]}
              onPress={onConfirm}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmText}>{confirmLabel}</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function makeStyles(C: Palette, destructive: boolean) {
  const accentColor = destructive ? C.redHud : C.accent;
  const accentBorder = destructive ? 'rgba(214,61,99,0.35)' : C.borderGold;
  return StyleSheet.create({
    scrim: {
      flex: 1,
      backgroundColor: C.scrim,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    card: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: accentBorder,
      borderRadius: 20,
      padding: 24,
      position: 'relative',
    },
    corner: { position: 'absolute', width: 22, height: 22, borderColor: accentBorder },
    cornerTL: { top: 8, left: 8, borderTopWidth: 1, borderLeftWidth: 1 },
    cornerTR: { top: 8, right: 8, borderTopWidth: 1, borderRightWidth: 1 },
    cornerBL: { bottom: 8, left: 8, borderBottomWidth: 1, borderLeftWidth: 1 },
    cornerBR: { bottom: 8, right: 8, borderBottomWidth: 1, borderRightWidth: 1 },

    title: {
      fontFamily: 'BebasNeue_400Regular',
      fontSize: 26,
      letterSpacing: 3,
      color: accentColor,
      textAlign: 'center',
      marginBottom: 12,
      marginTop: 4,
    },
    body: {
      fontFamily: 'DMSans_300Light',
      fontSize: 13,
      color: C.textMid,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 22,
    },
    buttons: { flexDirection: 'row', gap: 10 },
    cancelBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 13,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: C.borderMid,
    },
    cancelText: { fontFamily: 'DMSans_500Medium', fontSize: 12, letterSpacing: 1.5, color: C.textMid },
    confirmBtn: {
      flex: 1.2,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 13,
      borderRadius: 24,
      backgroundColor: accentColor,
    },
    confirmText: { fontFamily: 'DMSans_500Medium', fontSize: 12, letterSpacing: 1.5, color: '#FFFFFF' },
  });
}
