import { decode as decodeBase64 } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';
import type { BuildSummary } from '@/components/BuildCard';

export type Scores = {
  panel_lining: number;
  paint_finish: number;
  pose_composition: number;
  weathering: number;
  overall_polish: number;
};

export type JudgeResult = {
  overall: number;
  scores: Scores;
  verdict: string;
  strength: string;
  work_on: string;
};

type DbBuild = {
  id: string;
  user_id: string;
  kit_name: string;
  grade: string;
  series: string | null;
  modifications: string | null;
  photo_url: string | null;
  score: number;
  scores: Scores;
  verdict: string;
  strength: string;
  work_on: string;
  created_at: string;
  like_count: number;
  profiles: { handle: string | null } | null;
};

function summarize(b: DbBuild): BuildSummary {
  return {
    id: b.id,
    kit_name: b.kit_name,
    grade: b.grade,
    photo_url: b.photo_url,
    score: b.score,
    created_at: b.created_at,
    builder_handle: b.profiles?.handle ?? null,
    like_count: b.like_count ?? 0,
  };
}

export async function fetchFeed(): Promise<BuildSummary[]> {
  const { data, error } = await supabase
    .from('builds')
    .select('*, profiles!builds_user_id_fkey(handle)')
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data as DbBuild[]).map(summarize);
}

export async function fetchTopThisWeek(): Promise<BuildSummary[]> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const { data, error } = await supabase
    .from('builds')
    .select('*, profiles!builds_user_id_fkey(handle)')
    .gte('created_at', weekAgo)
    .order('score', { ascending: false })
    .limit(3);
  if (error) throw error;
  return (data as DbBuild[]).map(summarize);
}

export async function fetchMyBuilds(userId: string): Promise<BuildSummary[]> {
  const { data, error } = await supabase
    .from('builds')
    .select('*, profiles!builds_user_id_fkey(handle)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as DbBuild[]).map(summarize);
}

export async function fetchBuild(id: string): Promise<DbBuild | null> {
  const { data, error } = await supabase
    .from('builds')
    .select('*, profiles!builds_user_id_fkey(handle)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as DbBuild) ?? null;
}

export async function uploadPhoto(userId: string, base64: string, ext: string): Promise<string> {
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('build-photos')
    .upload(path, decodeBase64(base64), { contentType: `image/${ext}`, upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('build-photos').getPublicUrl(path);
  return data.publicUrl;
}

export async function createBuild(input: {
  user_id: string;
  kit_name: string;
  grade: string;
  series: string;
  modifications: string;
  photo_url: string;
  result: JudgeResult;
}): Promise<string> {
  const { data, error } = await supabase
    .from('builds')
    .insert({
      user_id: input.user_id,
      kit_name: input.kit_name,
      grade: input.grade,
      series: input.series,
      modifications: input.modifications,
      photo_url: input.photo_url,
      score: input.result.overall,
      scores: input.result.scores,
      verdict: input.result.verdict,
      strength: input.result.strength,
      work_on: input.result.work_on,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export type { DbBuild };
