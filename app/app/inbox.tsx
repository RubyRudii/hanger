import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import Svg, { Circle, Path } from 'react-native-svg';
import { fetchInbox, InboxItem } from '@/api/inbox';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Palette } from '@/lib/theme';

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d / 60)}m`;
  if (d < 86400) return `${Math.floor(d / 3600)}h`;
  if (d < 604800) return `${Math.floor(d / 86400)}d`;
  return `${Math.floor(d / 604800)}w`;
}

export default function Inbox() {
  const { session } = useAuth();
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const data = await fetchInbox(session.user.id);
      setItems(data);
    } catch (e: any) {
      console.warn('inbox load failed', e?.message ?? e);
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

  function onOpen(item: InboxItem) {
    if (item.kind === 'follow') {
      if (item.actor_handle) router.push(`/pilot/${item.actor_handle}`);
    } else {
      router.push(`/build/${item.build_id}`);
    }
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()}>
            <Svg width={14} height={14} viewBox="0 0 14 14">
              <Path d="M9 11L5 7L9 3" stroke={C.textMid} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>INBOX</Text>
            <Text style={styles.headerSub}>// TRANSMISSIONS</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={C.accent} />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
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
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => <InboxRow item={item} onPress={() => onOpen(item)} />}
            ListEmptyComponent={
              <EmptyState
                icon={<Text style={{ fontSize: 30 }}>📡</Text>}
                title="INBOX EMPTY"
                body="Likes, comments, and new followers land here once other pilots start engaging with your builds."
              />
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

function InboxRow({ item, onPress }: { item: InboxItem; onPress: () => void }) {
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const initials = (item.actor_handle ?? '?').slice(0, 2).toUpperCase();

  const iconColor = item.kind === 'like' ? C.like : item.kind === 'comment' ? C.accent : C.blueHud;

  const text =
    item.kind === 'like'
      ? `liked ${item.build_name}`
      : item.kind === 'comment'
        ? `commented on ${item.build_name}`
        : 'started following you';

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={[styles.kindBadge, { borderColor: iconColor }]}>
        {item.kind === 'like' ? (
          <Svg width={14} height={14} viewBox="0 0 16 16">
            <Path
              d="M8 14s-5.5-3.5-5.5-7.5C2.5 4.5 4 3 6 3c1.2 0 2.2.6 2.5 1 .3-.4 1.3-1 2.5-1 2 0 3.5 1.5 3.5 3.5C13.5 10.5 8 14 8 14z"
              fill={iconColor}
              stroke={iconColor}
              strokeWidth={1.2}
            />
          </Svg>
        ) : item.kind === 'comment' ? (
          <Svg width={14} height={14} viewBox="0 0 16 16">
            <Path
              d="M2.5 3.5h11c.55 0 1 .45 1 1v6c0 .55-.45 1-1 1H8l-3 2.5v-2.5H2.5c-.55 0-1-.45-1-1v-6c0-.55.45-1 1-1z"
              stroke={iconColor}
              strokeWidth={1.3}
              fill="none"
              strokeLinejoin="round"
            />
          </Svg>
        ) : (
          <Svg width={14} height={14} viewBox="0 0 20 20">
            <Circle cx={10} cy={7} r={3} stroke={iconColor} strokeWidth={1.5} />
            <Path d="M3 17c0-3 3.1-5 7-5s7 2 7 5" stroke={iconColor} strokeWidth={1.5} strokeLinecap="round" />
          </Svg>
        )}
      </View>

      <View style={styles.avatar}>
        {item.actor_avatar ? (
          <Image source={{ uri: item.actor_avatar }} style={styles.avatarImg} />
        ) : (
          <Text style={styles.avatarText}>{initials}</Text>
        )}
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.text} numberOfLines={2}>
          <Text style={styles.handle}>@{item.actor_handle ?? 'someone'}</Text> {text}
        </Text>
        {item.kind === 'comment' ? (
          <Text style={styles.body} numberOfLines={2}>
            "{item.body}"
          </Text>
        ) : null}
        <Text style={styles.time}>{timeAgo(item.created_at)} ago</Text>
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
      flexDirection: 'row', alignItems: 'center', gap: 12,
      borderBottomWidth: 1, borderBottomColor: C.border,
    },
    iconBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: C.surface, borderWidth: 1, borderColor: C.borderMid,
      alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontFamily: 'BebasNeue_400Regular', fontSize: 18, letterSpacing: 3, color: C.text },
    headerSub: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, letterSpacing: 1.5, color: C.textDim, marginTop: 3 },

    row: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: C.surface,
      borderWidth: 1, borderColor: C.border, borderRadius: 14,
      padding: 12,
    },
    kindBadge: {
      width: 30, height: 30, borderRadius: 15,
      borderWidth: 1,
      backgroundColor: C.surface2,
      alignItems: 'center', justifyContent: 'center',
    },
    avatar: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: C.royalBright,
      borderWidth: 1, borderColor: C.accentRing,
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImg: { width: '100%', height: '100%' },
    avatarText: { fontFamily: 'BebasNeue_400Regular', fontSize: 13, letterSpacing: 1, color: C.goldLight },

    text: { fontSize: 13, color: C.textMid, fontFamily: 'DMSans_300Light', lineHeight: 18 },
    handle: { color: C.text, fontFamily: 'DMSans_500Medium' },
    body: { fontSize: 12, color: C.textDim, fontFamily: 'DMSans_300Light', marginTop: 4, fontStyle: 'italic', lineHeight: 16 },
    time: { fontSize: 10, color: C.textDim, fontFamily: 'JetBrainsMono_400Regular', marginTop: 4, letterSpacing: 0.5 },
  });
}
