import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  Line,
  Path,
  Pattern,
  Rect,
  Stop,
} from 'react-native-svg';
import { DbBuild, deleteBuild, fetchBuild, fetchMyBuilds } from '@/api/builds';
import { addComment, Comment, deleteComment, fetchComments } from '@/api/comments';
import { listBlockedIds } from '@/api/moderation';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { ReportSheet } from '@/components/ReportSheet';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Palette } from '@/lib/theme';

const COMMENT_LIMIT = 500;

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  if (d < 604800) return `${Math.floor(d / 86400)}d ago`;
  return `${Math.floor(d / 604800)}w ago`;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function assessment(score: number) {
  if (score >= 90) return { text: 'ELITE\nBUILD', grade: 'GRADE S' };
  if (score >= 85) return { text: 'COMBAT\nREADY', grade: 'GRADE A' };
  if (score >= 75) return { text: 'IN\nSERVICE', grade: 'GRADE B' };
  if (score >= 65) return { text: 'NEEDS\nREPAIRS', grade: 'GRADE C' };
  return { text: 'GROUNDED', grade: 'GRADE D' };
}

function rankFromXP(totalXp: number) {
  if (totalXp >= 8000) return 'CAPTAIN';
  if (totalXp >= 5000) return 'LIEUTENANT';
  if (totalXp >= 3000) return '1st LIEUTENANT';
  if (totalXp >= 1500) return '2nd LIEUTENANT';
  if (totalXp >= 500) return 'ENSIGN';
  return 'RECRUIT';
}

function nextRankAt(totalXp: number) {
  const bands = [500, 1500, 3000, 5000, 8000, 12000];
  for (const b of bands) if (totalXp < b) return b;
  return totalXp + 1000;
}

