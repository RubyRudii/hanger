import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Line, Path, Pattern, Rect } from 'react-native-svg';
import { BuildSummary } from '@/components/BuildCard';
import { EmptyState } from '@/components/EmptyState';
import { searchBuilds } from '@/api/builds';
import { listBlockedIds } from '@/api/moderation';
import { PublicProfile, searchPilots } from '@/api/profile';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Palette } from '@/lib/theme';

const DEBOUNCE_MS = 250;

export default function Search() {
  const { session } = useAuth();
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [pilots, setPilots] = useState<PublicProfile[]>([]);
  const [builds, setBuilds] = useState<BuildSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState<Set<string>>(new Set());
  const timer = useRef<any>(null);

  useEffect(() => {
    if (!session) return;
    listBlockedIds(session.user.id).then(setBlocked).catch(() => {});
  }, [session]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer.current);
  }, [query]);

  const runSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setPilots([]);
      setBuilds([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [p, b] = await Promise.all([searchPilots(q, 15), searchBuilds(q, 20)]);
      setPilots(p.filter((pp) => !blocked.has(pp.id)));
      setBuilds(b.filter((bb) => !blocked.has((bb as any).user_id ?? '')));
    } catch (e: any) {
      console.warn('search failed', e?.message ?? e);
    } finally {
      setLoading(false);
    }
  }, [blocked]);

  useEffect(() => {
    runSearch(debounced);
  }, [debounced, runSearch]);

  type Section =
    | { kind: 'header'; title: string; count: number }
    | { kind: 'pilot'; item: PublicProfile }
    | { kind: 'build'; item: BuildSummary };

  const sections: Section[] = useMemo(() => {
    const out: Section[] = [];
    if (pilots.length) {
      out.push({ kind: 'header', title: 'PILOTS', count: pilots.length });
      pilots.forEach((p) => out.push({ kind: 'pilot', item: p }));
    }
    if (builds.length) {
      out.push({ kind: 'header', title: 'BUILDS', count: builds.length });
      builds.forEach((b) => out.push({ kind: 'build', item: b }));
    }
    return out;
  }, [pilots, builds]);

  const noResults =
    debounced.length >= 2 && !loading && sections.length === 0;
  const showPrompt = debounced.length < 2 && !loading;

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
          <Pressable style={styles.iconBtn} onPress={() => router.back()}>
            <Svg width={14} height={14} viewBox="0 0 14 14">
              <Path d="M9 11L5 7L9 3" stroke={C.textMid} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
          <View style={styles.inputWrap}>
            <Svg width={16} height={16} viewBox="0 0 16 16" style={{ marginLeft: 10 }}>
              <Circle cx={7} cy={7} r={4.5} stroke={C.textDim} strokeWidth={1.4} fill="none" />
              <Path d="M10.5 10.5L14 14" stroke={C.textDim} strokeWidth={1.4} strokeLinecap="round" />
            </Svg>
            <TextInput
              style={styles.input}
              placeholder="Search pilots or builds…"
              placeholderTextColor={C.textDim}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              returnKeyType="search"
              maxLength={60}
            />
            {query.length > 0 ? (
              <Pressable onPress={() => setQuery('')} hitSlop={10} style={{ paddingHorizontal: 10 }}>
                <Text style={styles.clear}>✕</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {showPrompt ? (
          <EmptyState
            icon={
              <Svg width={30} height={30} viewBox="0 0 16 16">
                <Circle cx={7} cy={7} r={4.5} stroke={C.accent} strokeWidth={1.4} fill="none" />
                <Path d="M10.5 10.5L14 14" stroke={C.accent} strokeWidth={1.4} strokeLinecap="round" />
              </Svg>
            }
            title="FIND PILOTS + BUILDS"
            body="Type at least 2 characters to search handles, names, or kit titles."
          />
        ) : noResults ? (
          <EmptyState
            icon={<Text style={{ fontSize: 30 }}>🔍</Text>}
            title="NO MATCHES"
            body={`Nothing turned up for "${debounced}".`}
          />
        ) : (
          <FlatList
            data={sections}
            keyExtractor={(s, i) => {
              if (s.kind === 'header') return `h:${s.title}:${i}`;
              return `${s.kind}:${s.item.id}`;
            }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8, gap: 8 }}
            renderItem={({ item }) => {
              if (item.kind === 'header') {
                return (
                  <View style={styles.sectionHead}>
                    <Text style={styles.sectionLabel}>
                      // {item.title} · {item.count}
                    </Text>
                  </View>
                );
              }
              if (item.kind === 'pilot') return <PilotRow p={item.item} />;
              return <BuildRow b={item.item} />;
            }}
            ListFooterComponent={loading ? <ActivityIndicator color={C.accent} style={{ marginTop: 20 }} /> : null}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </SafeAreaView>
    </View>
  );
}

function PilotRow({ p }: { p: PublicProfile }) {
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const initials = (p.handle ?? p.display_name ?? '?').slice(0, 2).toUpperCase();
  return (
    <Pressable style={styles.row} onPress={() => p.handle && router.push(`/pilot/${p.handle}`)}>
      <View style={styles.avatar}>
        {p.avatar_url ? (
          <Image source={{ uri: p.avatar_url }} style={styles.avatarImg} />
        ) : (
          <Text style={styles.avatarText}>{initials}</Text>
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.title} numberOfLines={1}>
          {p.display_name ?? p.handle ?? 'Builder'}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          @{p.handle ?? 'unknown'} · {p.follower_count} follower{p.follower_count === 1 ? '' : 's'}
        </Text>
        {p.bio ? (
          <Text style={styles.bio} numberOfLines={1}>
            {p.bio}
          </Text>
        ) : null}
      </View>
      <Text style={styles.chev}>›</Text>
    </Pressable>
  );
}

function BuildRow({ b }: { b: BuildSummary }) {
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  return (
    <Pressable style={styles.row} onPress={() => router.push(`/build/${b.id}`)}>
      <View style={styles.thumb}>
        {b.photo_url ? (
          <Image source={{ uri: b.photo_url }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <Text style={{ fontSize: 24 }}>🤖</Text>
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.title} numberOfLines={1}>
          {b.kit_name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {b.builder_handle ? `@${b.builder_handle}` : 'Anonymous'} · {b.grade}
        </Text>
      </View>
      <Text style={styles.score}>{b.score}</Text>
    </Pressable>
  );
}

function makeStyles(C: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },

    header: {
      paddingHorizontal: 20, paddingVertical: 12,
      flexDirection: 'row', alignItems: 'center', gap: 10,
      borderBottomWidth: 1, borderBottomColor: C.border,
    },
    iconBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: C.surface, borderWidth: 1, borderColor: C.borderMid,
      alignItems: 'center', justifyContent: 'center',
    },
    inputWrap: {
      flex: 1, flexDirection: 'row', alignItems: 'center',
      backgroundColor: C.surface,
      borderWidth: 1, borderColor: C.borderMid, borderRadius: 20,
    },
    input: {
      flex: 1,
      paddingHorizontal: 10, paddingVertical: 9,
      fontSize: 15, color: C.text, fontFamily: 'DMSans_400Regular',
    },
    clear: { color: C.textMid, fontSize: 16, fontFamily: 'DMSans_500Medium' },

    sectionHead: { marginTop: 12, marginBottom: 2 },
    sectionLabel: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, letterSpacing: 1.5, color: C.textDim },

    row: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: C.surface,
      borderWidth: 1, borderColor: C.border, borderRadius: 14,
      padding: 12,
    },
    avatar: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: C.royalBright,
      borderWidth: 1, borderColor: C.accentRing,
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImg: { width: '100%', height: '100%' },
    avatarText: { fontFamily: 'BebasNeue_400Regular', fontSize: 14, letterSpacing: 1, color: C.goldLight },
    thumb: {
      width: 44, height: 44, borderRadius: 10,
      backgroundColor: C.surface2,
      borderWidth: 1, borderColor: C.borderMid,
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    },
    title: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: C.text, marginBottom: 2 },
    meta: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: C.textDim, letterSpacing: 0.5 },
    bio: { fontFamily: 'DMSans_300Light', fontSize: 11, color: C.textMid, marginTop: 3 },
    chev: { color: C.textDim, fontSize: 22, marginLeft: 4 },
    score: { fontFamily: 'BebasNeue_400Regular', fontSize: 22, color: C.accent, letterSpacing: 1, marginLeft: 4 },
  });
}
