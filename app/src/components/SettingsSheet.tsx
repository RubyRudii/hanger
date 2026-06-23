import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import Svg, { Circle, Path } from 'react-native-svg';
import { deleteAccount } from '@/api/account';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Palette } from '@/lib/theme';

const TERMS_URL = 'https://rubyrudii.github.io/hanger/terms.html';
const PRIVACY_URL = 'https://rubyrudii.github.io/hanger/privacy.html';
const SUPPORT_EMAIL = 'hangerapp.support@gmail.com';

const MANAGE_SUB_URL = Platform.select({
  ios: 'https://apps.apple.com/account/subscriptions',
  android: 'https://play.google.com/store/account/subscriptions',
  default: 'https://apps.apple.com/account/subscriptions',
});

export function SettingsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { mode, setMode, colors: C } = useTheme();
  const { signOut } = useAuth();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [deleting, setDeleting] = useState(false);

  const version = (Constants.expoConfig?.version as string | undefined) ?? '0.1.0';

  function openExternal(url: string) {
    Linking.openURL(url).catch(() =>
      Alert.alert('Could not open link', 'Try opening it in your browser instead.'),
    );
  }

  function onSignOut() {
    onClose();
    setTimeout(() => signOut(), 250);
  }

  function onRestorePurchases() {
    Alert.alert(
      'Restore Purchases',
      'Subscription restore will be wired once RevenueCat is connected to your App Store / Play Store accounts.',
    );
  }

  function onManageSub() {
    if (MANAGE_SUB_URL) openExternal(MANAGE_SUB_URL);
  }

  function onDeleteAccount() {
    Alert.alert(
      'Delete your account?',
      'This permanently removes your profile, all kits in your hangar, all builds, and any subscription. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete forever',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteAccount();
              onClose();
            } catch (e: any) {
              Alert.alert('Could not delete account', e?.message ?? 'Something went wrong.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.title}>SETTINGS</Text>

          <ScrollView style={{ maxHeight: 540 }} contentContainerStyle={{ paddingBottom: 4 }}>
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

            <Text style={styles.sectionLabel}>// SUBSCRIPTION</Text>
            <Row label="Manage subscription" caption="Opens your store account" onPress={onManageSub} />
            <Row label="Restore purchases" caption="Re-sync an existing subscription" onPress={onRestorePurchases} />

            <Text style={styles.sectionLabel}>// ABOUT</Text>
            <Row label="Terms of Use" onPress={() => openExternal(TERMS_URL)} />
            <Row label="Privacy Policy" onPress={() => openExternal(PRIVACY_URL)} />
            <Row label="Contact support" onPress={() => openExternal(`mailto:${SUPPORT_EMAIL}`)} />
            <Row label="Version" caption={version} />

            <Text style={styles.sectionLabel}>// ACCOUNT</Text>
            <Pressable style={styles.signOutBtn} onPress={onSignOut}>
              <Text style={styles.signOutText}>SIGN OUT</Text>
            </Pressable>
            <Pressable style={styles.deleteBtn} onPress={onDeleteAccount} disabled={deleting}>
              {deleting ? <ActivityIndicator color={C.redHud} /> : <Text style={styles.deleteText}>DELETE ACCOUNT</Text>}
            </Pressable>
            <Text style={styles.deleteCaption}>
              Permanent. Removes your profile, hangar, builds, and any active subscription.
            </Text>
          </ScrollView>

          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>CLOSE</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Row({ label, caption, onPress }: { label: string; caption?: string; onPress?: () => void }) {
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  return (
    <Pressable style={styles.row} onPress={onPress} disabled={!onPress}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {caption ? <Text style={styles.rowCaption}>{caption}</Text> : null}
      </View>
      {onPress ? <Text style={styles.rowChev}>›</Text> : null}
    </Pressable>
  );
}

function makeStyles(C: Palette) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: C.scrim, justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: C.surface,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      borderTopWidth: 1, borderColor: C.borderGold,
      paddingHorizontal: 22, paddingTop: 10, paddingBottom: 32,
    },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.borderMid, alignSelf: 'center', marginBottom: 16 },
    title: { fontFamily: 'BebasNeue_400Regular', fontSize: 22, letterSpacing: 3, color: C.accent, marginBottom: 12 },

    sectionLabel: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, letterSpacing: 1.5, color: C.textDim, marginTop: 18, marginBottom: 10 },
    toggleRow: { flexDirection: 'row', gap: 8, backgroundColor: C.surface2, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: C.borderMid },
    toggleOption: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      paddingVertical: 12, borderRadius: 10,
    },
    toggleOptionActive: { backgroundColor: C.accent },
    toggleText: { fontFamily: 'DMSans_500Medium', fontSize: 12, letterSpacing: 2, color: C.textMid },
    toggleTextActive: { color: C.onAccent },

    row: {
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 12, paddingHorizontal: 14,
      borderWidth: 1, borderColor: C.border, borderRadius: 12,
      backgroundColor: C.surface2, marginBottom: 6,
    },
    rowLabel: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: C.text, letterSpacing: 0.3 },
    rowCaption: { fontFamily: 'DMSans_300Light', fontSize: 11, color: C.textDim, marginTop: 2 },
    rowChev: { fontFamily: 'DMSans_500Medium', fontSize: 18, color: C.textDim, marginLeft: 8 },

    signOutBtn: {
      borderWidth: 1, borderColor: C.borderMid, borderRadius: 14,
      paddingVertical: 13, alignItems: 'center',
      marginBottom: 8,
    },
    signOutText: { fontFamily: 'DMSans_500Medium', fontSize: 12, letterSpacing: 2, color: C.textMid },
    deleteBtn: {
      borderWidth: 1, borderColor: C.redHud, borderRadius: 14,
      paddingVertical: 13, alignItems: 'center',
    },
    deleteText: { fontFamily: 'DMSans_500Medium', fontSize: 12, letterSpacing: 2, color: C.redHud },
    deleteCaption: { fontFamily: 'DMSans_300Light', fontSize: 10, color: C.textDim, textAlign: 'center', marginTop: 8, lineHeight: 15 },

    cancelBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 12 },
    cancelText: { fontFamily: 'DMSans_500Medium', fontSize: 11, letterSpacing: 2, color: C.textDim },
  });
}
