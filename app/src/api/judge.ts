import { supabase } from '@/lib/supabase';
import type { JudgeResult } from './builds';

export async function judgeBuild(input: {
  photo_base64: string;
  photo_mime: string;
  kit_name: string;
  grade: string;
  series: string;
  modifications: string;
}): Promise<JudgeResult> {
  const { data, error } = await supabase.functions.invoke<JudgeResult>('judge', { body: input });
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Empty response from judge');
  return data;
}
