import { supabase } from '@/lib/supabase';
import type { JudgeResult } from './builds';

export type JudgeErrorCode = 'PAYWALL' | 'NO_CREDITS' | 'ANTHROPIC_DOWN' | 'BAD_IMAGE' | 'UNKNOWN';

export class JudgeError extends Error {
  code: JudgeErrorCode;
  userTitle: string;
  userMessage: string;
  raw?: string;
  constructor(code: JudgeErrorCode, userTitle: string, userMessage: string, raw?: string) {
    super(userMessage);
    this.name = 'JudgeError';
    this.code = code;
    this.userTitle = userTitle;
    this.userMessage = userMessage;
    this.raw = raw;
  }
}

function classify(raw: string): JudgeError {
  // Try structured JSON first (our edge function wraps errors as { error, code? })
  let parsed: any;
  try { parsed = JSON.parse(raw); } catch { /* not JSON */ }

  if (parsed?.code === 'paywall') {
    return new JudgeError(
      'PAYWALL',
      'Subscription required',
      'AI Judge is a subscriber feature. Start your 7-day free trial to submit builds.',
      raw,
    );
  }

  const message: string = typeof parsed?.error === 'string' ? parsed.error : raw;

  if (/credit balance is too low|insufficient_quota|billing/i.test(message)) {
    return new JudgeError(
      'NO_CREDITS',
      'AI Judge paused',
      'The scoring service is temporarily unavailable. Please try again shortly.',
      raw,
    );
  }
  if (/anthropic|overloaded|rate.?limit|502|503|504/i.test(message)) {
    return new JudgeError(
      'ANTHROPIC_DOWN',
      'AI Judge busy',
      'The scoring service is under load. Give it a minute and try again.',
      raw,
    );
  }
  if (/photo|image|too large|too small|invalid.?image/i.test(message)) {
    return new JudgeError(
      'BAD_IMAGE',
      "Couldn't read that photo",
      'Try a different shot — well-lit, in focus, roughly 1000px+ on the long edge.',
      raw,
    );
  }

  return new JudgeError(
    'UNKNOWN',
    'Pilot review failed',
    'Something went wrong on our end. Please try again.',
    raw,
  );
}

export async function judgeBuild(input: {
  photo_base64: string;
  photo_mime: string;
  kit_name: string;
  grade: string;
  series: string;
  modifications: string;
}): Promise<JudgeResult> {
  const { data, error } = await supabase.functions.invoke<JudgeResult>('judge', { body: input });
  if (error) {
    let bodyText: string | undefined;
    try {
      const context: any = (error as any).context;
      if (context?.response?.text) {
        bodyText = await context.response.text();
      }
    } catch { /* noop */ }
    throw classify(bodyText || error.message || 'Unknown error');
  }
  if (!data) {
    throw new JudgeError('UNKNOWN', 'Pilot review failed', 'Empty response from AI Judge. Please try again.');
  }
  return data;
}
