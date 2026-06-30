import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Line, Path, Pattern, Rect } from 'react-native-svg';
import { updateProfile, uploadAvatar, validateHandle } from '@/api/profile';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Palette } from '@/lib/theme';

const BIO_LIMIT = 280;

export default function EditProfile() {
  const { session, profile, refreshProfile } = useAuth();
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [handle, setHandle] = useState(profile?.handle ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '');
      setHandle(profile.handle ?? '');
      setBio(profile.bio ?? '');
    }
  }, [profile?.id]);

  async function pickPhoto() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });
    if (!res.canceled && res.assets[0]) {
      setPhoto(res.assets[0]);
      setRemoveAvatar(false);
    }
  }

  async function save() {
    if (!session) return;
    const handleErr = validateHandle(handle.trim().toLowerCase());
    if (handleErr) {
      Alert.alert('Invalid handle', handleErr);
      return;
    }
    if (bio.length > BIO_LIMIT) {
      Alert.alert('Bio too long', `Keep it under ${BIO_LIMIT} characters.`);
      return;
    }

    setSaving(true);
    try {
      let avatarUrl: string | null | undefined;
      if (removeAvatar) avatarUrl = null;
      else if (photo?.base64) {
        const mime = photo.mimeType ?? 'image/jpeg';
        const ext = mime.split('/')[1] ?? 'jpg';
        avatarUrl = await uploadAvatar(session.user.id, photo.base64, ext);
      }

      await updateProfile(session.user.id, {
        display_name: displayName.trim() || null,
        handle: handle.trim().toLowerCase(),
        bio: bio.trim() || null,
        ...(avatarUrl !== undefined ? { avatar_url: avatarUrl } : {}),
      });

      await refreshProfile();
      router.back();
    } catch (e: any) {
      const msg = e?.message ?? 'Something went wrong.';
      if (msg.toLowerCase().includes('unique') || msg.toLowerCase().includes('duplicate')) {
        Alert.alert('Handle taken', 'That handle is already in use. Try another.');
      } else {
        Alert.alert('Could not save', msg);
      }
    } finally {
      setSaving(false);
    }
  }

  const currentAvatarUri = photo?.uri ?? (!removeAvatar ? profile?.avatar_url ?? null : null);
  const initials = (handle || displayName || '?').slice(0, 2).toUpperCase();

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern id="g" patternUnits="userSpaceOnUse" width={32} height={32}>
              <Line x1="0" y1="0" x2="32" y2="0" stroke={C.gridLine} strokeWidth={1} />
              <Line x1="0" y1="0" x2="0" y2="32" stroke={C.gridLine} strokeWidth={1} />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#g)" />
        </Svg>
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.cancel}>CANCEL</Text>
          </Pressable>
          <Text style={styles.title}>EDIT PROFILE</Text>
          <Pressable onPress={save} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={C.accent} size="small" />
            ) : (
              <Text style={styles.saveLink}>SAVE</Text>
            )}
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
            <View style={styles.avatarBlock}>
              <Pressable style={styles.avatarWrap} onPress={pickPhoto}>
                <View style={styles.avatarRing} />
                <View style={styles.avatar}>
                  {currentAvatarUri ? (
                    <Image source={{ uri: currentAvatarUri }} style={styles.avatarImg} />
                  ) : (
                    <Text style={styles.avatarText}>{initials}</Text>
                  )}
                </View>
                <View style={styles.avatarCamera}>
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M4 7h3l2-3h6l2 3h3v13H4V7z"
                      stroke={C.onAccent}
                      strokeWidth={1.6}
                      strokeLinejoin="round"
                    />
                    <Path d="M12 17a4 4 0 100-8 4 4 0 000 8z" stroke={C.onAccent} strokeWidth={1.6} />
                  </Svg>
                </View>
              </Pressable>
              <Pressable onPress={pickPhoto}>
                <Text style={styles.avatarAction}>{currentAvatarUri ? 'CHANGE PHOTO' : 'ADD PHOTO'}</Text>
              </Pressable>
              {currentAvatarUri ? (
                <Pressable onPress={() => { setPhoto(null); setRemoveAvatar(true); }}>
                  <Text style={styles.avatarRemove}>Remove</Text>
                </Pressable>
              ) : null}
            </View>

            <Text style={styles.fieldLabel}>▸ DISPLAY NAME</Text>
            <TextInput
              style={[styles.input, focused === 'name' && styles.inputFocus]}
              placeholder="Your name"
              placeholderTextColor={C.textDim}
              value={displayName}
              onChangeText={setDisplayName}
              onFocus={() => setFocused('name')}
              onBlur={() => setFocused(null)}
              maxLength={40}
            />

            <Text style={styles.fieldLabel}>▸ HANDLE</Text>
            <TextInput
              style={[styles.input, focused === 'handle' && styles.inputFocus]}
              placeholder="e.g. zeropilot"
              placeholderTextColor={C.textDim}
              value={handle}
              onChangeText={(v) => setHandle(v.toLowerCase())}
              onFocus={() => setFocused('handle')}
              onBlur={() => setFocused(null)}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
            <Text style={styles.helper}>3–20 chars · lowercase letters, digits, underscore</Text>

            <Text style={styles.fieldLabel}>▸ BIO</Text>
            <TextInput
              style={[styles.input, styles.bioInput, focused === 'bio' && styles.inputFocus]}
              placeholder="Specialty, favorite kit, builder since…"
              placeholderTextColor={C.textDim}
              value={bio}
              onChangeText={setBio}
              onFocus={() => setFocused('bio')}
              onBlur={() => setFocused(null)}
              multiline
              maxLength={BIO_LIMIT}
            />
            <Text style={styles.helper}>{bio.length} / {BIO_LIMIT}</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(C: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: {
      paddingHorizontal: 20, paddingVertical: 14,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      borderBottomWidth: 1, borderBottomColor: C.border,
    },
    cancel: { fontFamily: 'DMSans_500Medium', fontSize: 12, letterSpacing: 1.5, color: C.textMid },
    title: { fontFamily: 'BebasNeue_400Regular', fontSize: 18, letterSpacing: 3, color: C.text },
    saveLink: { fontFamily: 'DMSans_500Medium', fontSize: 12, letterSpacing: 1.5, color: C.accent },

    avatarBlock: { alignItems: 'center', marginBottom: 28, gap: 10 },
    avatarWrap: { width: 110, height: 110, alignItems: 'center', justifyContent: 'center' },
    avatarRing: { position: 'absolute', width: 124, height: 124, borderRadius: 62, borderWidth: 1, borderColor: C.accentRing },
    avatar: {
      width: 110, height: 110, borderRadius: 55,
      backgroundColor: C.royalBright,
      borderWidth: 2, borderColor: C.accent,
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImg: { width: '100%', height: '100%' },
    avatarText: { fontFamily: 'BebasNeue_400Regular', fontSize: 42, letterSpacing: 2, color: C.goldLight },
    avatarCamera: {
      position: 'absolute', bottom: 4, right: 4,
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: C.accent,
      borderWidth: 2, borderColor: C.bg,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarAction: { fontFamily: 'DMSans_500Medium', fontSize: 11, letterSpacing: 2, color: C.accent },
    avatarRemove: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: C.textDim },

    fieldLabel: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, letterSpacing: 1.5, color: C.accent, marginBottom: 6, marginTop: 4 },
    input: {
      backgroundColor: C.surface,
      borderWidth: 1, borderColor: C.borderMid, borderRadius: 10,
      paddingHorizontal: 14, paddingVertical: 12,
      fontSize: 14, color: C.text, fontFamily: 'DMSans_400Regular',
    },
    inputFocus: { borderColor: C.borderGold },
    bioInput: { minHeight: 90, textAlignVertical: 'top' },
    helper: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: C.textDim, marginTop: 6, marginBottom: 12 },
  });
}
