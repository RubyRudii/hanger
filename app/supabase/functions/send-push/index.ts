// Supabase Edge Function: send-push
// Called from the client when a user takes an action that should notify
// someone else (e.g. liking a build). The function looks up the recipient's
// stored push token and forwards a notification through Expo's free push API.
//
// Deploy:  supabase functions deploy send-push

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Input =
  | { kind: 'like'; build_id: string }
  | { kind: 'comment'; build_id: string; body: string }
  | { kind: 'raw'; recipient_id: string; title: string; body: string; data?: Record<string, unknown> };

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

async function sendExpoPush(token: string, title: string, body: string, data?: Record<string, unknown>) {
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Accept-encoding': 'gzip, deflate', 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: token, sound: 'default', title, body, data: data ?? {} }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.warn('Expo push failed', res.status, text);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ error: 'misconfigured' }, 500);
  }

  const auth = req.headers.get('authorization') ?? '';
  const jwt = auth.replace(/^Bearer\s+/i, '');
  if (!jwt) return jsonResponse({ error: 'no auth' }, 401);

  const userClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userRes, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userRes?.user) return jsonResponse({ error: 'invalid auth' }, 401);
  const actorId = userRes.user.id;

  let input: Input;
  try {
    input = await req.json();
  } catch {
    return jsonResponse({ error: 'invalid json' }, 400);
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (input.kind === 'like') {
    const { data: build, error: bErr } = await admin
      .from('builds')
      .select('id, user_id, kit_name')
      .eq('id', input.build_id)
      .maybeSingle();
    if (bErr || !build) return jsonResponse({ error: 'build not found' }, 404);
    if (build.user_id === actorId) return jsonResponse({ ok: true, skipped: 'self' });

    const { data: owner } = await admin
      .from('profiles')
      .select('push_token, push_enabled')
      .eq('id', build.user_id)
      .maybeSingle();
    if (!owner?.push_enabled || !owner.push_token) {
      return jsonResponse({ ok: true, skipped: 'no token' });
    }

    const { data: actor } = await admin
      .from('profiles')
      .select('handle')
      .eq('id', actorId)
      .maybeSingle();
    const handle = actor?.handle ?? 'someone';

    await sendExpoPush(
      owner.push_token,
      'New like on your build',
      `@${handle} liked ${build.kit_name}`,
      { kind: 'like', build_id: build.id },
    );
    return jsonResponse({ ok: true });
  }

  if (input.kind === 'comment') {
    const { data: build, error: bErr } = await admin
      .from('builds')
      .select('id, user_id, kit_name')
      .eq('id', input.build_id)
      .maybeSingle();
    if (bErr || !build) return jsonResponse({ error: 'build not found' }, 404);
    if (build.user_id === actorId) return jsonResponse({ ok: true, skipped: 'self' });

    const { data: owner } = await admin
      .from('profiles')
      .select('push_token, push_enabled')
      .eq('id', build.user_id)
      .maybeSingle();
    if (!owner?.push_enabled || !owner.push_token) {
      return jsonResponse({ ok: true, skipped: 'no token' });
    }

    const { data: actor } = await admin
      .from('profiles')
      .select('handle')
      .eq('id', actorId)
      .maybeSingle();
    const handle = actor?.handle ?? 'someone';

    const snippet = (input.body ?? '').slice(0, 120);
    await sendExpoPush(
      owner.push_token,
      `@${handle} commented on ${build.kit_name}`,
      snippet,
      { kind: 'comment', build_id: build.id },
    );
    return jsonResponse({ ok: true });
  }

  if (input.kind === 'raw') {
    const { data: recipient } = await admin
      .from('profiles')
      .select('push_token, push_enabled')
      .eq('id', input.recipient_id)
      .maybeSingle();
    if (!recipient?.push_enabled || !recipient.push_token) {
      return jsonResponse({ ok: true, skipped: 'no token' });
    }
    await sendExpoPush(recipient.push_token, input.title, input.body, input.data);
    return jsonResponse({ ok: true });
  }

  return jsonResponse({ error: 'unknown kind' }, 400);
});
