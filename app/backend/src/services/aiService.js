export async function reviewPullRequestWithAI({ title, description, diffText, rules }) {
    return "AI response";   
    
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required');
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const prompt = buildPrompt({ title, description, diffText, rules });

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You are a senior code reviewer. Return STRICT JSON only with keys: summary (string), comments (array). Each comment: {path (string), position (number), body (string)}. Do not include markdown or extra keys.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    const err = new Error(json?.error?.message || 'AI request failed');
    err.details = json;
    throw err;
  }

  const content = json?.choices?.[0]?.message?.content;
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
