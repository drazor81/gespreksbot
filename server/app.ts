import express, { type Request, type Response } from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import speech from '@google-cloud/speech';
import textToSpeech from '@google-cloud/text-to-speech';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'crypto';
import { createSessionToken, verifySessionToken } from './lib/session-tokens';
import { verifyChallenge } from './lib/turnstile';
import { aiModeRequestSchema } from '../src/shared/api-contract';
import { buildModePayload } from './lib/mode-handlers';
import { sessionStateStore } from './lib/session-state';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function validateChatInput(
  body: { messages?: ChatMessage[]; systemPrompt?: string },
  res: Response
): { messages: ChatMessage[]; systemPrompt: string } | null {
  const { messages, systemPrompt } = body;

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured.' });
    return null;
  }
  if (!systemPrompt || typeof systemPrompt !== 'string') {
    res.status(400).json({ error: 'Ongeldig verzoek: systemPrompt ontbreekt.' });
    return null;
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Ongeldig verzoek: messages ontbreekt.' });
    return null;
  }
  if (messages.length > 100) {
    res.status(400).json({ error: 'Ongeldig verzoek: te veel berichten.' });
    return null;
  }
  for (const msg of messages) {
    if (!msg.role || !['user', 'assistant'].includes(msg.role)) {
      res.status(400).json({ error: 'Ongeldig verzoek: ongeldige message role.' });
      return null;
    }
    if (typeof msg.content !== 'string' || msg.content.length > 10000) {
      res.status(400).json({ error: 'Ongeldig verzoek: bericht te lang of ongeldig.' });
      return null;
    }
  }
  if (systemPrompt.length > 50000) {
    res.status(400).json({ error: 'Ongeldig verzoek: systemPrompt te lang.' });
    return null;
  }
  return { messages, systemPrompt };
}

