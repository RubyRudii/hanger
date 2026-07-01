import { supabase } from '@/lib/supabase';

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
}
