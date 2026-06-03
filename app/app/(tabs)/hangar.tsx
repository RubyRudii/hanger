import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Line, Path, Pattern, Rect } from 'react-native-svg';
import { createKit, deleteKit, Kit, listKits, uploadKitPhoto } from '@/api/kits';
import { useAuth } from '@/context/AuthContext';

const C = {
  bg: '#050918',
  surface: '#0B1530',
  surface2: '#0F1C3A',
  accent: '#C9A84C',
  accentDim: 'rgba(201,168,76,0.13)',
  accentRing: 'rgba(201,168,76,0.28)',
  goldLight: '#F0D98A',
  white: '#FFFFFF',
  textMid: 'rgba(255,255,255,0.62)',
  textDim: 'rgba(255,255,255,0.32)',
  textFaint: 'rgba(255,255,255,0.18)',
  border: 'rgba(255,255,255,0.06)',
  borderMid: 'rgba(255,255,255,0.10)',
  borderGold: 'rgba(201,168,76,0.22)',
  royalBright: '#2952CC',
  blueHud: '#7FA4FF',
};

const GRADES = ['HG', 'MG', 'RG', 'PG', 'FM', 'SD', 'Other'];

function gradeColor(grade: string) {
  const up = grade.toUpperCase();
  if (up === 'MG') return { color: C.accent, border: C.borderGold };
  if (up === 'RG') return { color: C.blueHud, border: 'rgba(41,82,204,0.4)' };
  if (up === 'PG') return { color: '#F0997B', border: 'rgba(240,153,123,0.4)' };
  return { color: C.textMid, border: C.borderMid };
}

function timeAgoShort(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  if (d < 604800) return `${Math.floor(d / 86400)}d ago`;
  if (d < 2592000) return `${Math.floor(d / 604800)}w ago`;
  return `${Math.floor(d / 2592000)}mo ago`;
}

