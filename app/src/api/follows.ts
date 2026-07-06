import { supabase } from '@/lib/supabase';
import { track } from '@/lib/analytics';

export type FollowUser = {
  id: string;
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

export async function fetchFollowers(userId: string): Promise<FollowUser[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('follower:profiles!follows_follower_id_fkey(id, handle, display_name, avatar_url)')
    .eq('followee_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as { follower: FollowUser | null }[])
    .map((r) => r.follower)
    .filter((u): u is FollowUser => !!u);
}

export async function fetchFollowing(userId: string): Promise<FollowUser[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('followee:profiles!follows_followee_id_fkey(id, handle, display_name, avatar_url)')
    .eq('follower_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as { followee: FollowUser | null }[])
    .map((r) => r.followee)
    .filter((u): u is FollowUser => !!u);
}

export async function fetchMyFollowingIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('follows')
    .select('followee_id')
    .eq('follower_id', userId);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.followee_id as string));
}

export async function isFollowing(followerId: string, followeeId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('followee_id', followeeId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function followUser(followerId: string, followeeId: string): Promise<void> {
  const { error } = await supabase.from('follows').insert({ follower_id: followerId, followee_id: followeeId });
  if (error && !/duplicate|unique/i.test(error.message)) throw error;
  track('follow_user', { followee_id: followeeId });
  supabase.functions
    .invoke('send-push', { body: { kind: 'follow', followee_id: followeeId } })
    .catch(() => {});
}

export async function unfollowUser(followerId: string, followeeId: string): Promise<void> {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('followee_id', followeeId);
  if (error) throw error;
  track('unfollow_user', { followee_id: followeeId });
}
