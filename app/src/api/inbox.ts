import { supabase } from '@/lib/supabase';
import { listBlockedIds } from './moderation';

export type InboxItem =
  | {
      kind: 'like';
      id: string;
      created_at: string;
      actor_id: string;
      actor_handle: string | null;
      actor_avatar: string | null;
      build_id: string;
      build_name: string;
    }
  | {
      kind: 'comment';
      id: string;
      created_at: string;
      actor_id: string;
      actor_handle: string | null;
      actor_avatar: string | null;
      build_id: string;
      build_name: string;
      body: string;
    }
  | {
      kind: 'follow';
      id: string;
      created_at: string;
      actor_id: string;
      actor_handle: string | null;
      actor_avatar: string | null;
    };

type ProfileRef = { handle: string | null; avatar_url: string | null } | null;
type LikeRow = { created_at: string; user_id: string; build_id: string; actor: ProfileRef };
type CommentRow = { id: string; created_at: string; user_id: string; build_id: string; body: string; actor: ProfileRef };
type FollowRow = {
  created_at: string;
  follower_id: string;
  follower: { id: string; handle: string | null; avatar_url: string | null } | null;
};

/** Fetches recent likes, comments on my builds, and new followers.
 *  Filters out blocked users. Returns items sorted newest-first. */
export async function fetchInbox(userId: string): Promise<InboxItem[]> {
  const [myBuildsRes, blocked] = await Promise.all([
    supabase.from('builds').select('id, kit_name').eq('user_id', userId),
    listBlockedIds(userId).catch(() => new Set<string>()),
  ]);
  if (myBuildsRes.error) throw myBuildsRes.error;
  const myBuilds = myBuildsRes.data ?? [];
  const buildIds = myBuilds.map((b) => b.id);
  const buildNameMap = new Map(myBuilds.map((b: any) => [b.id as string, b.kit_name as string]));

  const [likesRes, commentsRes, followsRes] = await Promise.all([
    buildIds.length
      ? supabase
          .from('likes')
          .select('created_at, user_id, build_id, actor:profiles!likes_user_id_fkey(handle, avatar_url)')
          .in('build_id', buildIds)
          .neq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [] as LikeRow[], error: null }),
    buildIds.length
      ? supabase
          .from('comments')
          .select('id, created_at, user_id, build_id, body, actor:profiles!comments_user_id_fkey(handle, avatar_url)')
          .in('build_id', buildIds)
          .neq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [] as CommentRow[], error: null }),
    supabase
      .from('follows')
      .select('created_at, follower_id, follower:profiles!follows_follower_id_fkey(id, handle, avatar_url)')
      .eq('followee_id', userId)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  if (likesRes.error) throw likesRes.error;
  if (commentsRes.error) throw commentsRes.error;
  if (followsRes.error) throw followsRes.error;

  const items: InboxItem[] = [];

  for (const r of (likesRes.data ?? []) as unknown as LikeRow[]) {
    if (blocked.has(r.user_id)) continue;
    items.push({
      kind: 'like',
      id: `like:${r.build_id}:${r.user_id}`,
      created_at: r.created_at,
      actor_id: r.user_id,
      actor_handle: r.actor?.handle ?? null,
      actor_avatar: r.actor?.avatar_url ?? null,
      build_id: r.build_id,
      build_name: buildNameMap.get(r.build_id) ?? 'your build',
    });
  }

  for (const r of (commentsRes.data ?? []) as unknown as CommentRow[]) {
    if (blocked.has(r.user_id)) continue;
    items.push({
      kind: 'comment',
      id: `comment:${r.id}`,
      created_at: r.created_at,
      actor_id: r.user_id,
      actor_handle: r.actor?.handle ?? null,
      actor_avatar: r.actor?.avatar_url ?? null,
      build_id: r.build_id,
      build_name: buildNameMap.get(r.build_id) ?? 'your build',
      body: r.body,
    });
  }

  for (const r of (followsRes.data ?? []) as unknown as FollowRow[]) {
    if (blocked.has(r.follower_id)) continue;
    items.push({
      kind: 'follow',
      id: `follow:${r.follower_id}`,
      created_at: r.created_at,
      actor_id: r.follower_id,
      actor_handle: r.follower?.handle ?? null,
      actor_avatar: r.follower?.avatar_url ?? null,
    });
  }

  items.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  return items.slice(0, 80);
}
