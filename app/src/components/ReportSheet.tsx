import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { reportContent, ReportReason, ReportSubjectKind } from '@/api/moderation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Palette } from '@/lib/theme';

const REASONS: { value: ReportReason; label: string; sub: string }[] = [
  { value: 'spam',          label: 'Spam',                  sub: 'Advertising, unwanted promo, repetitive posts' },
  { value: 'harassment',    label: 'Harassment or bullying', sub: 'Targeted attacks, threats, doxxing' },
  { value: 'hate',          label: 'Hate speech',           sub: 'Slurs, targeting a group' },
  { value: 'sexual',        label: 'Sexual content',        sub: 'Nudity or explicit material' },
  { value: 'violence',      label: 'Violence',              sub: 'Graphic imagery, threats of harm' },
  { value: 'ip_violation',  label: 'IP violation',          sub: 'Stolen photo or trademark misuse' },
  { value: 'other',         label: 'Something else',        sub: 'Add details below' },
];

export function ReportSheet({
  visible,
  onClose,
  subjectKind,
  subjectId,
  subjectLabel,
}: {
  visible: boolean;
  onClose: () => void;
  subjectKind: ReportSubjectKind;
  subjectId: string;
  subjectLabel: string;
}) {
  const { session } = useAuth();
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setReason(null);
    setNotes('');
    setSubmitting(false);
  }

  async function submit() {
    if (!session || !reason) return;
    setSubmitting(true);
    try {
      await reportContent({
        reporter_id: session.user.id,
        subject_kind: subjectKind,
        subject_id: subjectId,
        reason,
        notes: notes.trim() || undefined,
      });
      reset();
      onClose();
      Alert.alert(
        'Report received',
        'Thanks — a moderator will review it. You can also block this user to hide their posts from you.',
      );
    } catch (e: any) {
      Alert.alert('Could not send report', e?.message ?? 'Try again later.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => { reset(); onClose(); }}>
      <Pressable style={styles.backdrop} onPress={() => { reset(); onClose(); }}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.title}>REPORT</Text>
          <Text style={styles.sub}>Reporting: <Text style={{ color: C.textMid }}>{subjectLabel}</Text></Text>

          <Text style={styles.sectionLabel}>WHY</Text>
          {REASONS.map((r) => (
            <Pressable
              key={r.value}
              style={[styles.reasonRow, reason === r.value && styles.reasonRowActive]}
              onPress={() => setReason(r.value)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.reasonLabel, reason === r.value && { color: C.accent }]}>{r.label}</Text>
                <Text style={styles.reasonSub}>{r.sub}</Text>
              </View>
              {reason === r.value ? <Text style={styles.reasonCheck}>✓</Text> : null}
            </Pressable>
          ))}

          {reason ? (
            <>
              <Text style={styles.sectionLabel}>NOTES (optional)</Text>
              <TextInput
                style={styles.notes}
                placeholder="Anything the moderator should know…"
                placeholderTextColor={C.textDim}
                value={notes}
                onChangeText={setNotes}
                multiline
                maxLength={400}
              />
            </>
          ) : null}

          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={() => { reset(); onClose(); }}>
              <Text style={styles.cancelText}>CANCEL</Text>
            </Pressable>
            <Pressable
              style={[styles.submitBtn, (!reason || submitting) && { opacity: 0.4 }]}
              onPress={submit}
              disabled={!reason || submitting}
            >
              {submitting ? (
                <ActivityIndicator color={C.onAccent} />
              ) : (
                <Text style={styles.submitText}>SUBMIT REPORT</Text>
              )}
            </Pressable>
          </View>
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
      paddingHorizontal: 20, paddingTop: 10, paddingBottom: 32,
      maxHeight: '92%',
    },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.borderMid, alignSelf: 'center', marginBottom: 14 },
    title: { fontFamily: 'BebasNeue_400Regular', fontSize: 22, letterSpacing: 3, color: C.redHud, marginBottom: 4 },
    sub: { fontFamily: 'DMSans_300Light', fontSize: 13, color: C.textDim, marginBottom: 12 },
    sectionLabel: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 9, letterSpacing: 1.5, color: C.textDim, marginTop: 14, marginBottom: 8 },
    reasonRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingVertical: 12, paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1, borderColor: C.border,
      backgroundColor: C.surface2,
      marginBottom: 6,
    },
    reasonRowActive: { borderColor: C.borderGold },
    reasonLabel: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: C.text },
    reasonSub: { fontFamily: 'DMSans_300Light', fontSize: 12, color: C.textDim, marginTop: 2 },
    reasonCheck: { fontFamily: 'DMSans_500Medium', fontSize: 18, color: C.accent },
    notes: {
      backgroundColor: C.surface2,
      borderWidth: 1, borderColor: C.borderMid, borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 10,
      fontSize: 13, color: C.text, fontFamily: 'DMSans_400Regular',
      minHeight: 80, textAlignVertical: 'top',
    },
    actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
    cancelBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 30, borderWidth: 1, borderColor: C.borderMid },
    cancelText: { fontFamily: 'DMSans_500Medium', fontSize: 12, letterSpacing: 1.5, color: C.textMid },
    submitBtn: { flex: 1.5, alignItems: 'center', paddingVertical: 14, borderRadius: 30, backgroundColor: C.redHud },
    submitText: { fontFamily: 'DMSans_500Medium', fontSize: 12, letterSpacing: 1.5, color: '#FFFFFF' },
  });
}
