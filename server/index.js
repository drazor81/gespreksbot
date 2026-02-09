import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import speech from '@google-cloud/speech';
import textToSpeech from '@google-cloud/text-to-speech';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const app = express();
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// Google Cloud clients (only initialize if credentials are configured)
let speechClient = null;
let ttsClient = null;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    speechClient = new speech.SpeechClient();
    ttsClient = new textToSpeech.TextToSpeechClient();
    console.log('Google Cloud Speech/TTS clients initialized.');
} else {
    console.log('GOOGLE_APPLICATION_CREDENTIALS not set — speech features disabled.');
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.post('/api/chat', async (req, res) => {
    try {
        const { messages, systemPrompt } = req.body;

        if (!process.env.ANTHROPIC_API_KEY) {
            return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured.' });
        }

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: systemPrompt,
            messages: messages.map(m => ({
                role: m.role,
                content: m.content
            }))
        });

        const textContent = response.content.find(c => c.type === 'text');
        res.json({ response: textContent?.text || 'Geen antwoord ontvangen.' });
    } catch (error) {
        console.error('Anthropic API error:', error);
        res.status(500).json({ error: error.message || 'Er ging iets mis met de AI.' });
    }
});

// Speech-to-Text endpoint
app.post('/api/speech-to-text', upload.single('audio'), async (req, res) => {
    try {
        if (!speechClient) {
            return res.status(500).json({ error: 'Speech-to-Text is niet geconfigureerd. Stel GOOGLE_APPLICATION_CREDENTIALS in.' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'Geen audiobestand ontvangen.' });
        }

        const audioBytes = req.file.buffer.toString('base64');

        const [response] = await speechClient.recognize({
            audio: { content: audioBytes },
            config: {
                encoding: 'WEBM_OPUS',
                sampleRateHertz: 48000,
                languageCode: 'nl-NL',
                enableAutomaticPunctuation: true,
            },
        });

        const transcript = response.results
            ?.map(r => r.alternatives?.[0]?.transcript)
            .filter(Boolean)
            .join(' ') || '';

        res.json({ transcript });
    } catch (error) {
        console.error('Speech-to-Text error:', error);
        res.status(500).json({ error: error.message || 'Speech-to-Text fout.' });
    }
});

// Text-to-Speech endpoint
app.post('/api/text-to-speech', async (req, res) => {
    try {
        if (!ttsClient) {
            return res.status(500).json({ error: 'Text-to-Speech is niet geconfigureerd. Stel GOOGLE_APPLICATION_CREDENTIALS in.' });
        }

        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Geen tekst ontvangen.' });
        }

        // Strip *italics* non-verbal cues before sending to TTS
        const cleanText = text.replace(/\*[^*]+\*/g, '').replace(/\s+/g, ' ').trim();

        if (!cleanText) {
            return res.status(400).json({ error: 'Geen spreekbare tekst na filtering.' });
        }

        const [response] = await ttsClient.synthesizeSpeech({
            input: { text: cleanText },
            voice: { languageCode: 'nl-NL', ssmlGender: 'NEUTRAL' },
            audioConfig: { audioEncoding: 'MP3' },
        });

        res.set('Content-Type', 'audio/mpeg');
        res.send(Buffer.from(response.audioContent));
    } catch (error) {
        console.error('Text-to-Speech error:', error);
        res.status(500).json({ error: error.message || 'Text-to-Speech fout.' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
