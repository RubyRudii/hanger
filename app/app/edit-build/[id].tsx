import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';
import { fetchBuild, updateBuild } from '@/api/builds';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Palette } from '@/lib/theme';

const GRADES = ['HG', 'MG', 'RG', 'PG', 'FM', 'SD', 'Other'];

export default function EditBuild() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notAllowed, setNotAllowed] = useState(false);
  const [kitName, setKitName] = useState('');
  const [grade, setGrade] = useState('MG');
  const [mods, setMods] = useState('');
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !session) return;
    (async () => {
      try {
        const b = await fetchBuild(id);
        if (!b || b.user_id !== session.user.id) {
          setNotAllowed(true);
          return;
        }
        setKitName(b.kit_name);
        setGrade(b.grade);
        setMods(b.modifications ?? '');
      } catch (e) {
        console.warn('load build failed', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, session]);

  async function save() {
    if (!id) return;
    if (!kitName.trim()) {
      Alert.alert('Kit name required', 'Give your build a name.');
      return;
    }
    setSaving(true);
    try {
      await updateBuild(id, {
        kit_name: kitName.trim(),
        grade,
        modifications: mods.trim() || undefined,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Could not save', e?.message ?? 'Try again later.');
    } finally {
      setSaving(false);
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

  if (notAllowed) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.cancel}>CLOSE</Text>
            </Pressable>
            <Text style={styles.title}>EDIT BUILD</Text>
            <View style={{ width: 60 }} />
          </View>
          <View style={{ padding: 32, alignItems: 'center' }}>
            <Text style={{ color: C.textDim, textAlign: 'center', fontFamily: 'DMSans_300Light', fontSize: 14 }}>
              This build isn't yours to edit.
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

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
          <Text style={styles.title}>EDIT BUILD</Text>
          <Pressable onPress={save} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={C.accent} size="small" />
            ) : (
              <Text style={styles.saveLink}>SAVE</Text>
            )}
          </Pressable>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
            <Text style={styles.note}>
              Kit name, grade, and modifications are editable. Scores and pilot's notes stay locked — those are the AI's read of the photo you submitted.
            </Text>

            <Text style={styles.fieldLabel}>▸ KIT NAME</Text>
            <TextInput
              style={[styles.input, focused === 'name' && styles.inputFocus]}
              placeholder="e.g. RX-78-2 Gundam"
              placeholderTextColor={C.textDim}
              value={kitName}
              onChangeText={setKitName}
              onFocus={() => setFocused('name')}
              onBlur={() => setFocused(null)}
              maxLength={80}
            />

            <Text style={styles.fieldLabel}>▸ GRADE</Text>
            <View style={styles.chipRow}>
              {GRADES.map((g) => (
                <Pressable key={g} style={[styles.chip, grade === g && styles.chipActive]} onPress={() => setGrade(g)}>
                  <Text style={[styles.chipText, grade === g && styles.chipTextActive]}>{g}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>▸ MODIFICATIONS</Text>
            <TextInput
              style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }, focused === 'mods' && styles.inputFocus]}
              placeholder="Panel lined + weathered, top coat, etc."
              placeholderTextColor={C.textDim}
              value={mods}
              onChangeText={setMods}
              onFocus={() => setFocused('mods')}
              onBlur={() => setFocused(null)}
              multiline
              maxLength={280}
            />
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
    saveLink: { fontFamily: 'DMSans_500Medium', fontSize: 12, letterSpacing: 1.5, color: C.accent },
    title: { fontFamily: 'BebasNeue_400Regular', fontSize: 18, letterSpacing: 3, color: C.text },

    note: {
      backgroundColor: C.surface2,
      borderWidth: 1, borderColor: C.borderMid,
      borderRadius: 10,
      paddingHorizontal: 14, paddingVertical: 12,
      fontSize: 12, color: C.textMid, lineHeight: 18,
      fontFamily: 'DMSans_300Light',
      marginBottom: 20,
    },
    fieldLabel: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, letterSpacing: 1.5, color: C.accent, marginBottom: 6, marginTop: 4 },
    input: {
      backgroundColor: C.surface,
      borderWidth: 1, borderColor: C.borderMid, borderRadius: 10,
      paddingHorizontal: 14, paddingVertical: 12,
      fontSize: 15, color: C.text, fontFamily: 'DMSans_400Regular',
      marginBottom: 12,
    },
    inputFocus: { borderColor: C.borderGold },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: C.borderMid, borderRadius: 10, backgroundColor: C.surface },
    chipActive: { backgroundColor: C.accent, borderColor: C.accent },
    chipText: { fontSize: 13, color: C.textMid, fontFamily: 'DMSans_500Medium' },
    chipTextActive: { color: C.onAccent },
  });
}
