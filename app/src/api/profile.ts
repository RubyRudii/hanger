import { decode as decodeBase64 } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';

const HANDLE_RE = /^[a-z0-9_]{3,20}$/;

export function validateHandle(handle: string): string | null {
  if (!handle) return 'Handle is required.';
  if (handle.length < 3) return 'Handle must be at least 3 characters.';
  if (handle.length > 20) return 'Handle must be 20 characters or fewer.';
  if (!HANDLE_RE.test(handle)) return 'Use lowercase letters, digits, or underscore.';
  return null;
}

export async function updateProfile(
  userId: string,
  fields: {
    display_name?: string | null;
    handle?: string;
    bio?: string | null;
    avatar_url?: string | null;
  },
): Promise<void> {
  const { error } = await supabase.from('profiles').update(fields).eq('id', userId);
  if (error) throw error;
}

export async function uploadAvatar(userId: string, base64: string, ext: string): Promise<string> {
  const path = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage
    .from('build-photos')
    .upload(path, decodeBase64(base64), { contentType: `image/${ext}`, upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('build-photos').getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}
