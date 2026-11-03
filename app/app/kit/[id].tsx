import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { deleteKit, fetchKit, Kit } from '@/api/kits';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Palette } from '@/lib/theme';

function gradeColor(grade: string, C: Palette) {
  const up = grade.toUpperCase();
  if (up === 'MG') return { color: C.accent, border: C.borderGold };
  if (up === 'RG') return { color: C.blueHud, border: 'rgba(41,82,204,0.4)' };
  if (up === 'PG') return { color: '#F0997B', border: 'rgba(240,153,123,0.4)' };
  return { color: C.textMid, border: C.borderMid };
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function KitDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);

  const [kit, setKit] = useState<Kit | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const k = await fetchKit(id);
        if (!k) setNotFound(true);
        else setKit(k);
      } catch (e: any) {
        console.warn('kit load failed', e?.message ?? e);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function runDelete() {
    if (!kit) return;
    setDeleting(true);
    try {
      await deleteKit(kit.id);
      setDeleteOpen(false);
      router.back();
    } catch (e: any) {
      setDeleteOpen(false);
      setDeleting(false);
      Alert.alert('Failed', e?.message ?? 'Could not delete.');
    }
  }

  if (loading) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={C.accent} />
        </SafeAreaView>
      </View>
    );
  }

  if (notFound || !kit) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={styles.header}>
            <Pressable style={styles.iconBtn} onPress={() => router.back()} hitSlop={8}>
              <Svg width={14} height={14} viewBox="0 0 14 14">
                <Path d="M9 11L5 7L9 3" stroke={C.textMid} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </Pressable>
            <Text style={styles.headerTitle}>KIT</Text>
            <View style={{ width: 36 }} />
          </View>
          <View style={styles.notFound}>
            <Text style={styles.notFoundTitle}>Kit not found</Text>
            <Text style={styles.notFoundBody}>It may have been deleted.</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const g = gradeColor(kit.grade, C);
  const owner = session?.user.id === kit.user_id;

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()} hitSlop={8}>
            <Svg width={14} height={14} viewBox="0 0 14 14">
              <Path d="M9 11L5 7L9 3" stroke={C.textMid} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
          <Text style={styles.headerTitle}>KIT</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Pressable
              style={styles.photoWrap}
              onPress={() => kit.photo_url && setLightboxOpen(true)}
              disabled={!kit.photo_url}
            >
              {kit.photo_url ? (
                <Image source={{ uri: kit.photo_url }} style={styles.photo} resizeMode="cover" />
              ) : (
                <Text style={styles.photoFallback}>🤖</Text>
              )}
              <View style={[styles.gradeChip, { borderColor: g.border }]}>
                <Text style={[styles.gradeChipText, { color: g.color }]}>{kit.grade.toUpperCase()}</Text>
              </View>
            </Pressable>

            <View style={styles.body}>
              <Text style={styles.kitName}>{kit.kit_name}</Text>
              {kit.series ? <Text style={styles.series}>{kit.series}</Text> : null}

              <View style={styles.metaRow}>
                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>LOGGED</Text>
                  <Text style={styles.metaValue}>{fmtDate(kit.created_at)}</Text>
                </View>
                <View style={styles.metaCell}>
                  <Text style={styles.metaLabel}>GRADE</Text>
                  <Text style={styles.metaValue}>{kit.grade.toUpperCase()}</Text>
                </View>
              </View>

              {kit.notes ? (
                <View style={styles.notesWrap}>
                  <Text style={styles.notesLabel}>NOTES</Text>
                  <Text style={styles.notesBody}>{kit.notes}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {owner ? (
            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.85 }]}
                onPress={() => router.push(`/(tabs)/judge?kitId=${kit.id}` as any)}
              >
                <Text style={styles.btnPrimaryText}>SEND TO PILOT'S REVIEW</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.btnDanger, pressed && { opacity: 0.85 }]}
                onPress={() => setDeleteOpen(true)}
              >
                <Text style={styles.btnDangerText}>DELETE KIT</Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>

      <Modal visible={lightboxOpen} transparent animationType="fade" onRequestClose={() => setLightboxOpen(false)}>
        <Pressable style={styles.lightboxScrim} onPress={() => setLightboxOpen(false)}>
          {kit.photo_url ? (
            <Image source={{ uri: kit.photo_url }} style={styles.lightboxImg} resizeMode="contain" />
          ) : null}
          <Pressable style={styles.lightboxClose} onPress={() => setLightboxOpen(false)} hitSlop={12}>
            <Text style={styles.lightboxCloseText}>✕</Text>
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmDialog
        visible={deleteOpen}
        title="DELETE KIT?"
        body={`Remove "${kit.kit_name}" from your hangar? This can't be undone.`}
        confirmLabel="DELETE"
        destructive
        busy={deleting}
        onConfirm={runDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </View>
  );
}

