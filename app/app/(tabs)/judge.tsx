import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { createBuild, uploadPhoto } from '@/api/builds';
import { judgeBuild } from '@/api/judge';
import { useAuth } from '@/context/AuthContext';
import { colors, fonts } from '@/lib/theme';

const GRADES = ['HG', 'RG', 'MG', 'PG', 'SD', 'Other'];

export default function Judge() {
  const { session } = useAuth();
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [kitName, setKitName] = useState('');
  const [grade, setGrade] = useState('MG');
  const [series, setSeries] = useState('');
  const [mods, setMods] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function pick() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });
    if (!res.canceled && res.assets[0]) setPhoto(res.assets[0]);
  }

  async function shoot() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera permission needed', 'Enable camera access to shoot your kit.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7, base64: true });
    if (!res.canceled && res.assets[0]) setPhoto(res.assets[0]);
  }

  async function submit() {
    if (!session) return;
    if (!photo?.base64) {
      Alert.alert('Add a photo', 'Hanger needs at least one shot of your kit to judge it.');
      return;
    }
    if (!kitName.trim()) {
      Alert.alert('Kit name required', 'Tell us which kit this is.');
      return;
    }
    setSubmitting(true);
    try {
      const mime = photo.mimeType ?? 'image/jpeg';
      const ext = mime.split('/')[1] ?? 'jpg';
      const result = await judgeBuild({
        photo_base64: photo.base64,
        photo_mime: mime,
        kit_name: kitName.trim(),
        grade,
        series: series.trim(),
        modifications: mods.trim(),
      });
      const photoUrl = await uploadPhoto(session.user.id, photo.base64, ext);
      const id = await createBuild({
        user_id: session.user.id,
        kit_name: kitName.trim(),
        grade,
        series: series.trim(),
        modifications: mods.trim(),
        photo_url: photoUrl,
        result,
      });
      router.push(`/build/${id}`);
      setPhoto(null);
      setKitName('');
      setSeries('');
      setMods('');
    } catch (e: any) {
      Alert.alert('Judging failed', e?.message ?? 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <Header title="AI JUDGE" subtitle="Get your build scored" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <View style={styles.uploadWrap}>
          <Pressable style={styles.upload} onPress={pick} onLongPress={shoot}>
            {photo ? (
              <Image source={{ uri: photo.uri }} style={styles.preview} />
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.uploadBig}>📸</Text>
                <Text style={styles.uploadTxt}>Tap to upload kit photo</Text>
                <Text style={styles.uploadHint}>Long-press to use camera</Text>
              </View>
            )}
          </Pressable>
          {photo ? (
            <Pressable onPress={() => setPhoto(null)} style={styles.removeBtn}>
              <Text style={styles.removeText}>Remove photo</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.form}>
          <TextField label="KIT NAME" placeholder="Wing Gundam Zero EW" value={kitName} onChangeText={setKitName} />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>GRADE</Text>
              <View style={styles.chipRow}>
                {GRADES.map((g) => (
                  <Pressable key={g} style={[styles.chip, grade === g && styles.chipActive]} onPress={() => setGrade(g)}>
                    <Text style={[styles.chipText, grade === g && styles.chipTextActive]}>{g}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
          <TextField label="SERIES" placeholder="Wing EW" value={series} onChangeText={setSeries} />
          <TextField label="MODIFICATIONS" placeholder="Panel lined + weathered" value={mods} onChangeText={setMods} />
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Button label={submitting ? 'JUDGING…' : 'SUBMIT FOR JUDGING →'} onPress={submit} loading={submitting} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  uploadWrap: { paddingHorizontal: 20, paddingTop: 4 },
  upload: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(232,52,26,0.4)',
    borderRadius: 16,
    backgroundColor: colors.surfaceDeep,
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  preview: { width: '100%', height: 240 },
  uploadBig: { fontSize: 42, marginBottom: 10 },
  uploadTxt: { fontSize: 13, fontFamily: fonts.bodyMedium, color: colors.text, marginBottom: 4 },
  uploadHint: { fontSize: 11, color: colors.textFaint, fontFamily: fonts.body },
  removeBtn: { alignItems: 'center', marginTop: 8 },
  removeText: { color: colors.textDim, fontSize: 12, fontFamily: fonts.body },
  form: { paddingHorizontal: 20, marginTop: 16, gap: 12 },
  row: { flexDirection: 'row', gap: 10 },
  fieldLabel: { fontSize: 10, letterSpacing: 1.5, color: colors.textDim, fontFamily: fonts.bodyMedium, marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.surface, borderRadius: 10, borderWidth: 0.5, borderColor: colors.borderStrong },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: 12, color: colors.textMuted, fontFamily: fonts.bodyMedium },
  chipTextActive: { color: '#fff' },
});
