import Anthropic from '@anthropic-ai/sdk';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 30000,
});

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(u => u.trim()) : []),
].filter(Boolean);

// Simple in-memory rate limiting (resets per cold start)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 20;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  record.count++;
  return record.count <= RATE_LIMIT_MAX;
}

export default async function handler(req, res) {
  // CORS - only allow specific origins
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Te veel verzoeken. Probeer het over een minuut opnieuw.' });
  }

  try {
    const { messages, systemPrompt } = req.body;

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured.' });
    }

    // Input validatie
    if (!systemPrompt || typeof systemPrompt !== 'string') {
      return res.status(400).json({ error: 'Ongeldig verzoek: systemPrompt ontbreekt.' });
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Ongeldig verzoek: messages ontbreekt.' });
    }
    if (messages.length > 100) {
      return res.status(400).json({ error: 'Ongeldig verzoek: te veel berichten.' });
    }
    for (const msg of messages) {
      if (!msg.role || !['user', 'assistant'].includes(msg.role)) {
        return res.status(400).json({ error: 'Ongeldig verzoek: ongeldige message role.' });
      }
      if (typeof msg.content !== 'string' || msg.content.length > 10000) {
        return res.status(400).json({ error: 'Ongeldig verzoek: bericht te lang of ongeldig.' });
      }
    }
    if (systemPrompt.length > 50000) {
      return res.status(400).json({ error: 'Ongeldig verzoek: systemPrompt te lang.' });
    }

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });

    const textContent = response.content.find(c => c.type === 'text');
    res.json({ response: textContent?.text || 'Geen antwoord ontvangen.' });
  } catch (error) {
    console.error('Anthropic API error:', error);
    res.status(500).json({ error: 'Er ging iets mis met de AI. Probeer het opnieuw.' });
  }
}
