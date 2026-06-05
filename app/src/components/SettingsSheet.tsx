import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Palette } from '@/lib/theme';

export function SettingsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { mode, setMode, colors: C } = useTheme();
  const { signOut } = useAuth();
  const styles = useMemo(() => makeStyles(C), [C]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.title}>SETTINGS</Text>

          <Text style={styles.sectionLabel}>// THEME</Text>
          <View style={styles.toggleRow}>
            <Pressable
              style={[styles.toggleOption, mode === 'light' && styles.toggleOptionActive]}
              onPress={() => setMode('light')}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Circle cx={12} cy={12} r={4.5} stroke={mode === 'light' ? C.onAccent : C.textMid} strokeWidth={1.6} fill={mode === 'light' ? C.onAccent : 'transparent'} />
                {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
                  <Path
                    key={a}
                    d="M12 2 L12 5"
                    stroke={mode === 'light' ? C.onAccent : C.textMid}
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    transform={`rotate(${a} 12 12)`}
                  />
                ))}
              </Svg>
              <Text style={[styles.toggleText, mode === 'light' && styles.toggleTextActive]}>LIGHT</Text>
            </Pressable>
            <Pressable
              style={[styles.toggleOption, mode === 'dark' && styles.toggleOptionActive]}
              onPress={() => setMode('dark')}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z"
                  stroke={mode === 'dark' ? C.onAccent : C.textMid}
                  fill={mode === 'dark' ? C.onAccent : 'transparent'}
                  strokeWidth={1.6}
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={[styles.toggleText, mode === 'dark' && styles.toggleTextActive]}>DARK</Text>
            </Pressable>
          </View>

          <View style={styles.divider} />

          <Pressable
            style={styles.signOutBtn}
            onPress={() => {
              onClose();
              setTimeout(() => signOut(), 250);
            }}
          >
            <Text style={styles.signOutText}>SIGN OUT</Text>
          </Pressable>

          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>CLOSE</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function makeStyles(C: Palette) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: C.scrim, justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: C.surface,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      borderTopWidth: 1, borderColor: C.borderGold,
      paddingHorizontal: 22, paddingTop: 10, paddingBottom: 36,
    },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.borderMid, alignSelf: 'center', marginBottom: 16 },
    title: { fontFamily: 'BebasNeue_400Regular', fontSize: 22, letterSpacing: 3, color: C.accent, marginBottom: 16 },

    sectionLabel: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, letterSpacing: 1.5, color: C.textDim, marginBottom: 10 },
    toggleRow: { flexDirection: 'row', gap: 8, backgroundColor: C.surface2, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: C.borderMid },
    toggleOption: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      paddingVertical: 12, borderRadius: 10,
    },
    toggleOptionActive: { backgroundColor: C.accent },
    toggleText: { fontFamily: 'DMSans_500Medium', fontSize: 12, letterSpacing: 2, color: C.textMid },
    toggleTextActive: { color: C.onAccent },

    divider: { height: 1, backgroundColor: C.border, marginVertical: 22 },

    signOutBtn: {
      borderWidth: 1, borderColor: C.redHud, borderRadius: 14,
      paddingVertical: 14, alignItems: 'center',
    },
    signOutText: { fontFamily: 'DMSans_500Medium', fontSize: 12, letterSpacing: 2, color: C.redHud },

    cancelBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    cancelText: { fontFamily: 'DMSans_500Medium', fontSize: 11, letterSpacing: 2, color: C.textDim },
  });
}
