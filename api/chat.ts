import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyIdToken, checkAiAccess, loadHouseholdData } from './_lib/auth';
import { buildSystemPrompt } from './_lib/promptBuilder';
import { streamFromDeepSeek } from './_lib/deepseek';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const rawAuth = req.headers.authorization;
  const idToken = typeof rawAuth === 'string' ? rawAuth.replace('Bearer ', '') : null;
  if (!idToken) return res.status(401).json({ error: 'no_token' });

  const decoded = await verifyIdToken(idToken);
  if (!decoded) return res.status(401).json({ error: 'invalid_token' });

  const allowed = await checkAiAccess(decoded.uid);
  if (!allowed) return res.status(403).json({ error: 'no_access' });

  const { messages } = req.body as { messages?: unknown };
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'bad_request' });
  }
  if (messages.length > 50) return res.status(400).json({ error: 'too_many_messages' });

  const ALLOWED_ROLES = new Set(['user', 'assistant']);
  type RawMsg = { role?: unknown; content?: unknown };
  const invalid = messages.some((m: unknown) => {
    const msg = m as RawMsg;
    if (!ALLOWED_ROLES.has(msg.role as string)) return true;
    if (typeof msg.content !== 'string') return true;
    if (msg.role === 'user' && msg.content.length > 4000) return true;
    return false;
  });
  if (invalid) return res.status(400).json({ error: 'bad_request' });

  const householdPayload = await loadHouseholdData(decoded.uid);
  if (!householdPayload) return res.status(400).json({ error: 'no_household' });

  const systemPrompt = buildSystemPrompt(householdPayload);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    await streamFromDeepSeek({
      systemPrompt,
      messages: messages as Array<{ role: 'user' | 'assistant'; content: string }>,
      onChunk: (text) => res.write(`data: ${JSON.stringify({ delta: text })}\n\n`),
    });
    res.write('data: [DONE]\n\n');
  } catch (e) {
    console.error({ uid: decoded.uid, ts: new Date().toISOString(), error: String(e) });
    res.write(`data: ${JSON.stringify({ error: 'model_error' })}\n\n`);
  }
  res.end();
}
