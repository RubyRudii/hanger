import { decode as decodeBase64 } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';
import { track } from '@/lib/analytics';

export type Kit = {
  id: string;
  user_id: string;
  kit_name: string;
  grade: string;
  series: string | null;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
};

export async function listKits(userId: string): Promise<Kit[]> {
  const { data, error } = await supabase
    .from('kits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Kit[];
}

export async function createKit(input: {
  user_id: string;
  kit_name: string;
  grade: string;
  series?: string;
  notes?: string;
  photo_url?: string | null;
}): Promise<Kit> {
  const { data, error } = await supabase
    .from('kits')
    .insert({
      user_id: input.user_id,
      kit_name: input.kit_name,
      grade: input.grade,
      series: input.series ?? null,
      notes: input.notes ?? null,
      photo_url: input.photo_url ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  track('kit_logged', { grade: input.grade, has_photo: !!input.photo_url });
  return data as Kit;
}

export async function deleteKit(id: string): Promise<void> {
  const { error } = await supabase.from('kits').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadKitPhoto(userId: string, base64: string, ext: string): Promise<string> {
  const path = `${userId}/kits/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('build-photos')
    .upload(path, decodeBase64(base64), { contentType: `image/${ext}`, upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('build-photos').getPublicUrl(path);
  return data.publicUrl;
}
