import { supabase } from '@/lib/supabase';

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'hate'
  | 'sexual'
  | 'violence'
  | 'ip_violation'
  | 'other';

export type ReportSubjectKind = 'build' | 'comment' | 'profile';

export async function reportContent(input: {
  reporter_id: string;
  subject_kind: ReportSubjectKind;
  subject_id: string;
  reason: ReportReason;
  notes?: string;
}): Promise<void> {
  const { error } = await supabase.from('reports').insert({
    reporter_id: input.reporter_id,
    subject_kind: input.subject_kind,
    subject_id: input.subject_id,
    reason: input.reason,
    notes: input.notes ?? null,
  });
  if (error) throw error;
}

export async function blockUser(blockerId: string, blockedId: string): Promise<void> {
  if (blockerId === blockedId) return;
  const { error } = await supabase.from('blocks').insert({
    blocker_id: blockerId,
    blocked_id: blockedId,
  });
  if (error && !/duplicate|unique/i.test(error.message)) throw error;
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId);
  if (error) throw error;
}

export async function listBlockedIds(blockerId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', blockerId);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.blocked_id as string));
}