export default function Hangar() {
  const { session } = useAuth();
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const data = await listKits(session.user.id);
      setKits(data);
    } catch (e: any) {
      console.warn('hangar load failed', e?.message ?? e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  function confirmDelete(kit: Kit) {
    Alert.alert(
      'Remove from hangar',
      `Delete "${kit.kit_name}" from your collection log?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteKit(kit.id);
              setKits((prev) => prev.filter((k) => k.id !== kit.id));
            } catch (e: any) {
              Alert.alert('Failed', e?.message ?? 'Could not delete.');
            }
          },
        },
      ],
    );
  }

  const mgCount = kits.filter((k) => k.grade.toUpperCase() === 'MG').length;
  const hgCount = kits.filter((k) => k.grade.toUpperCase() === 'HG').length;
  const rgCount = kits.filter((k) => k.grade.toUpperCase() === 'RG').length;

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern id="g" patternUnits="userSpaceOnUse" width={32} height={32}>
              <Line x1="0" y1="0" x2="32" y2="0" stroke="rgba(41,82,204,0.05)" strokeWidth={1} />
              <Line x1="0" y1="0" x2="0" y2="32" stroke="rgba(41,82,204,0.05)" strokeWidth={1} />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#g)" />
        </Svg>
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>MY HANGAR</Text>
            <Text style={styles.headerSub}>// COLLECTION LOG</Text>
          </View>
          <Pressable style={styles.addBtn} onPress={() => setAddOpen(true)}>
            <Svg width={14} height={14} viewBox="0 0 14 14">
              <Path d="M7 2V12M2 7H12" stroke={C.goldLight} strokeWidth={1.5} strokeLinecap="round" />
            </Svg>
            <Text style={styles.addBtnText}>LOG KIT</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={C.accent} />
          </View>
        ) : (
          <FlatList
            data={kits}
            keyExtractor={(k) => k.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 10 }}
            refreshControl={
              <RefreshControl
                tintColor={C.accent}
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  load();
                }}
              />
            }
            ListHeaderComponent={
              <View style={styles.statsCard}>
                <View style={styles.statsCardGlow} pointerEvents="none" />
                <View style={styles.statCell}>
                  <Text style={styles.statNum}>{kits.length}</Text>
                  <Text style={styles.statLabel}>TOTAL</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCell}>
                  <Text style={[styles.statNum, { color: C.accent }]}>{mgCount}</Text>
                  <Text style={styles.statLabel}>MG</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCell}>
                  <Text style={[styles.statNum, { color: C.blueHud }]}>{rgCount}</Text>
                  <Text style={styles.statLabel}>RG</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCell}>
                  <Text style={styles.statNum}>{hgCount}</Text>
                  <Text style={styles.statLabel}>HG</Text>
                </View>
              </View>
            }
            renderItem={({ item }) => <KitRow kit={item} onLongPress={() => confirmDelete(item)} />}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>HANGAR EMPTY</Text>
                <Text style={styles.emptyText}>
                  Log every kit you own, are building, or have your eye on.{'\n'}
                  No judging. No score. Just inventory.
                </Text>
                <Pressable style={styles.cta} onPress={() => setAddOpen(true)}>
                  <Text style={styles.ctaText}>+ LOG FIRST KIT</Text>
                </Pressable>
              </View>
            }
          />
        )}
      </SafeAreaView>

      <AddKitSheet visible={addOpen} onClose={() => setAddOpen(false)} onCreated={(k) => {
        setKits((prev) => [k, ...prev]);
        setAddOpen(false);
      }} />
    </View>
  );
}

function KitRow({ kit, onLongPress }: { kit: Kit; onLongPress: () => void }) {
  const pip = gradeColor(kit.grade);
  return (
    <Pressable style={styles.kitRow} onLongPress={onLongPress}>
      <View style={styles.kitThumb}>
        {kit.photo_url ? (
          <Image source={{ uri: kit.photo_url }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <Text style={{ fontSize: 26 }}>📦</Text>
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.kitName} numberOfLines={1}>{kit.kit_name}</Text>
        <View style={styles.kitMetaRow}>
          <View style={[styles.kitGradePip, { borderColor: pip.border }]}>
            <Text style={[styles.kitGradePipText, { color: pip.color }]}>{kit.grade.toUpperCase()}</Text>
          </View>
          {kit.series ? <Text style={styles.kitMeta}>{kit.series}</Text> : null}
          <Text style={styles.kitMetaDim}>· {timeAgoShort(kit.created_at)}</Text>
        </View>
        {kit.notes ? (
          <Text style={styles.kitNotes} numberOfLines={2}>{kit.notes}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function AddKitSheet({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: (k: Kit) => void;
}) {
  const { session } = useAuth();
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('MG');
  const [series, setSeries] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(''); setGrade('MG'); setSeries(''); setNotes(''); setPhoto(null);
    }
  }, [visible]);

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
      const k = await createKit({
        user_id: session.user.id,
        kit_name: name.trim(),
        grade,
        series: series.trim() || undefined,
        notes: notes.trim() || undefined,
        photo_url: photoUrl,
      });
      onCreated(k);
    } catch (e: any) {
      Alert.alert('Failed to log kit', e?.message ?? 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>LOG A KIT</Text>
          <Text style={styles.sheetSub}>Add to your collection — no judging, no score.</Text>

          <ScrollView style={{ maxHeight: 520 }} keyboardShouldPersistTaps="handled">
            <Pressable style={styles.photoPicker} onPress={pickPhoto}>
              {photo ? (
                <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={{ fontSize: 32 }}>📦</Text>
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

            <Text style={styles.fieldLabel}>▸ SERIES (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Universal Century, 0083"
              placeholderTextColor={C.textDim}
              value={series}
              onChangeText={setSeries}
            />

            <Text style={styles.fieldLabel}>▸ NOTES (optional)</Text>
            <TextInput
              style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
              placeholder="Build plans, where you bought it, etc."
              placeholderTextColor={C.textDim}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </ScrollView>

          <View style={styles.sheetActions}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>CANCEL</Text>
            </Pressable>
            <Pressable style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator color="#0A0F1E" /> : <Text style={styles.saveBtnText}>LOG KIT</Text>}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    paddingHorizontal: 20, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 22, letterSpacing: 3, color: C.white, lineHeight: 22 },
  headerSub: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, letterSpacing: 1.5, color: C.textDim, marginTop: 3 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(41,82,204,0.4)',
    borderWidth: 1, borderColor: C.borderGold,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
  },
  addBtnText: { fontFamily: 'DMSans_500Medium', fontSize: 10, letterSpacing: 1.5, color: C.goldLight },

  statsCard: {
    marginTop: 16, marginBottom: 16,
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.borderGold, borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center',
    overflow: 'hidden', position: 'relative',
  },
  statsCardGlow: { position: 'absolute', top: -80, right: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(201,168,76,0.08)' },
  statCell: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: C.border },
  statNum: { fontFamily: 'BebasNeue_400Regular', fontSize: 22, letterSpacing: 1, color: C.white, lineHeight: 22 },
  statLabel: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 8, letterSpacing: 1.5, color: C.textDim, marginTop: 5 },

  kitRow: {
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.border, borderRadius: 14,
    padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  kitThumb: {
    width: 54, height: 54, borderRadius: 10,
    backgroundColor: C.surface2,
    borderWidth: 1, borderColor: C.borderMid,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  kitName: { fontSize: 14, color: C.white, fontFamily: 'DMSans_500Medium', marginBottom: 4 },
  kitMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  kitGradePip: { paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderRadius: 3, backgroundColor: 'rgba(5,9,24,0.85)' },
  kitGradePipText: { fontFamily: 'BebasNeue_400Regular', fontSize: 9, letterSpacing: 1 },
  kitMeta: { fontSize: 11, color: C.textMid, fontFamily: 'DMSans_400Regular' },
  kitMetaDim: { fontSize: 11, color: C.textDim, fontFamily: 'JetBrainsMono_400Regular' },
  kitNotes: { fontSize: 11, color: C.textMid, fontFamily: 'DMSans_300Light', marginTop: 6, lineHeight: 16 },

  empty: { paddingHorizontal: 32, paddingVertical: 50, alignItems: 'center', gap: 12 },
  emptyTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 22, letterSpacing: 3, color: C.textMid },
  emptyText: { color: C.textDim, textAlign: 'center', fontFamily: 'DMSans_300Light', fontSize: 13, lineHeight: 21 },
  cta: { backgroundColor: C.accent, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, marginTop: 6 },
  ctaText: { color: '#0A0F1E', fontFamily: 'DMSans_500Medium', fontSize: 12, letterSpacing: 1.5 },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(5,9,24,0.75)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderColor: C.borderGold,
    paddingHorizontal: 22, paddingTop: 10, paddingBottom: 28,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: C.borderMid,
    alignSelf: 'center', marginBottom: 14,
  },
  sheetTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 22, letterSpacing: 3, color: C.accent },
  sheetSub: { fontFamily: 'DMSans_300Light', fontSize: 12, color: C.textDim, marginTop: 2, marginBottom: 16 },

  photoPicker: { width: '100%', height: 140, borderRadius: 14, overflow: 'hidden', marginBottom: 16, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.borderMid, borderStyle: 'dashed' },
  photoPreview: { width: '100%', height: '100%' },
  photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  photoHint: { color: C.textDim, fontSize: 11, fontFamily: 'DMSans_300Light' },

  fieldLabel: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, letterSpacing: 1.5, color: C.accent, marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: C.surface2,
    borderWidth: 1, borderColor: C.borderMid, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 13, color: C.white, fontFamily: 'DMSans_400Regular',
    marginBottom: 12,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: C.borderMid, borderRadius: 10, backgroundColor: C.surface2 },
  chipActive: { backgroundColor: C.accent, borderColor: C.accent },
  chipText: { fontSize: 12, color: C.textMid, fontFamily: 'DMSans_500Medium' },
  chipTextActive: { color: '#0A0F1E' },

  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: C.borderMid, borderRadius: 30, paddingVertical: 13, alignItems: 'center' },
  cancelBtnText: { fontFamily: 'DMSans_500Medium', fontSize: 12, letterSpacing: 2, color: C.textMid },
  saveBtn: { flex: 1.5, backgroundColor: C.accent, borderRadius: 30, paddingVertical: 13, alignItems: 'center' },
  saveBtnText: { fontFamily: 'DMSans_500Medium', fontSize: 12, letterSpacing: 2, color: '#0A0F1E' },
});
