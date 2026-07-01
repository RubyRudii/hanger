import { supabase } from '@/lib/supabase';

export type Comment = {
  id: string;
  build_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author_handle: string | null;
  author_avatar: string | null;
};

type Row = {
  id: string;
  build_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles: { handle: string | null; avatar_url: string | null } | null;
};

function shape(r: Row): Comment {
  return {
    id: r.id,
    build_id: r.build_id,
    user_id: r.user_id,
    body: r.body,
    created_at: r.created_at,
    author_handle: r.profiles?.handle ?? null,
    author_avatar: r.profiles?.avatar_url ?? null,
  };
}

export async function fetchComments(buildId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*, profiles!comments_user_id_fkey(handle, avatar_url)')
    .eq('build_id', buildId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as Row[]).map(shape);
}

export async function addComment(userId: string, buildId: string, body: string): Promise<Comment> {
  const trimmed = body.trim();
  if (!trimmed) throw new Error('Comment cannot be empty.');
  if (trimmed.length > 500) throw new Error('Comment is too long (500 char limit).');

  const { data, error } = await supabase
    .from('comments')
    .insert({ user_id: userId, build_id: buildId, body: trimmed })
    .select('*, profiles!comments_user_id_fkey(handle, avatar_url)')
    .single();
  if (error) throw error;

  // Fire-and-forget push to the build owner.
  supabase.functions
    .invoke('send-push', { body: { kind: 'comment', build_id: buildId, body: trimmed } })
    .catch(() => {});

  return shape(data as Row);
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) throw error;
}