function ymdhm(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} · ${p(d.getHours())}:${p(d.getMinutes())} UTC`;
}

export default function Debrief() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [build, setBuild] = useState<DbBuild | null>(null);
  const [prevScore, setPrevScore] = useState<number | null>(null);
  const [totalXp, setTotalXp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [reportOpen, setReportOpen] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);

  // Animated values
  const ringFill = useRef(new Animated.Value(0)).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const barAnim = useRef(new Animated.Value(0)).current;
  const heroOp = useRef(new Animated.Value(0)).current;
  const heroY = useRef(new Animated.Value(20)).current;
  const stampScale = useRef(new Animated.Value(2)).current;
  const stampOp = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const b = await fetchBuild(id);
        setBuild(b);
        if (b) {
          const [mine, cs, blocked] = await Promise.all([
            fetchMyBuilds(b.user_id),
            fetchComments(b.id),
            session ? listBlockedIds(session.user.id) : Promise.resolve(new Set<string>()),
          ]);
          const earlier = mine
            .filter((m) => m.id !== b.id && new Date(m.created_at) < new Date(b.created_at))
            .sort((a, z) => +new Date(z.created_at) - +new Date(a.created_at));
          setPrevScore(earlier[0]?.score ?? null);
          setTotalXp(mine.reduce((s, m) => s + m.score * 10, 0));
          setComments(cs.filter((c) => !blocked.has(c.user_id)));
          setBlockedIds(blocked);
        }
      } catch (e) {
        console.warn('build load failed', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function onPostComment() {
    if (!session || !build) return;
    const text = commentText.trim();
    if (!text) return;
    setPosting(true);
    try {
      const created = await addComment(session.user.id, build.id, text);
      setComments((prev) => [...prev, created]);
      setCommentText('');
    } catch (e: any) {
      Alert.alert('Could not post', e?.message ?? 'Something went wrong.');
    } finally {
      setPosting(false);
    }
  }

  const [reportingComment, setReportingComment] = useState<Comment | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pendingDeleteComment, setPendingDeleteComment] = useState<Comment | null>(null);
  const [deletingComment, setDeletingComment] = useState(false);

  function openOwnerMenu() {
    if (!build) return;
    Alert.alert(
      build.kit_name,
      undefined,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit build', onPress: () => router.push(`/edit-build/${build.id}`) },
        { text: 'Delete build', style: 'destructive', onPress: () => setDeleteOpen(true) },
      ],
    );
  }

  async function confirmDeleteBuild() {
    if (!build) return;
    setDeleting(true);
    try {
      await deleteBuild(build.id);
      setDeleteOpen(false);
      router.back();
    } catch (e: any) {
      setDeleting(false);
      Alert.alert('Could not delete', e?.message ?? 'Try again later.');
    }
  }

  function onLongPressComment(c: Comment) {
    if (!session) return;
    const snippet = c.body.length > 60 ? c.body.slice(0, 60) + '…' : c.body;
    if (c.user_id === session.user.id) {
      setPendingDeleteComment(c);
    } else {
      Alert.alert('Comment', snippet, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report comment', style: 'destructive', onPress: () => setReportingComment(c) },
      ]);
    }
  }

  async function confirmDeleteComment() {
    if (!pendingDeleteComment) return;
    const c = pendingDeleteComment;
    setDeletingComment(true);
    try {
      await deleteComment(c.id);
      setComments((prev) => prev.filter((x) => x.id !== c.id));
      setPendingDeleteComment(null);
    } catch (e: any) {
      setPendingDeleteComment(null);
      Alert.alert('Failed', e?.message ?? 'Could not delete.');
    } finally {
      setDeletingComment(false);
    }
  }

  useEffect(() => {
    if (!build) return;
    Animated.parallel([
      Animated.timing(heroOp, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(heroY, { toValue: 0, duration: 700, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
    ]).start();
    Animated.timing(ringFill, {
      toValue: build.score / 100,
      duration: 1500,
      delay: 600,
      useNativeDriver: false,
      easing: Easing.out(Easing.cubic),
    }).start();
    Animated.timing(scoreAnim, {
      toValue: build.score,
      duration: 1500,
      delay: 600,
      useNativeDriver: false,
      easing: Easing.out(Easing.cubic),
    }).start();
    Animated.timing(barAnim, {
      toValue: 1,
      duration: 900,
      delay: 800,
      useNativeDriver: false,
      easing: Easing.out(Easing.cubic),
    }).start();
    Animated.parallel([
      Animated.timing(stampScale, { toValue: 1, duration: 500, delay: 500, useNativeDriver: true, easing: Easing.out(Easing.back(1.5)) }),
      Animated.timing(stampOp, { toValue: 1, duration: 500, delay: 500, useNativeDriver: true }),
    ]).start();
    const sub = scoreAnim.addListener(({ value }) => setDisplayScore(Math.round(value)));
    return () => scoreAnim.removeListener(sub);
  }, [build]);

  if (loading) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={C.accent} />
        </SafeAreaView>
      </View>
    );
  }
  if (!build) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={styles.notFound}>This debrief doesn't exist or was removed.</Text>
        </SafeAreaView>
      </View>
    );
  }

  const a = assessment(build.score);
  const diff = prevScore !== null ? build.score - prevScore : null;
  const xpEarned = build.score * 10;
  const rank = rankFromXP(totalXp);
  const nextAt = nextRankAt(totalXp);
  const toNext = Math.max(nextAt - totalXp, 0);

  const RADIUS = 60;
  const CIRC = 2 * Math.PI * RADIUS;
  const strokeDashoffset = ringFill.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRC, CIRC * 0.1],
  });

  async function onShare() {
    try {
      const url = Linking.createURL(`/build/${build.id}`);
      await Share.share({
        message: `My ${build.kit_name} (${build.grade}) just scored ${build.score} on Hanger — ${a.grade}.\n${url}`,
        url,
      });
    } catch {}
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

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()}>
            <Svg width={14} height={14} viewBox="0 0 14 14">
              <Path d="M9 11L5 7L9 3" stroke="rgba(255,255,255,0.6)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>PILOT'S DEBRIEF</Text>
            <Text style={styles.headerSub}>EVALUATION COMPLETE</Text>
          </View>
          {session && build && build.user_id === session.user.id ? (
            <Pressable style={styles.iconBtn} onPress={openOwnerMenu}>
              <Svg width={16} height={16} viewBox="0 0 16 16">
                <Circle cx={8} cy={3} r={1.5} fill={C.textMid} />
                <Circle cx={8} cy={8} r={1.5} fill={C.textMid} />
                <Circle cx={8} cy={13} r={1.5} fill={C.textMid} />
              </Svg>
            </Pressable>
          ) : null}
          <Pressable style={styles.iconBtn} onPress={onShare}>
            <Svg width={14} height={14} viewBox="0 0 14 14">
              <Circle cx={11} cy={3} r={2} stroke="rgba(255,255,255,0.6)" strokeWidth={1.2} />
              <Circle cx={3} cy={7} r={2} stroke="rgba(255,255,255,0.6)" strokeWidth={1.2} />
              <Circle cx={11} cy={11} r={2} stroke="rgba(255,255,255,0.6)" strokeWidth={1.2} />
              <Path d="M4.5 6L9.5 4M4.5 8L9.5 10" stroke="rgba(255,255,255,0.6)" strokeWidth={1.2} />
            </Svg>
          </Pressable>
          {session && build && build.user_id !== session.user.id ? (
            <Pressable style={styles.iconBtn} onPress={() => setReportOpen(true)}>
              <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                <Path d="M2 12V2 M2 2 H10 L8 5 L10 8 H2" stroke={C.textMid} strokeWidth={1.2} strokeLinejoin="round" />
              </Svg>
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
        >
          {/* Classified banner */}
          <View style={styles.classified}>
            <Text style={styles.classifiedText}>OFFICIAL DEBRIEF</Text>
            <Text style={styles.classifiedId}>PR-{build.id.slice(0, 8).toUpperCase()}</Text>
          </View>

          {/* Hero */}
          <Animated.View style={[styles.hero, { opacity: heroOp, transform: [{ translateY: heroY }] }]}>
            <View style={styles.heroGlow} pointerEvents="none" />
            <View style={styles.heroTop}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.kitName} numberOfLines={2}>
                  {build.kit_name}
                </Text>
                <Text style={styles.kitMeta}>
                  {build.grade.toUpperCase()}
                  {build.modifications ? ` · ${build.modifications.toUpperCase()}` : ''}
                </Text>
              </View>
              <Animated.View style={[styles.verdictStamp, { transform: [{ rotate: '2deg' }, { scale: stampScale }], opacity: stampOp }]}>
                <Text style={styles.verdictStampText}>{a.grade}</Text>
              </Animated.View>
            </View>

            {build.photo_url ? (
              <View style={styles.heroPhotoWrap}>
                <Image source={{ uri: build.photo_url }} style={styles.heroPhoto} />
              </View>
            ) : null}

            <View style={styles.scoreDisplay}>
              <View style={styles.scoreCircleWrap}>
                <Svg width={140} height={140} viewBox="0 0 140 140" style={{ transform: [{ rotate: '-90deg' }] }}>
                  <Defs>
                    <SvgGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor={C.royalBright} />
                      <Stop offset="100%" stopColor={C.accent} />
                    </SvgGradient>
                  </Defs>
                  <Circle cx={70} cy={70} r={RADIUS} fill="none" stroke={C.borderMid} strokeWidth={6} />
                  <AnimatedCircle
                    cx={70}
                    cy={70}
                    r={RADIUS}
                    fill="none"
                    stroke="url(#scoreGrad)"
                    strokeWidth={6}
                    strokeLinecap="round"
                    strokeDasharray={CIRC}
                    strokeDashoffset={strokeDashoffset}
                  />
                </Svg>
                <View style={styles.scoreNumWrap}>
                  <Text style={styles.scoreBig}>{displayScore}</Text>
                  <Text style={styles.scoreOutOf}>/ 100</Text>
                  <Text style={styles.gradeLetter}>SCORE</Text>
                </View>
              </View>

              <View style={styles.scoreSummary}>
                <Text style={styles.scoreSummaryLabel}>ASSESSMENT</Text>
                <Text style={styles.scoreSummaryText}>{a.text}</Text>
                {diff !== null ? (
                  <View style={styles.scoreRank}>
                    <Text style={[styles.rankDelta, { color: diff >= 0 ? C.greenHud : '#FF5577' }]}>
                      {diff >= 0 ? '▲' : '▼'} {Math.abs(diff)}
                    </Text>
                    <Text style={styles.rankVs}>vs your last build</Text>
                  </View>
                ) : (
                  <View style={styles.scoreRank}>
                    <Text style={styles.rankVs}>FIRST BUILD ON RECORD</Text>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>

          {/* Breakdown */}
          <View style={styles.section}>
            <View style={styles.eyebrowRow}>
              <View style={styles.eyebrowDash} />
              <Text style={styles.sectionEyebrow}>PERFORMANCE BREAKDOWN</Text>
            </View>
            <View style={styles.breakdown}>
              <CatRow label="Panel lining" value={build.scores.panel_lining} barAnim={barAnim} icon="lines" />
              <CatRow label="Paint & finish" value={build.scores.paint_finish} barAnim={barAnim} icon="check" />
              <CatRow label="Pose & composition" value={build.scores.pose_composition} barAnim={barAnim} icon="star" />
              <CatRow label="Weathering" value={build.scores.weathering} barAnim={barAnim} icon="wave" />
              <CatRow label="Overall polish" value={build.scores.overall_polish} barAnim={barAnim} icon="bigstar" last />
            </View>
          </View>

          {/* Debrief */}
          <View style={styles.section}>
            <View style={styles.eyebrowRow}>
              <View style={styles.eyebrowDash} />
              <Text style={styles.sectionEyebrow}>SENIOR PILOT'S NOTES</Text>
            </View>
            <View style={styles.debrief}>
              <View style={styles.debriefAccent} />
              <View style={styles.debriefHeader}>
                <View style={styles.pilotAvatar}>
                  <Svg width={22} height={22} viewBox="0 0 22 22">
                    <Circle cx={11} cy={8} r={3.5} stroke={C.goldLight} strokeWidth={1.4} />
                    <Path d="M4 19C4 15.5 7 13 11 13S18 15.5 18 19" stroke={C.goldLight} strokeWidth={1.4} strokeLinecap="round" />
                    <Path d="M7 6L11 3L15 6" stroke={C.goldLight} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pilotName}>Captain N. Vega</Text>
                  <Text style={styles.pilotRank}>SENIOR PILOT · INSTRUCTOR</Text>
                  <Text style={styles.pilotCallsign}>CALLSIGN: NIGHT TIGER</Text>
                </View>
              </View>
              <Text style={styles.debriefBody}>
                <Text style={styles.quoteMark}>" </Text>
                {build.verdict}
              </Text>
              <View style={styles.signOff}>
                <Text style={styles.signOffText}>FILED {ymdhm(build.created_at)}</Text>
                <Text style={styles.signOffText}>SIGNED</Text>
              </View>
            </View>
          </View>

          {/* Field notes */}
          <View style={styles.section}>
            <View style={styles.eyebrowRow}>
              <View style={styles.eyebrowDash} />
              <Text style={styles.sectionEyebrow}>FIELD NOTES</Text>
            </View>
            <View style={styles.tipsGrid}>
              <View style={[styles.tipCard, { borderColor: 'rgba(74,222,128,0.25)' }]}>
                <View style={styles.tipEyebrow}>
                  <Text style={[styles.tipIcon, { color: C.greenHud }]}>✓</Text>
                  <Text style={[styles.tipEyebrowText, { color: C.greenHud }]}>STRENGTH</Text>
                </View>
                <Text style={styles.tipText}>{build.strength}</Text>
              </View>
              <View style={[styles.tipCard, { borderColor: 'rgba(201,168,76,0.3)' }]}>
                <View style={styles.tipEyebrow}>
                  <Text style={[styles.tipIcon, { color: C.accent }]}>▲</Text>
                  <Text style={[styles.tipEyebrowText, { color: C.accent }]}>TRAIN UP</Text>
                </View>
                <Text style={styles.tipText}>{build.work_on}</Text>
              </View>
            </View>
          </View>

          {/* XP */}
          <View style={styles.section}>
            <View style={styles.xpCard}>
              <View style={styles.xpIcon}>
                <Svg width={20} height={20} viewBox="0 0 20 20">
                  <Path d="M10 2L11.5 7.5L17 9L11.5 10.5L10 16L8.5 10.5L3 9L8.5 7.5L10 2Z" fill={C.goldLight} />
                </Svg>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.xpLabel}>PILOT XP EARNED</Text>
                <Text style={styles.xpAmount}>+ {xpEarned} XP</Text>
                <Text style={styles.xpDetail}>
                  Rank: <Text style={{ color: C.goldLight, fontFamily: 'DMSans_500Medium' }}>{rank}</Text>
                  {' · '}
                  {toNext} XP to next
                </Text>
              </View>
            </View>
          </View>

          {/* Comments */}
          <View style={styles.section}>
            <View style={styles.eyebrowRow}>
              <View style={styles.eyebrowDash} />
              <Text style={styles.sectionEyebrow}>
                COMMENTS {comments.length > 0 ? `· ${comments.length}` : ''}
              </Text>
            </View>

            {comments.length === 0 ? (
              <EmptyState
                compact
                icon={<Text style={{ fontSize: 26 }}>💬</Text>}
                title="NO CHATTER YET"
                body="Be the first to leave feedback for this pilot."
              />
            ) : (
              <View style={styles.commentsList}>
                {comments.map((c) => {
                  const mine = session?.user.id === c.user_id;
                  return (
                    <Pressable
                      key={c.id}
                      onLongPress={() => onLongPressComment(c)}
                      style={styles.commentRow}
                    >
                      <Pressable
                        style={styles.commentAvatar}
                        onPress={() => c.author_handle && router.push(`/pilot/${c.author_handle}`)}
                        disabled={!c.author_handle}
                        hitSlop={4}
                      >
                        {c.author_avatar ? (
                          <Image source={{ uri: c.author_avatar }} style={styles.commentAvatarImg} />
                        ) : (
                          <Text style={styles.commentAvatarInitials}>
                            {(c.author_handle ?? '?').slice(0, 2).toUpperCase()}
                          </Text>
                        )}
                      </Pressable>
                      <View style={{ flex: 1 }}>
                        <View style={styles.commentMeta}>
                          <Pressable
                            onPress={() => c.author_handle && router.push(`/pilot/${c.author_handle}`)}
                            disabled={!c.author_handle}
                            hitSlop={4}
                          >
                            <Text style={styles.commentHandle}>
                              @{c.author_handle ?? 'unknown'}
                            </Text>
                          </Pressable>
                          <Text style={styles.commentTime}>· {timeAgo(c.created_at)}</Text>
                          {mine ? <Text style={styles.commentMine}>· you</Text> : null}
                        </View>
                        <Text style={styles.commentBody}>{c.body}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {session ? (
              <View style={styles.commentInputRow}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Add a comment…"
                  placeholderTextColor={C.textDim}
                  value={commentText}
                  onChangeText={setCommentText}
                  maxLength={COMMENT_LIMIT}
                  multiline
                  onFocus={() => {
                    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
                  }}
                />
                <Pressable
                  onPress={onPostComment}
                  disabled={posting || !commentText.trim()}
                  style={({ pressed }) => [
                    styles.commentPostBtn,
                    (!commentText.trim() || posting) && { opacity: 0.4 },
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  {posting ? (
                    <ActivityIndicator color={C.onAccent} size="small" />
                  ) : (
                    <Text style={styles.commentPostText}>POST</Text>
                  )}
                </Pressable>
              </View>
            ) : (
              <Text style={styles.commentsEmpty}>Sign in to comment.</Text>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable style={({ pressed }) => [styles.btnShare, pressed && { opacity: 0.85 }]} onPress={onShare}>
              <Svg width={14} height={14} viewBox="0 0 14 14">
                <Path
                  d="M7 1V9M7 1L4 4M7 1L10 4M2 9V12C2 12.55 2.45 13 3 13H11C11.55 13 12 12.55 12 12V9"
                  stroke={C.onAccent}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.btnShareText}>SHARE TO FEED</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.btnRebuild, pressed && { opacity: 0.85 }]} onPress={() => router.push('/(tabs)/judge')}>
              <Svg width={14} height={14} viewBox="0 0 14 14">
                <Path
                  d="M2 7C2 4.5 4 2.5 7 2.5C10 2.5 12 4.5 12 7C12 9.5 10 11.5 7 11.5C5.5 11.5 4 10.7 3.2 9.5M2 12V9.5H4.5"
                  stroke={C.goldLight}
                  strokeWidth={1.3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.btnRebuildText}>NEXT BUILD</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>

      {build ? (
        <ReportSheet
          visible={reportOpen}
          onClose={() => setReportOpen(false)}
          subjectKind="build"
          subjectId={build.id}
          subjectLabel={build.kit_name}
        />
      ) : null}
      {reportingComment ? (
        <ReportSheet
          visible={!!reportingComment}
          onClose={() => setReportingComment(null)}
          subjectKind="comment"
          subjectId={reportingComment.id}
          subjectLabel={
            reportingComment.body.length > 40
              ? reportingComment.body.slice(0, 40) + '…'
              : reportingComment.body
          }
        />
      ) : null}
      <ConfirmDialog
        visible={deleteOpen}
        title="DELETE BUILD?"
        body="The scored debrief, likes, and comments will be permanently removed. This cannot be undone."
        confirmLabel="DELETE"
        destructive
        busy={deleting}
        onConfirm={confirmDeleteBuild}
        onCancel={() => setDeleteOpen(false)}
      />
      <ConfirmDialog
        visible={!!pendingDeleteComment}
        title="DELETE COMMENT?"
        body={pendingDeleteComment ? (pendingDeleteComment.body.length > 100
          ? pendingDeleteComment.body.slice(0, 100) + '…'
          : pendingDeleteComment.body) : undefined}
        confirmLabel="DELETE"
        destructive
        busy={deletingComment}
        onConfirm={confirmDeleteComment}
        onCancel={() => setPendingDeleteComment(null)}
      />
    </View>
  );
}

function CatRow({
  label,
  value,
  barAnim,
  icon,
  last,
}: {
  label: string;
  value: number;
  barAnim: Animated.Value;
  icon: 'lines' | 'check' | 'star' | 'wave' | 'bigstar';
  last?: boolean;
}) {
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  return (
    <View style={[styles.catRow, last && { borderBottomWidth: 0 }]}>
      <View style={styles.catIcon}>{renderCatIcon(icon, C)}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.catName}>{label}</Text>
        <View style={styles.catTrack}>
          <Animated.View
            style={[
              styles.catFill,
              { width: barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${value}%`] }) },
            ]}
          />
        </View>
      </View>
      <Text style={styles.catScore}>{value}</Text>
    </View>
  );
}

