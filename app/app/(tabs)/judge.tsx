import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Modal,
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
import Svg, { Circle, Defs, Line, Path, Pattern, Rect } from 'react-native-svg';
import { createBuild, uploadPhoto } from '@/api/builds';
import { JudgeError, judgeBuild } from '@/api/judge';
import * as Sentry from '@sentry/react-native';
import { hasAccess, useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Palette } from '@/lib/theme';
import { Paywall } from '@/components/Paywall';

const GRADES = [
  { value: 'HG', label: 'HG — High Grade' },
  { value: 'MG', label: 'MG — Master Grade' },
  { value: 'RG', label: 'RG — Real Grade' },
  { value: 'PG', label: 'PG — Perfect Grade' },
  { value: 'FM', label: 'FM — Full Mechanics' },
];

const SCALES = ['1/144', '1/100', '1/60', '1/48'];

const MODS = [
  'Out of box (snap fit)',
  'Panel lined only',
  'Panel lined + weathered',
  'Top coat applied',
  'Full paint job',
  'Custom paint / kitbash',
  'Diorama / scene',
];

function buildReviewId() {
  const yr = new Date().getFullYear();
  const n = Math.floor(10000 + Math.random() * 89999);
  return `PR-${yr}-${n}`;
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function JudgeScreen() {
  const { profile } = useAuth();
  if (!hasAccess(profile)) return <Paywall />;
  return <Judge />;
}

function Judge() {
  const { session, profile } = useAuth();
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [kitName, setKitName] = useState('');
  const [grade, setGrade] = useState('MG');
  const [scale, setScale] = useState('1/100');
  const [series, setSeries] = useState('');
  const [mods, setMods] = useState('Panel lined + weathered');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [showGrade, setShowGrade] = useState(false);
  const [showScale, setShowScale] = useState(false);
  const [showMods, setShowMods] = useState(false);
  const [reviewStage, setReviewStage] = useState<{ text: string; pct: number } | null>(null);
  const reviewId = useRef(buildReviewId()).current;

  const scanY = useRef(new Animated.Value(0)).current;
  const orbSpin = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(scanY, { toValue: 1, duration: 8000, useNativeDriver: true, easing: Easing.linear })
    ).start();
    Animated.loop(
      Animated.timing(orbSpin, { toValue: 1, duration: 3000, useNativeDriver: true, easing: Easing.linear })
    ).start();
  }, []);

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
      Alert.alert('No visual recon', 'Add at least one photo of your kit.');
      return;
    }
    if (!kitName.trim()) {
      Alert.alert('Designation required', 'Mobile Suit designation cannot be blank.');
      return;
    }
    setSubmitting(true);

    const stages = [
      { pct: 15, text: 'Establishing secure connection...' },
      { pct: 35, text: 'Pilot reviewing visual recon...' },
      { pct: 55, text: 'Analyzing panel lining...' },
      { pct: 72, text: 'Assessing finish quality...' },
      { pct: 88, text: 'Evaluating combat readiness...' },
    ];
    let i = 0;
    setReviewStage(stages[0]);
    Animated.timing(progress, { toValue: stages[0].pct / 100, duration: 500, useNativeDriver: false }).start();
    const stageTimer = setInterval(() => {
      i++;
      if (i < stages.length) {
        setReviewStage(stages[i]);
        Animated.timing(progress, { toValue: stages[i].pct / 100, duration: 500, useNativeDriver: false }).start();
      }
    }, 1400);

    try {
      const mime = photo.mimeType ?? 'image/jpeg';
      const ext = mime.split('/')[1] ?? 'jpg';
      const result = await judgeBuild({
        photo_base64: photo.base64,
        photo_mime: mime,
        kit_name: kitName.trim(),
        grade,
        series: series.trim(),
        modifications: notes.trim() ? `${mods} — ${notes.trim()}` : mods,
      });
      const photoUrl = await uploadPhoto(session.user.id, photo.base64, ext);
      const id = await createBuild({
        user_id: session.user.id,
        kit_name: kitName.trim(),
        grade,
        series: series.trim(),
        modifications: notes.trim() ? `${mods} — ${notes.trim()}` : mods,
        photo_url: photoUrl,
        result,
      });
      clearInterval(stageTimer);
      setReviewStage({ pct: 100, text: 'Debrief complete!' });
      Animated.timing(progress, { toValue: 1, duration: 400, useNativeDriver: false }).start(() => {
        setTimeout(() => {
          setSubmitting(false);
          setReviewStage(null);
          progress.setValue(0);
          router.push(`/build/${id}`);
          setPhoto(null);
          setKitName('');
          setSeries('');
          setNotes('');
        }, 500);
      });
    } catch (e: any) {
      clearInterval(stageTimer);
      setSubmitting(false);
      setReviewStage(null);
      progress.setValue(0);
      if (e instanceof JudgeError) {
        // Log the raw error to Sentry regardless — we want to know when users hit these
        Sentry.captureException(new Error(`Judge failed [${e.code}]: ${e.raw ?? e.message}`), {
          tags: { judge_code: e.code },
        });
        Alert.alert(e.userTitle, e.userMessage);
      } else {
        Sentry.captureException(e);
        Alert.alert('Pilot review failed', e?.message ?? 'Something went wrong.');
      }
    }
  }

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
      <Animated.View
        style={[
          styles.scanLine,
          { transform: [{ translateY: scanY.interpolate({ inputRange: [0, 1], outputRange: [0, 900] }) }] },
        ]}
        pointerEvents="none"
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Svg width={14} height={14} viewBox="0 0 14 14">
              <Path d="M9 11L5 7L9 3" stroke="rgba(255,255,255,0.6)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>PILOT REVIEW</Text>
            <Text style={styles.headerSub}>SUBMIT BUILD FOR EVALUATION</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {/* Intro */}
          <View style={styles.intro}>
            <View style={styles.introGlow} pointerEvents="none" />
            <Text style={styles.introEyebrow}>INCOMING TRANSMISSION</Text>
            <Text style={styles.introTitle}>"Show me what you've built."</Text>
            <Text style={styles.introBody}>
              Submit your finished kit for review by a <Text style={{ color: C.goldLight }}>senior pilot</Text>. They'll evaluate construction, finish, and combat readiness — then file an official debrief on your build.
            </Text>
          </View>

          {/* Step 1 */}
          <View style={styles.section}>
            <View style={styles.stepLabel}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>STEP 01</Text>
              </View>
              <Text style={styles.stepTitle}>
                UPLOAD <Text style={{ color: C.accent }}>VISUAL RECON</Text>
              </Text>
            </View>

            <Pressable style={styles.uploadZone} onPress={pick} onLongPress={shoot}>
              <View style={styles.uploadGlow} pointerEvents="none" />
              <View style={styles.uploadIconWrap}>
                {photo ? (
                  <Svg width={22} height={22} viewBox="0 0 22 22">
                    <Path d="M5 11L9 15L17 7" stroke={C.greenHud} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                ) : (
                  <Svg width={22} height={22} viewBox="0 0 22 22">
                    <Path d="M3 6V18C3 19.1 3.9 20 5 20H17C18.1 20 19 19.1 19 18V8L15 4H5C3.9 4 3 4.9 3 6Z" stroke={C.accent} strokeWidth={1.3} />
                    <Path d="M11 9L11 16M8 12L11 9L14 12" stroke={C.accent} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                )}
              </View>
              <Text style={[styles.uploadTitle, photo && { color: C.greenHud }]}>
                {photo ? '1 photo uploaded' : 'Upload kit photos'}
              </Text>
              <Text style={styles.uploadHint}>
                {photo ? 'Tap upload to replace · Long-press for camera' : 'Tap to add — long-press for camera'}
              </Text>
            </Pressable>

            <View style={styles.photoStrip}>
              {[0, 1, 2].map((i) => {
                const tags = ['FRONT', 'BACK', 'DETAIL'];
                const filled = i === 0 && !!photo;
                return (
                  <View key={i} style={[styles.photoSlot, filled ? styles.photoSlotFilled : styles.photoSlotEmpty]}>
                    {filled && photo ? (
                      <Image source={{ uri: photo.uri }} style={styles.photoSlotImg} />
                    ) : (
                      <Text style={styles.photoSlotPlus}>+</Text>
                    )}
                    {filled ? (
                      <View style={styles.photoTag}>
                        <Text style={styles.photoTagText}>{tags[i]}</Text>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Step 2 */}
          <View style={styles.section}>
            <View style={styles.stepLabel}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>STEP 02</Text>
              </View>
              <Text style={styles.stepTitle}>
                BUILD <Text style={{ color: C.accent }}>SPECIFICATIONS</Text>
              </Text>
            </View>

            <Field label="MOBILE SUIT DESIGNATION" required focused={focused === 'kit'}>
              <TextInput
                style={[styles.input, focused === 'kit' && styles.inputFocus]}
                placeholder="e.g. RX-78-2 Gundam"
                placeholderTextColor={C.textDim}
                value={kitName}
                onChangeText={setKitName}
                onFocus={() => setFocused('kit')}
                onBlur={() => setFocused(null)}
              />
            </Field>

            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Field label="GRADE">
                  <Pressable style={[styles.input, styles.selectInput]} onPress={() => setShowGrade(true)}>
                    <Text style={styles.selectValue}>{grade}</Text>
                    <Text style={styles.selectChev}>▾</Text>
                  </Pressable>
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="SCALE">
                  <Pressable style={[styles.input, styles.selectInput]} onPress={() => setShowScale(true)}>
                    <Text style={styles.selectValue}>{scale}</Text>
                    <Text style={styles.selectChev}>▾</Text>
                  </Pressable>
                </Field>
              </View>
            </View>

            <Field label="MODIFICATIONS APPLIED">
              <Pressable style={[styles.input, styles.selectInput]} onPress={() => setShowMods(true)}>
                <Text style={styles.selectValue} numberOfLines={1}>{mods}</Text>
                <Text style={styles.selectChev}>▾</Text>
              </Pressable>
            </Field>

            <Field label="BUILD NOTES (optional)" focused={focused === 'notes'}>
              <TextInput
                style={[styles.input, focused === 'notes' && styles.inputFocus]}
                placeholder="Tell the reviewer about your process..."
                placeholderTextColor={C.textDim}
                value={notes}
                onChangeText={setNotes}
                onFocus={() => setFocused('notes')}
                onBlur={() => setFocused(null)}
              />
            </Field>
          </View>

          {/* MS Data Sheet */}
          <View style={styles.section}>
            <View style={styles.msSheet}>
              <View style={styles.msHeader}>
                <Text style={styles.msTag}>MS DATA SHEET</Text>
                <Text style={styles.msId}>{reviewId}</Text>
              </View>
              <MsRow label="SUBMITTED BY" value={profile?.handle ? `@${profile.handle}` : '@you'} />
              <MsRow label="DATE" value={today()} mono />
              <MsRow label="REVIEWER" value="SENIOR PILOT" />
              <MsRow label="ETA" value="~30 seconds" />
            </View>
          </View>

          {/* Submit */}
          <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
            <Pressable
              style={({ pressed }) => [styles.btnSubmit, pressed && { opacity: 0.85 }, submitting && { opacity: 0.6 }]}
              onPress={submit}
              disabled={submitting}
            >
              <Svg width={16} height={16} viewBox="0 0 16 16">
                <Path d="M2 8L14 2L10 14L7 9L2 8Z" stroke={C.goldLight} strokeWidth={1.3} strokeLinejoin="round" />
              </Svg>
              <Text style={styles.btnSubmitText}>SUBMIT FOR REVIEW</Text>
            </Pressable>
            <Text style={styles.submitHint}>TRANSMISSION SECURED · AWAITING UPLINK</Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Select sheets */}
      <SelectSheet
        visible={showGrade}
        title="GRADE"
        options={GRADES.map((g) => ({ value: g.value, label: g.label }))}
        selected={grade}
        onSelect={(v) => { setGrade(v); setShowGrade(false); }}
        onClose={() => setShowGrade(false)}
      />
      <SelectSheet
        visible={showScale}
        title="SCALE"
        options={SCALES.map((s) => ({ value: s, label: s }))}
        selected={scale}
        onSelect={(v) => { setScale(v); setShowScale(false); }}
        onClose={() => setShowScale(false)}
      />
      <SelectSheet
        visible={showMods}
        title="MODIFICATIONS"
        options={MODS.map((m) => ({ value: m, label: m }))}
        selected={mods}
        onSelect={(v) => { setMods(v); setShowMods(false); }}
        onClose={() => setShowMods(false)}
      />

      {/* Review overlay */}
      <Modal visible={submitting} transparent animationType="fade">
        <View style={styles.overlay}>
          <Animated.View style={[styles.pilotOrbOuter2, { opacity: 0.1 }]} />
          <Animated.View style={[styles.pilotOrbOuter, { opacity: 0.3 }]} />
          <Animated.View
            style={[
              styles.pilotOrb,
              { transform: [{ rotate: orbSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] },
            ]}
          >
            <Animated.View
              style={[
                styles.pilotOrbInner,
                { transform: [{ rotate: orbSpin.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] }) }] },
              ]}
            >
              <Svg width={40} height={40} viewBox="0 0 32 32">
                <Circle cx={16} cy={16} r={10} stroke={C.goldLight} strokeWidth={1.5} />
                <Circle cx={13} cy={14} r={1.5} fill={C.goldLight} />
                <Circle cx={19} cy={14} r={1.5} fill={C.goldLight} />
                <Path d="M12 19C13 20.5 14.5 21 16 21C17.5 21 19 20.5 20 19" stroke={C.goldLight} strokeWidth={1.5} strokeLinecap="round" />
              </Svg>
            </Animated.View>
          </Animated.View>
          <Text style={styles.reviewStatus}>SENIOR PILOT INCOMING</Text>
          <Text style={styles.reviewSubstatus}>{reviewStage?.text ?? 'Establishing secure connection...'}</Text>
          <View style={styles.reviewProgress}>
            <Animated.View
              style={[
                styles.reviewProgressFill,
                { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
              ]}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; focused?: boolean; children: React.ReactNode }) {
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldChev}>▸</Text>
        <Text style={styles.fieldLabel}>{label}</Text>
        {required ? <Text style={styles.fieldRequired}>required</Text> : null}
      </View>
      {children}
    </View>
  );
}

function MsRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  return (
    <View style={styles.msRow}>
      <Text style={styles.msRowLabel}>{label}</Text>
      <Text style={[styles.msRowValue, mono && { fontFamily: 'JetBrainsMono_500Medium' }]}>{value}</Text>
    </View>
  );
}

function SelectSheet({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.sheetTitle}>{title}</Text>
          {options.map((o) => (
            <Pressable
              key={o.value}
              style={[styles.sheetOption, selected === o.value && styles.sheetOptionActive]}
              onPress={() => onSelect(o.value)}
            >
              <Text style={[styles.sheetOptionText, selected === o.value && styles.sheetOptionTextActive]}>{o.label}</Text>
              {selected === o.value ? <Text style={styles.sheetCheck}>✓</Text> : null}
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function makeStyles(C: Palette) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  scanLine: {
    position: 'absolute', left: 0, right: 0, top: 0, height: 1,
    backgroundColor: C.accentRing, opacity: 0.4,
  },

  header: {
    paddingHorizontal: 20, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.borderMid,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 18, letterSpacing: 3, color: C.text },
  headerSub: { fontSize: 12, letterSpacing: 1.5, color: C.textDim, marginTop: 3, fontFamily: 'DMSans_500Medium' },
  headerStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.greenHud },
  headerStatusText: { fontSize: 12, letterSpacing: 1.5, color: C.greenHud, fontFamily: 'JetBrainsMono_500Medium' },

  intro: {
    marginHorizontal: 20, marginTop: 16, marginBottom: 8,
    padding: 16, backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.borderGold, borderRadius: 14,
    overflow: 'hidden', position: 'relative',
  },
  introGlow: { position: 'absolute', top: 0, right: 0, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(201,168,76,0.10)' },
  introEyebrow: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 12, letterSpacing: 2, color: C.accent, marginBottom: 6 },
  introTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 22, letterSpacing: 1.5, color: C.text, marginBottom: 8 },
  introBody: { fontSize: 14, color: C.textMid, lineHeight: 19, fontFamily: 'DMSans_300Light' },

  section: { paddingHorizontal: 20, paddingTop: 16 },
  stepLabel: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  stepNum: {
    backgroundColor: C.accentDim,
    borderWidth: 1, borderColor: C.borderGold,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4,
  },
  stepNumText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 12, letterSpacing: 1.5, color: C.accent },
  stepTitle: { fontSize: 13, letterSpacing: 3, color: C.textMid, fontFamily: 'DMSans_500Medium' },

  uploadZone: {
    borderWidth: 1.5, borderColor: C.borderGold, borderStyle: 'dashed',
    borderRadius: 16, backgroundColor: C.surface,
    paddingVertical: 28, paddingHorizontal: 16,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', position: 'relative',
  },
  uploadGlow: {
    position: 'absolute',
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: C.accentDim, opacity: 0.5,
  },
  uploadIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.royalSoft,
    borderWidth: 1, borderColor: C.borderGold,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  uploadTitle: { fontSize: 16, color: C.text, fontFamily: 'DMSans_500Medium', marginBottom: 4 },
  uploadHint: { fontSize: 13, color: C.textDim, fontFamily: 'DMSans_300Light' },

  photoStrip: { flexDirection: 'row', gap: 8, marginTop: 12 },
  photoSlot: {
    flex: 1, aspectRatio: 1, borderRadius: 10,
    backgroundColor: C.surface2,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', position: 'relative',
  },
  photoSlotFilled: { borderWidth: 1, borderColor: C.borderGold, backgroundColor: C.surface3 },
  photoSlotEmpty: { borderWidth: 1, borderColor: C.border, borderStyle: 'dashed' },
  photoSlotPlus: { fontSize: 22, color: C.textFaint },
  photoSlotImg: { width: '100%', height: '100%' },
  photoTag: {
    position: 'absolute', bottom: 4, left: 4,
    backgroundColor: 'rgba(5,9,24,0.85)',
    borderWidth: 1, borderColor: C.borderGold, borderRadius: 3,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  photoTagText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, letterSpacing: 1, color: C.accent },

  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  fieldChev: { color: C.accent, fontSize: 11, fontFamily: 'JetBrainsMono_500Medium' },
  fieldLabel: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, letterSpacing: 1.5, color: C.textDim },
  fieldRequired: { marginLeft: 'auto', color: C.accent, fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, letterSpacing: 1 },

  input: {
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.borderMid, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15, color: C.text, fontFamily: 'DMSans_400Regular',
  },
  inputFocus: { borderColor: C.borderGold, backgroundColor: C.surface2 },

  row2: { flexDirection: 'row', gap: 10 },
  selectInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectValue: { color: C.text, fontSize: 15, fontFamily: 'DMSans_400Regular', flex: 1 },
  selectChev: { color: C.accent, fontSize: 14 },

  msSheet: {
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.borderGold, borderRadius: 14,
    padding: 14, marginTop: 8,
  },
  msHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: 10, marginBottom: 10,
    borderBottomWidth: 1, borderBottomColor: C.border, borderStyle: 'dashed',
  },
  msTag: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 12, letterSpacing: 2, color: C.accent },
  msId: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, letterSpacing: 1, color: C.textDim },
  msRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  msRowLabel: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 13, color: C.textDim },
  msRowValue: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 13, color: C.goldLight },

  btnSubmit: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    backgroundColor: C.royalBright,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.4)',
    borderRadius: 30, paddingVertical: 16,
  },
  btnSubmitText: { fontFamily: 'DMSans_500Medium', fontSize: 15, letterSpacing: 2.5, color: C.goldLight },
  submitHint: { textAlign: 'center', fontSize: 12, letterSpacing: 1.5, color: C.textDim, marginTop: 10, fontFamily: 'JetBrainsMono_500Medium' },

  sheetBackdrop: {
    flex: 1, backgroundColor: 'rgba(5,9,24,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderTopWidth: 1, borderColor: C.borderGold,
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 36,
  },
  sheetTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 18, letterSpacing: 3, color: C.accent, marginBottom: 12 },
  sheetOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10,
  },
  sheetOptionActive: { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.borderGold },
  sheetOptionText: { color: C.textMid, fontSize: 16, fontFamily: 'DMSans_400Regular' },
  sheetOptionTextActive: { color: C.goldLight, fontFamily: 'DMSans_500Medium' },
  sheetCheck: { color: C.accent, fontSize: 16, fontFamily: 'DMSans_500Medium' },

  overlay: {
    flex: 1, backgroundColor: 'rgba(5,9,24,0.95)',
    alignItems: 'center', justifyContent: 'center',
    padding: 32,
  },
  pilotOrbOuter2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(201,168,76,0.1)', marginTop: -120 },
  pilotOrbOuter: { position: 'absolute', width: 160, height: 160, borderRadius: 80, borderWidth: 1, borderColor: C.accentRing, marginTop: -120 },
  pilotOrb: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: C.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 28, marginTop: -120 },
  pilotOrbInner: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: C.royal,
    alignItems: 'center', justifyContent: 'center',
  },
  reviewStatus: { fontFamily: 'BebasNeue_400Regular', fontSize: 22, letterSpacing: 3, color: C.text, marginBottom: 8 },
  reviewSubstatus: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 13, letterSpacing: 1.5, color: C.accent, textAlign: 'center', minHeight: 16 },
  reviewProgress: { width: 220, height: 3, backgroundColor: C.border, borderRadius: 2, marginTop: 20, overflow: 'hidden' },
  reviewProgressFill: { height: '100%', backgroundColor: C.accent, borderRadius: 2 },
  });
}
