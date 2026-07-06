import { supabase } from '@/lib/supabase';
import { track } from '@/lib/analytics';

export async function fetchMyLikedBuildIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('likes')
    .select('build_id')
    .eq('user_id', userId);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.build_id as string));
}

export async function likeBuild(userId: string, buildId: string): Promise<void> {
  const { error } = await supabase.from('likes').insert({ user_id: userId, build_id: buildId });
  if (error && !/duplicate|unique/i.test(error.message)) throw error;
  track('like_build', { build_id: buildId });
  // Fire-and-forget push notification to the build owner.
  supabase.functions
    .invoke('send-push', { body: { kind: 'like', build_id: buildId } })
    .catch(() => {});
}

export async function unlikeBuild(userId: string, buildId: string): Promise<void> {
  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('user_id', userId)
    .eq('build_id', buildId);
  if (error) throw error;
  track('unlike_build', { build_id: buildId });
}