function makeStyles(C: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },

    header: {
      paddingHorizontal: 20, paddingVertical: 12,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      borderBottomWidth: 1, borderBottomColor: C.border,
    },
    iconBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: C.surface, borderWidth: 1, borderColor: C.borderMid,
      alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 20, letterSpacing: 3, color: C.text },

    notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    notFoundTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 24, letterSpacing: 2, color: C.text, marginBottom: 8 },
    notFoundBody: { fontFamily: 'DMSans_300Light', fontSize: 14, color: C.textMid, textAlign: 'center' },

    card: {
      marginHorizontal: 20, marginTop: 14,
      backgroundColor: C.surface,
      borderWidth: 1, borderColor: C.border,
      borderRadius: 16,
      overflow: 'hidden',
    },
    photoWrap: {
      width: '100%', maxWidth: 220, aspectRatio: 2 / 3, alignSelf: 'center',
      marginTop: 18,
      borderRadius: 12, overflow: 'hidden',
      backgroundColor: C.surface2,
      alignItems: 'center', justifyContent: 'center',
      position: 'relative',
    },
    photo: { width: '100%', height: '100%' },
    photoFallback: { fontSize: 60 },
    gradeChip: {
      position: 'absolute', top: 12, left: 12,
      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1,
      backgroundColor: C.bg,
    },
    gradeChipText: { fontFamily: 'BebasNeue_400Regular', fontSize: 12, letterSpacing: 2 },

    body: { padding: 18 },
    kitName: { fontFamily: 'DMSans_500Medium', fontSize: 18, color: C.text, marginBottom: 2 },
    series: { fontFamily: 'DMSans_300Light', fontSize: 14, color: C.textMid, marginBottom: 14 },

    metaRow: { flexDirection: 'row', gap: 20, marginBottom: 14 },
    metaCell: { flex: 1 },
    metaLabel: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, letterSpacing: 1.5, color: C.textDim, marginBottom: 3 },
    metaValue: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: C.text },

    notesWrap: { paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
    notesLabel: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, letterSpacing: 1.5, color: C.textDim, marginBottom: 4 },
    notesBody: { fontFamily: 'DMSans_300Light', fontSize: 14, color: C.textMid, lineHeight: 20 },

    actions: { paddingHorizontal: 20, marginTop: 16, gap: 10 },
    btnPrimary: {
      backgroundColor: C.accent,
      paddingVertical: 14, borderRadius: 24,
      alignItems: 'center', justifyContent: 'center',
    },
    btnPrimaryText: { fontFamily: 'DMSans_500Medium', fontSize: 13, letterSpacing: 2, color: '#FFFFFF' },
    btnDanger: {
      backgroundColor: 'transparent',
      borderWidth: 1, borderColor: C.redHud,
      paddingVertical: 13, borderRadius: 24,
      alignItems: 'center', justifyContent: 'center',
    },
    btnDangerText: { fontFamily: 'DMSans_500Medium', fontSize: 13, letterSpacing: 2, color: C.redHud },

    lightboxScrim: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.92)',
      alignItems: 'center', justifyContent: 'center',
    },
    lightboxImg: { width: '100%', height: '100%' },
    lightboxClose: {
      position: 'absolute', top: 44, right: 20,
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.1)',
      alignItems: 'center', justifyContent: 'center',
    },
    lightboxCloseText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'DMSans_500Medium' },
  });
}
