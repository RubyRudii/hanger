import { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/context/ThemeContext';
import { Palette } from '@/lib/theme';

const KEY = '@hanger/judge-disclaimer-acked';

export async function hasSeenJudgeDisclaimer(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === 'true';
  } catch {
    return false;
  }
}

async function markSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, 'true');
  } catch {
    /* non-fatal */
  }
}

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function JudgeDisclaimer({ visible, onClose }: Props) {
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);

  async function onAck() {
    await markSeen();
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={[styles.corner, styles.cornerTL]} pointerEvents="none" />
          <View style={[styles.corner, styles.cornerTR]} pointerEvents="none" />
          <View style={[styles.corner, styles.cornerBL]} pointerEvents="none" />
          <View style={[styles.corner, styles.cornerBR]} pointerEvents="none" />

          <Text style={styles.eyebrow}>TRANSMISSION</Text>
          <Text style={styles.title}>A QUICK NOTE</Text>

          <ScrollView style={{ maxHeight: 340 }} contentContainerStyle={{ paddingBottom: 8 }}>
            <Text style={styles.body}>
              The Pilot's Review scores your builds for <Text style={styles.accent}>fun</Text>, not for
              a real trophy. It's a machine looking at a single photo — it can't feel the polish
              on the runners, hold the kit in its hand, or appreciate a shelf full of your work.
            </Text>
            <Text style={styles.body}>
              A score is a rough read on lighting, framing, and a few visible details. It's meant
              to spark ideas for the next build, not to rank you against other pilots.
            </Text>
            <Text style={styles.body}>
              If a review feels off, it probably is — resubmit with a better shot, or shrug it
              off. Every kit you finish is already a win.
            </Text>
            <Text style={styles.bodySmall}>
              Take everything with a grain of thinned paint. Have fun out there.
            </Text>
          </ScrollView>

          <Pressable style={({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.85 }]} onPress={onAck}>
            <Text style={styles.confirmText}>ROGER — LET'S BUILD</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function makeStyles(C: Palette) {
  return StyleSheet.create({
    scrim: {
      flex: 1,
      backgroundColor: C.scrim,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    card: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.borderGold,
      borderRadius: 20,
      padding: 24,
      position: 'relative',
    },
    corner: { position: 'absolute', width: 22, height: 22, borderColor: C.borderGold },
    cornerTL: { top: 8, left: 8, borderTopWidth: 1, borderLeftWidth: 1 },
    cornerTR: { top: 8, right: 8, borderTopWidth: 1, borderRightWidth: 1 },
    cornerBL: { bottom: 8, left: 8, borderBottomWidth: 1, borderLeftWidth: 1 },
    cornerBR: { bottom: 8, right: 8, borderBottomWidth: 1, borderRightWidth: 1 },

    eyebrow: {
      fontFamily: 'JetBrainsMono_500Medium',
      fontSize: 11,
      letterSpacing: 2,
      color: C.textDim,
      textAlign: 'center',
      marginBottom: 4,
    },
    title: {
      fontFamily: 'BebasNeue_400Regular',
      fontSize: 30,
      letterSpacing: 3,
      color: C.accent,
      textAlign: 'center',
      marginBottom: 16,
    },
    body: {
      fontFamily: 'DMSans_300Light',
      fontSize: 14,
      color: C.textMid,
      lineHeight: 21,
      marginBottom: 12,
    },
    accent: { color: C.accent, fontFamily: 'DMSans_500Medium' },
    bodySmall: {
      fontFamily: 'DMSans_400Regular',
      fontSize: 12,
      color: C.textDim,
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: 6,
      marginBottom: 8,
    },
    confirmBtn: {
      marginTop: 16,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 24,
      backgroundColor: C.accent,
    },
    confirmText: {
      fontFamily: 'DMSans_500Medium',
      fontSize: 12,
      letterSpacing: 2,
      color: '#FFFFFF',
    },
  });
}
