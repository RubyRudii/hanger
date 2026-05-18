// Supabase Edge Function: judge
// Receives a base64-encoded kit photo + metadata and asks Claude to score it.
//
// Required secret:  ANTHROPIC_API_KEY  (supabase secrets set ANTHROPIC_API_KEY=...)
// Deploy:           supabase functions deploy judge
//
// The function returns a JudgeResult:
//   { overall, scores: { panel_lining, paint_finish, pose_composition, weathering, overall_polish },
//     verdict, strength, work_on }

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const MODEL = 'claude-sonnet-4-6';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Input = {
  photo_base64: string;
  photo_mime: string;
  kit_name: string;
  grade: string;
  series?: string;
  modifications?: string;
};

type Scores = {
  panel_lining: number;
  paint_finish: number;
  pose_composition: number;
  weathering: number;
  overall_polish: number;
};

type JudgeResult = {
  overall: number;
  scores: Scores;
  verdict: string;
  strength: string;
  work_on: string;
};

function clamp(n: unknown, fallback: number): number {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function extractJson(text: string): unknown {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence ? fence[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object in model output');
  return JSON.parse(candidate.slice(start, end + 1));
}

const SYSTEM = `You are an experienced Gunpla competition judge for the Hanger app.
You evaluate finished plastic model kits with the eye of a senior modeler — fair, specific, and constructive.
You return ONLY a single JSON object with this exact shape (no prose, no markdown):
{
  "scores": {
    "panel_lining": <0-100>,
    "paint_finish": <0-100>,
    "pose_composition": <0-100>,
    "weathering": <0-100>,
    "overall_polish": <0-100>
  },
  "verdict": "<2-3 sentence judge's verdict, specific to what is visible in the photo>",
  "strength": "<one short phrase highlighting what stands out>",
  "work_on": "<one short phrase with the most useful improvement>"
}
Scoring guidance:
- 90+ : competition-grade. Reserve for clearly exceptional work.
- 80-89 : strong build, polished finish, intentional choices.
- 70-79 : solid out-of-box build, room to grow.
- below 70 : visible flaws (seams, nub marks, blotchy paint, no panel lines).
Be specific. Mention parts of the kit you can actually see.`;

function userPrompt(input: Input): string {
  return [
    `Kit: ${input.kit_name}`,
    `Grade: ${input.grade}`,
    input.series ? `Series: ${input.series}` : null,
    input.modifications ? `Modifications: ${input.modifications}` : 'Modifications: out of box',
    '',
    'Judge this build. Return the JSON object only.',
  ]
    .filter(Boolean)
    .join('\n');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  let input: Input;
  try {
    input = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  if (!input.photo_base64 || !input.photo_mime || !input.kit_name || !input.grade) {
    return new Response(JSON.stringify({ error: 'photo_base64, photo_mime, kit_name, grade required' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 800,
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: input.photo_mime, data: input.photo_base64 },
            },
            { type: 'text', text: userPrompt(input) },
          ],
        },
      ],
    }),
  });

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text();
    return new Response(JSON.stringify({ error: `Anthropic ${anthropicRes.status}: ${errText}` }), {
      status: 502,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const data = await anthropicRes.json();
  const text: string = data?.content?.[0]?.text ?? '';

  let parsed: any;
  try {
    parsed = extractJson(text);
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to parse model output', raw: text }), {
      status: 502,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const scores: Scores = {
    panel_lining: clamp(parsed?.scores?.panel_lining, 70),
    paint_finish: clamp(parsed?.scores?.paint_finish, 70),
    pose_composition: clamp(parsed?.scores?.pose_composition, 70),
    weathering: clamp(parsed?.scores?.weathering, 70),
    overall_polish: clamp(parsed?.scores?.overall_polish, 70),
  };

  const overall = Math.round(
    (scores.panel_lining + scores.paint_finish + scores.pose_composition + scores.weathering + scores.overall_polish) / 5,
  );

  const result: JudgeResult = {
    overall,
    scores,
    verdict: String(parsed?.verdict ?? 'A solid build with room to push the finishing technique further.'),
    strength: String(parsed?.strength ?? 'Clean construction'),
    work_on: String(parsed?.work_on ?? 'Add panel lines for more depth'),
  };

  return new Response(JSON.stringify(result), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
});