function renderCatIcon(kind: 'lines' | 'check' | 'star' | 'wave' | 'bigstar', C: Palette) {
  if (kind === 'lines') {
    return (
      <Svg width={14} height={14} viewBox="0 0 14 14">
        <Path d="M2 4H12M2 7H12M2 10H12" stroke={C.accent} strokeWidth={1.3} strokeLinecap="round" />
      </Svg>
    );
  }
  if (kind === 'check') {
    return (
      <Svg width={14} height={14} viewBox="0 0 14 14">
        <Circle cx={7} cy={7} r={4} stroke={C.accent} strokeWidth={1.3} />
        <Path d="M5 7L7 9L9 5" stroke={C.accent} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  if (kind === 'star') {
    return (
      <Svg width={14} height={14} viewBox="0 0 14 14">
        <Path d="M7 2L8 5L11 5.5L9 8L9.5 11L7 9.5L4.5 11L5 8L3 5.5L6 5L7 2Z" stroke={C.accent} strokeWidth={1.3} strokeLinejoin="round" />
      </Svg>
    );
  }
  if (kind === 'wave') {
    return (
      <Svg width={14} height={14} viewBox="0 0 14 14">
        <Path d="M3 8C3 8 5 6 7 6S11 8 11 8M3 11C3 11 5 9 7 9S11 11 11 11" stroke={C.accent} strokeWidth={1.3} strokeLinecap="round" />
        <Circle cx={7} cy={3.5} r={1.5} stroke={C.accent} strokeWidth={1.3} />
      </Svg>
    );
  }
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14">
      <Path d="M7 1L9 6L13 6L10 9L11 13L7 11L3 13L4 9L1 6L5 6L7 1Z" stroke={C.accent} strokeWidth={1.3} strokeLinejoin="round" />
    </Svg>
  );
}

function makeStyles(C: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
  notFound: { color: C.textDim, fontFamily: 'DMSans_300Light', fontSize: 15 },

  header: {
    paddingHorizontal: 20, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.borderMid,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 18, letterSpacing: 3, color: C.text },
  headerSub: { fontSize: 12, letterSpacing: 1.5, color: C.textDim, marginTop: 3, fontFamily: 'DMSans_500Medium' },

  classified: {
    marginHorizontal: 20, marginTop: 16,
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 6, borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)',
    backgroundColor: 'rgba(74,222,128,0.05)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  classifiedLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  classifiedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.greenHud },
  classifiedText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 12, letterSpacing: 2, color: C.greenHud },
  classifiedId: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 12, letterSpacing: 1, color: C.textDim },

  hero: {
    marginHorizontal: 20, marginTop: 14,
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.borderGold,
    borderRadius: 20, padding: 20,
    overflow: 'hidden', position: 'relative',
  },
  heroGlow: { position: 'absolute', top: -100, right: -60, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(201,168,76,0.10)' },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  kitName: { fontSize: 17, color: C.text, fontFamily: 'DMSans_500Medium', marginBottom: 4 },
  kitMeta: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 12, letterSpacing: 1.5, color: C.textDim },
  verdictStamp: {
    backgroundColor: C.accent,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 4,
    borderWidth: 1.5, borderColor: C.onAccent,
  },
  verdictStampText: { fontFamily: 'BebasNeue_400Regular', fontSize: 13, letterSpacing: 2, color: C.onAccent },

  heroPhotoWrap: { width: '100%', height: 180, borderRadius: 12, overflow: 'hidden', marginBottom: 16, backgroundColor: C.surface2 },
  heroPhoto: { width: '100%', height: '100%' },

  scoreDisplay: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  scoreCircleWrap: { width: 140, height: 140 },
  scoreNumWrap: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' },
  scoreBig: { fontFamily: 'BebasNeue_400Regular', fontSize: 52, color: C.goldLight, lineHeight: 52 },
  scoreOutOf: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 12, color: C.textDim, letterSpacing: 1 },
  gradeLetter: { fontFamily: 'BebasNeue_400Regular', fontSize: 13, letterSpacing: 1.5, color: C.accent, marginTop: 4 },
  scoreSummary: { flex: 1, minWidth: 0 },
  scoreSummaryLabel: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, letterSpacing: 1.5, color: C.accent, marginBottom: 8 },
  scoreSummaryText: { fontFamily: 'BebasNeue_400Regular', fontSize: 26, letterSpacing: 1, color: C.text, lineHeight: 28, marginBottom: 8 },
  scoreRank: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rankDelta: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 12 },
  rankVs: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 12, color: C.textMid, letterSpacing: 0.5 },

  section: { paddingHorizontal: 20, paddingTop: 22 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  eyebrowDash: { width: 14, height: 1, backgroundColor: C.accent },
  sectionEyebrow: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 12, letterSpacing: 2, color: C.accent },

  breakdown: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 16 },
  catRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1, borderBottomColor: C.border, borderStyle: 'dashed',
  },
  catIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.borderMid, alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: 14, color: C.text, fontFamily: 'DMSans_500Medium', marginBottom: 4 },
  catTrack: { width: '100%', height: 4, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden' },
  catFill: { height: '100%', backgroundColor: C.accent, borderRadius: 2 },
  catScore: { fontFamily: 'BebasNeue_400Regular', fontSize: 18, color: C.accent, letterSpacing: 1, width: 32, textAlign: 'right' },

  debrief: {
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.borderGold, borderRadius: 14,
    padding: 18, overflow: 'hidden', position: 'relative',
  },
  debriefAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: C.accent },
  debriefHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingBottom: 12, marginBottom: 14,
    borderBottomWidth: 1, borderBottomColor: C.border, borderStyle: 'dashed',
  },
  pilotAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.royalBright,
    borderWidth: 1.5, borderColor: C.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  pilotName: { fontSize: 15, color: C.text, fontFamily: 'DMSans_500Medium' },
  pilotRank: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, letterSpacing: 1.5, color: C.accent, marginTop: 2 },
  pilotCallsign: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: C.textDim, letterSpacing: 0.5, marginTop: 1 },
  debriefBody: { fontSize: 15, color: C.textMid, lineHeight: 22, fontFamily: 'DMSans_300Light', fontStyle: 'italic' },
  quoteMark: { fontFamily: 'BebasNeue_400Regular', fontSize: 24, color: C.accentRing },
  signOff: {
    marginTop: 14, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: C.border, borderStyle: 'dashed',
    flexDirection: 'row', justifyContent: 'space-between',
  },
  signOffText: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, letterSpacing: 1, color: C.textDim },

  tipsGrid: { flexDirection: 'row', gap: 10 },
  tipCard: { flex: 1, backgroundColor: C.surface, borderWidth: 1, borderRadius: 12, padding: 14 },
  tipEyebrow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  tipIcon: { fontSize: 13, fontFamily: 'DMSans_500Medium' },
  tipEyebrowText: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, letterSpacing: 1.5 },
  tipText: { fontSize: 14, color: C.textMid, lineHeight: 18, fontFamily: 'DMSans_300Light' },

  xpCard: {
    backgroundColor: C.royalSoft,
    borderWidth: 1, borderColor: C.borderGold, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 18,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  xpIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.royalBright,
    borderWidth: 1.5, borderColor: C.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  xpLabel: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 11, letterSpacing: 1.5, color: C.accent, marginBottom: 2 },
  xpAmount: { fontFamily: 'BebasNeue_400Regular', fontSize: 22, color: C.goldLight, lineHeight: 22, letterSpacing: 1.5, marginBottom: 2 },
  xpDetail: { fontSize: 13, color: C.textMid, fontFamily: 'DMSans_300Light' },

  actions: { paddingHorizontal: 20, paddingTop: 24, flexDirection: 'row', gap: 10 },
  btnShare: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.accent, borderRadius: 30, paddingVertical: 14, paddingHorizontal: 20,
  },
  btnShareText: { fontFamily: 'DMSans_500Medium', fontSize: 14, letterSpacing: 2, color: C.onAccent },
  btnRebuild: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: C.borderGold, borderRadius: 30, paddingVertical: 14, paddingHorizontal: 20,
  },
  btnRebuildText: { fontFamily: 'DMSans_500Medium', fontSize: 14, letterSpacing: 2, color: C.goldLight },

  commentsEmpty: { fontSize: 15, color: C.textDim, fontFamily: 'DMSans_300Light', paddingVertical: 14 },
  commentsList: { gap: 14, marginBottom: 14 },
  commentRow: { flexDirection: 'row', gap: 12, paddingVertical: 10 },
  commentAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.royalBright,
    borderWidth: 1, borderColor: C.accentRing,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  commentAvatarImg: { width: '100%', height: '100%' },
  commentAvatarInitials: { fontFamily: 'BebasNeue_400Regular', fontSize: 17, letterSpacing: 1, color: C.goldLight },
  commentMeta: { flexDirection: 'row', alignItems: 'baseline', gap: 5, marginBottom: 3 },
  commentHandle: { fontSize: 16, color: C.accent, fontFamily: 'DMSans_500Medium' },
  commentTime: { fontSize: 13, color: C.textDim, fontFamily: 'JetBrainsMono_400Regular' },
  commentMine: { fontSize: 13, color: C.textDim, fontFamily: 'JetBrainsMono_400Regular' },
  commentBody: { fontSize: 16, color: C.textMid, lineHeight: 21, fontFamily: 'DMSans_300Light' },

  commentInputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    marginTop: 8,
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.borderMid, borderRadius: 12,
    padding: 8,
  },
  commentInput: {
    flex: 1, minHeight: 32, maxHeight: 120,
    color: C.text, fontFamily: 'DMSans_400Regular', fontSize: 15,
    paddingHorizontal: 6, paddingVertical: 6,
  },
  commentPostBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: C.accent, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    minWidth: 60,
  },
  commentPostText: { fontFamily: 'DMSans_500Medium', fontSize: 13, letterSpacing: 1.5, color: C.onAccent },
  });
}
