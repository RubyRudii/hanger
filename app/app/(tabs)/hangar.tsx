import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Line, Path, Pattern, Rect } from 'react-native-svg';
import { deleteKit, Kit, listKits } from '@/api/kits';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
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
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Kit | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    setPendingDelete(kit);
  }

  async function runDelete() {
    if (!pendingDelete) return;
    const kit = pendingDelete;
    setDeleting(true);
    try {
      await deleteKit(kit.id);
      setKits((prev) => prev.filter((k) => k.id !== kit.id));
      setPendingDelete(null);
    } catch (e: any) {
      setPendingDelete(null);
      Alert.alert('Failed', e?.message ?? 'Could not delete.');
    } finally {
      setDeleting(false);
    }
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
              <Line x1="0" y1="0" x2="32" y2="0" stroke={C.gridLine} strokeWidth={1} />
              <Line x1="0" y1="0" x2="0" y2="32" stroke={C.gridLine} strokeWidth={1} />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#g)" />
        </Svg>
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>MY HANGAR</Text>
            <Text style={styles.headerSub}>COLLECTION LOG</Text>
          </View>
          <Pressable style={styles.addBtn} onPress={() => router.push('/add-kit')}>
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
                  <Text style={styles.statNum}>{rgCount}</Text>
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
              <EmptyState
                icon={<Text style={{ fontSize: 32 }}>📦</Text>}
                title="HANGAR EMPTY"
                body={'Log every kit you own, are building, or have your eye on.\nNo judging. No score. Just inventory.'}
                ctaLabel="+ LOG FIRST KIT"
                onCta={() => router.push('/add-kit')}
              />
            }
          />
        )}
      </SafeAreaView>
      <ConfirmDialog
        visible={!!pendingDelete}
        title="REMOVE FROM HANGAR?"
        body={pendingDelete ? `Delete "${pendingDelete.kit_name}" from your collection log?` : undefined}
        confirmLabel="DELETE"
        destructive
        busy={deleting}
        onConfirm={runDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </View>
  );
}

function KitRow({ kit, onLongPress }: { kit: Kit; onLongPress: () => void }) {
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const pip = gradeColor(kit.grade, C);
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
<Text style={styles.kitMetaDim}>· {timeAgoShort(kit.created_at)}</Text>
        </View>
        {kit.notes ? (
          <Text style={styles.kitNotes} numberOfLines={2}>{kit.notes}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function makeStyles(C: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    header: {
      paddingHorizontal: 20, paddingVertical: 14,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      borderBottomWidth: 1, borderBottomColor: C.border,
    },
    headerTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 22, letterSpacing: 3, color: C.text, lineHeight: 22 },
    headerSub: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 12, letterSpacing: 1.5, color: C.textDim, marginTop: 3 },
    addBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: C.royalSoft,
      borderWidth: 1, borderColor: C.borderGold,
      borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
    },
    addBtnText: { fontFamily: 'DMSans_500Medium', fontSize: 12, letterSpacing: 1.5, color: C.goldLight },

    statsCard: {
      marginTop: 16, marginBottom: 16,
      backgroundColor: C.surface,
      borderWidth: 1, borderColor: C.borderGold, borderRadius: 16,
      paddingVertical: 14,
      flexDirection: 'row', alignItems: 'center',
      overflow: 'hidden', position: 'relative',
    },
    statsCardGlow: { position: 'absolute', top: -80, right: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: C.accentSoft },
    statCell: { flex: 1, alignItems: 'center' },
    statDivider: { width: 1, height: 32, backgroundColor: C.border },
    statNum: { fontFamily: 'BebasNeue_400Regular', fontSize: 22, letterSpacing: 1, color: C.text, lineHeight: 22 },
    statLabel: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, letterSpacing: 0.6, color: C.textDim, marginTop: 5 },

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
    kitName: { fontSize: 16, color: C.text, fontFamily: 'DMSans_500Medium', marginBottom: 4 },
    kitMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
    kitGradePip: { paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderRadius: 3, backgroundColor: C.bg },
    kitGradePipText: { fontFamily: 'BebasNeue_400Regular', fontSize: 11, letterSpacing: 1 },
    kitMeta: { fontSize: 13, color: C.textMid, fontFamily: 'DMSans_400Regular' },
    kitMetaDim: { fontSize: 13, color: C.textDim, fontFamily: 'JetBrainsMono_400Regular' },
    kitNotes: { fontSize: 13, color: C.textMid, fontFamily: 'DMSans_300Light', marginTop: 6, lineHeight: 16 },

    empty: { paddingHorizontal: 32, paddingVertical: 50, alignItems: 'center', gap: 12 },
    emptyTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 22, letterSpacing: 3, color: C.textMid },
    emptyText: { color: C.textDim, textAlign: 'center', fontFamily: 'DMSans_300Light', fontSize: 15, lineHeight: 21 },
    cta: { backgroundColor: C.accent, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, marginTop: 6 },
    ctaText: { color: C.onAccent, fontFamily: 'DMSans_500Medium', fontSize: 14, letterSpacing: 1.5 },
  });
}
