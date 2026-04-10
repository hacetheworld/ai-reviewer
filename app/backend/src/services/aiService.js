export async function reviewPullRequestWithAI({ title, description, diffText, rules }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required');
  }

  // Examples: gemini-1.5-flash, gemini-1.5-pro, gemini-2.0-flash
  // v1beta expects the model resource name: "models/<modelId>"
  let model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  model = String(model).trim();
  if (!model) model = 'gemini-1.5-flash';
  if (!model.startsWith('models/')) {
    model = `models/${model}`;
  }

  const prompt = buildPrompt({ title, description, diffText, rules });

  const url = `https://generativelanguage.googleapis.com/v1beta/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      generationConfig: {
        temperature: 0.2,
      },
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: [
                'You are a senior code reviewer.',
                'Return STRICT JSON only with keys: summary (string), comments (array).',
                'Each comment: {path (string), position (number), body (string)}.',
                'Do not include markdown or extra keys.',
                '',
                prompt,
              ].join('\n'),
            },
          ],
        },
      ],
    }),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(json?.error?.message || 'AI request failed');
    err.details = json;
    throw err;
  }

  const content = json?.candidates?.[0]?.content?.parts
    ?.map((p) => p?.text)
    .filter(Boolean)
    .join('');

  return parseAiJson(content);
}

function buildPrompt({ title, description, diffText, rules }) {
  return [
    `PR Title: ${title || ''}`,
    `PR Description: ${description || ''}`,
    '',
    'Repo Rules:',
    rules || '(none)',
    '',
    'Diff:',
    diffText || '(no diff)',
  ].join('\n');
}

function parseAiJson(content) {
  if (!content || typeof content !== 'string') {
    throw new Error('AI returned empty response');
  }

  // Best-effort: extract first JSON object.
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI did not return JSON');
  }

  const slice = content.slice(start, end + 1);
  let parsed;
  try {
    parsed = JSON.parse(slice);
  } catch {
    throw new Error('Failed to parse AI JSON');
  }

  const summary = typeof parsed.summary === 'string' ? parsed.summary : '';
  const comments = Array.isArray(parsed.comments) ? parsed.comments : [];

  const normalized = comments
    .map((c) => ({
      path: typeof c.path === 'string' ? c.path : '',
      position: Number.isFinite(c.position) ? c.position : Number(c.position),
      body: typeof c.body === 'string' ? c.body : '',
    }))
    .filter((c) => c.path && Number.isFinite(c.position) && c.body);

  return { summary, comments: normalized };
}