export function createApp() {
  const app = express();
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:4173',
    ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map((u) => u.trim()) : [])
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    })
  );
  app.use(express.json());

  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Te veel verzoeken. Probeer het over een minuut opnieuw.' }
  });

  app.use('/api/', apiLimiter);

  const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    timeout: 30000
  });

  let speechClient: InstanceType<typeof speech.SpeechClient> | null = null;
  let ttsClient: InstanceType<typeof textToSpeech.TextToSpeechClient> | null = null;
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    speechClient = new speech.SpeechClient();
    ttsClient = new textToSpeech.TextToSpeechClient();
    console.log('Google Cloud Speech/TTS clients initialized.');
  } else {
    console.log('GOOGLE_APPLICATION_CREDENTIALS not set — speech features disabled.');
  }

  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

  app.post('/api/session', async (req: Request, res: Response) => {
    const { challengeToken } = req.body as { challengeToken?: string };

    if (!challengeToken || typeof challengeToken !== 'string') {
      res.status(400).json({ error: 'Challenge token ontbreekt.' });
      return;
    }

    const isValid = await verifyChallenge(challengeToken);
    if (!isValid) {
      res.status(403).json({ error: 'Challenge verification failed.' });
      return;
    }

    const secret = process.env.SESSION_TOKEN_SECRET;
    if (!secret) {
      res.status(500).json({ error: 'SESSION_TOKEN_SECRET is not configured.' });
      return;
    }

    const sessionToken = await createSessionToken(secret, randomUUID());
    res.json({ sessionToken, expiresInSeconds: 900 });
  });

  app.use('/api', async (req: Request, res: Response, next) => {
    if (req.path === '/session' || req.method === 'OPTIONS') {
      next();
      return;
    }

    const authHeader = req.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const secret = process.env.SESSION_TOKEN_SECRET;
    if (!secret) {
      res.status(500).json({ error: 'SESSION_TOKEN_SECRET is not configured.' });
      return;
    }

    try {
      await verifySessionToken(secret, authHeader.slice('Bearer '.length));
      next();
    } catch {
      res.status(401).json({ error: 'Unauthorized' });
    }
  });

  app.post('/api/ai-mode', async (req: Request, res: Response) => {
    const parsed = aiModeRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid AI mode request.' });
      return;
    }

    const authHeader = req.get('authorization');
    const secret = process.env.SESSION_TOKEN_SECRET;
    if (!authHeader?.startsWith('Bearer ') || !secret) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const payload = await verifySessionToken(secret, authHeader.slice('Bearer '.length));
      const sid = typeof payload.sid === 'string' ? payload.sid : randomUUID();
      const built = buildModePayload({ sid, store: sessionStateStore, input: parsed.data });

      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: built.systemPrompt,
        messages: built.messages.map((message) => ({
          role: message.role,
          content: message.content
        }))
      });

      const textContent = response.content.find((c) => c.type === 'text');
      res.json({ response: textContent && 'text' in textContent ? textContent.text : 'Geen antwoord ontvangen.' });
    } catch (error) {
      console.error('Structured AI mode error:', error);
      res.status(500).json({ error: 'Er ging iets mis met de AI. Probeer het opnieuw.' });
    }
  });
  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const input = validateChatInput(req.body, res);
      if (!input) return;

      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: input.systemPrompt,
        messages: input.messages.map((m) => ({
          role: m.role,
          content: m.content
        }))
      });

      const textContent = response.content.find((c) => c.type === 'text');
      res.json({ response: textContent && 'text' in textContent ? textContent.text : 'Geen antwoord ontvangen.' });
    } catch (error) {
      console.error('Anthropic API error:', error);
      res.status(500).json({ error: 'Er ging iets mis met de AI. Probeer het opnieuw.' });
    }
  });

  app.post('/api/chat/stream', async (req: Request, res: Response) => {
    try {
      const input = validateChatInput(req.body, res);
      if (!input) return;

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      let aborted = false;
      req.on('close', () => {
        aborted = true;
      });

      const stream = anthropic.messages.stream({
        model: MODEL,
        max_tokens: 1024,
        system: input.systemPrompt,
        messages: input.messages.map((m) => ({
          role: m.role,
          content: m.content
        }))
      });

      let fullText = '';

      stream.on('text', (text) => {
        if (aborted) return;
        fullText += text;
        res.write(`data: ${JSON.stringify({ delta: text })}\n\n`);
      });

      stream.on('error', (error) => {
        console.error('Anthropic stream error:', error);
        if (!aborted) {
          res.write(`data: ${JSON.stringify({ error: 'Er ging iets mis met de AI.' })}\n\n`);
          res.end();
        }
      });

      await stream.finalMessage();

      if (!aborted) {
        res.write(`data: ${JSON.stringify({ done: true, fullText })}\n\n`);
        res.end();
      }
    } catch (error) {
      console.error('Anthropic stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Er ging iets mis met de AI. Probeer het opnieuw.' });
      } else {
        res.end();
      }
    }
  });

  app.post('/api/speech-to-text', upload.single('audio'), async (req: Request, res: Response) => {
    try {
      if (!speechClient) {
        res.status(500).json({
          error: 'Speech-to-Text is niet geconfigureerd. Stel GOOGLE_APPLICATION_CREDENTIALS in.'
        });
        return;
      }
      if (!req.file) {
        res.status(400).json({ error: 'Geen audiobestand ontvangen.' });
        return;
      }

      const allowedMimeTypes = ['audio/webm', 'audio/ogg', 'audio/wav', 'audio/mpeg', 'audio/mp4'];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        res.status(400).json({ error: 'Ongeldig bestandstype. Alleen audio bestanden toegestaan.' });
        return;
      }

      const audioBytes = req.file.buffer.toString('base64');

      const [response] = await speechClient.recognize({
        audio: { content: audioBytes },
        config: {
          encoding: 'WEBM_OPUS' as const,
          sampleRateHertz: 48000,
          languageCode: 'nl-NL',
          enableAutomaticPunctuation: true
        }
      });

      const transcript =
        response.results
          ?.map((r) => r.alternatives?.[0]?.transcript)
          .filter(Boolean)
          .join(' ') || '';

      res.json({ transcript });
    } catch (error) {
      console.error('Speech-to-Text error:', error);
      res.status(500).json({ error: 'Spraakherkenning mislukt. Probeer het opnieuw.' });
    }
  });

  app.post('/api/text-to-speech', async (req: Request, res: Response) => {
    try {
      if (!ttsClient) {
        res.status(500).json({
          error: 'Text-to-Speech is niet geconfigureerd. Stel GOOGLE_APPLICATION_CREDENTIALS in.'
        });
        return;
      }

      const { text } = req.body as { text: string };
      if (!text || typeof text !== 'string') {
        res.status(400).json({ error: 'Geen tekst ontvangen.' });
        return;
      }
      if (text.length > 5000) {
        res.status(400).json({ error: 'Tekst te lang (max 5000 karakters).' });
        return;
      }

      const cleanText = text
        .replace(/\*[^*]+\*/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) {
        res.status(400).json({ error: 'Geen spreekbare tekst na filtering.' });
        return;
      }

      const [response] = await ttsClient.synthesizeSpeech({
        input: { text: cleanText },
        voice: { languageCode: 'nl-NL', ssmlGender: 'NEUTRAL' as const },
        audioConfig: { audioEncoding: 'MP3' as const }
      });

      if (!response.audioContent) {
        res.status(500).json({ error: 'Spraaksynthese retourneerde geen audio.' });
        return;
      }

      res.set('Content-Type', 'audio/mpeg');
      res.send(Buffer.from(response.audioContent as Uint8Array));
    } catch (error) {
      console.error('Text-to-Speech error:', error);
      res.status(500).json({ error: 'Spraaksynthese mislukt. Probeer het opnieuw.' });
    }
  });

  return app;
}


