import { supabase } from '@/lib/supabase';

export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-account', { body: {} });
  if (error) throw new Error(error.message);
  await supabase.auth.signOut();
}
