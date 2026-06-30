import { supabase } from '@/lib/supabase';

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
}

export async function unlikeBuild(userId: string, buildId: string): Promise<void> {
  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('user_id', userId)
    .eq('build_id', buildId);
  if (error) throw error;
}
