import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';
import { createKit, uploadKitPhoto } from '@/api/kits';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Palette } from '@/lib/theme';

const GRADES = ['HG', 'MG', 'RG', 'PG', 'FM', 'SD', 'Other'];

export default function AddKitModal() {
  const { session } = useAuth();
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('MG');
  const [series, setSeries] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [saving, setSaving] = useState(false);

  async function pickPhoto() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });
    if (!res.canceled && res.assets[0]) setPhoto(res.assets[0]);
  }

  async function save() {
    if (!session) return;
    if (!name.trim()) {
      Alert.alert('Kit name required', 'Give your kit a name.');
      return;
    }
    setSaving(true);
    try {
      let photoUrl: string | null = null;
      if (photo?.base64) {
        const mime = photo.mimeType ?? 'image/jpeg';
        const ext = mime.split('/')[1] ?? 'jpg';
        photoUrl = await uploadKitPhoto(session.user.id, photo.base64, ext);
      }
      await createKit({
        user_id: session.user.id,
        kit_name: name.trim(),
        grade,
        series: series.trim() || undefined,
        notes: notes.trim() || undefined,
        photo_url: photoUrl,
      });
      router.replace('/(tabs)/hangar');
    } catch (e: any) {
      Alert.alert('Failed to log kit', e?.message ?? 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern id="ga" patternUnits="userSpaceOnUse" width={32} height={32}>
              <Line x1="0" y1="0" x2="32" y2="0" stroke={C.gridLine} strokeWidth={1} />
              <Line x1="0" y1="0" x2="0" y2="32" stroke={C.gridLine} strokeWidth={1} />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#ga)" />
        </Svg>
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text style={styles.cancel}>CANCEL</Text>
          </Pressable>
          <View>
            <Text style={styles.title}>LOG A KIT</Text>
          </View>
          <Pressable onPress={save} disabled={saving} hitSlop={10}>
            {saving ? <ActivityIndicator color={C.accent} /> : <Text style={styles.saveLink}>SAVE</Text>}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.sub}>Add to your collection — no judging, no score.</Text>

          <Pressable style={styles.photoPicker} onPress={pickPhoto}>
            {photo ? (
              <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={{ fontSize: 36 }}>📦</Text>
                <Text style={styles.photoHint}>Tap to add a photo (optional)</Text>
              </View>
            )}
          </Pressable>

          <Text style={styles.fieldLabel}>▸ KIT NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. RX-78-2 Gundam"
            placeholderTextColor={C.textDim}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.fieldLabel}>▸ GRADE</Text>
          <View style={styles.chipRow}>
            {GRADES.map((g) => (
              <Pressable key={g} style={[styles.chip, grade === g && styles.chipActive]} onPress={() => setGrade(g)}>
                <Text style={[styles.chipText, grade === g && styles.chipTextActive]}>{g}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.fieldLabel}>▸ NOTES (optional)</Text>
          <TextInput
            style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
            placeholder="Build plans, where you bought it, etc."
            placeholderTextColor={C.textDim}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </ScrollView>
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
    cancel: { fontFamily: 'DMSans_500Medium', fontSize: 14, letterSpacing: 1.5, color: C.textMid },
    saveLink: { fontFamily: 'DMSans_500Medium', fontSize: 14, letterSpacing: 1.5, color: C.accent },
    title: { fontFamily: 'BebasNeue_400Regular', fontSize: 18, letterSpacing: 3, color: C.text },
    sub: { fontFamily: 'DMSans_300Light', fontSize: 14, color: C.textDim, marginBottom: 16 },

    photoPicker: { width: '100%', height: 180, borderRadius: 14, overflow: 'hidden', marginBottom: 16, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.borderMid, borderStyle: 'dashed' },
    photoPreview: { width: '100%', height: '100%' },
    photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
    photoHint: { color: C.textDim, fontSize: 14, fontFamily: 'DMSans_300Light' },

    fieldLabel: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, letterSpacing: 1.5, color: C.accent, marginBottom: 6, marginTop: 4 },
    input: {
      backgroundColor: C.surface,
      borderWidth: 1, borderColor: C.borderMid, borderRadius: 10,
      paddingHorizontal: 14, paddingVertical: 12,
      fontSize: 15, color: C.text, fontFamily: 'DMSans_400Regular',
      marginBottom: 12,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: C.borderMid, borderRadius: 10, backgroundColor: C.surface },
    chipActive: { backgroundColor: C.accent, borderColor: C.accent },
    chipText: { fontSize: 14, color: C.textMid, fontFamily: 'DMSans_500Medium' },
    chipTextActive: { color: C.onAccent },
  });
}
