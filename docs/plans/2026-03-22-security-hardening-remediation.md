# Security Hardening Remediation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Sluit de open prompt-proxy, maak AI-rendering veilig, harden de publieke backendpaden en houd de bestaande gesprekspromptkwaliteit inhoudelijk gelijk.

**Architecture:** De frontend stopt met het verzenden van `systemPrompt`-strings en spreekt alleen nog met gevalideerde, server-owned AI modes (`start`, `chat`, `coach`, `feedback`, `stream`). De Render/Express backend wordt de enige promptautoriteit, geeft kortlevende sessietokens uit en bouwt exact dezelfde promptinhoud op uit bestaande prompttemplates, config en kennisbank. De browser rendert AI-feedback daarna via veilige DOM-opbouw in plaats van ruwe `innerHTML`, terwijl deployment en dependency-hygiëne worden opgeschoond.

**Tech Stack:** TypeScript, Vite, Express, `zod`, `jose`, Vitest, jsdom, Supertest, Helmet, express-rate-limit, multer

---

### Task 1: Testharnas en gedeeld API-contract opzetten

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `vitest.config.ts`
- Create: `tests/setup/dom.ts`
- Create: `tests/security/api-contract.test.ts`
- Create: `src/shared/api-contract.ts`

**Step 1: Voeg unit-test tooling toe**

Run:

```bash
npm install -D vitest jsdom supertest @types/supertest
```

Expected: install voltooid zonder dependency-conflicten.

**Step 2: Voeg testscripts toe aan `package.json`**

Gebruik deze scripts:

```json
{
  "scripts": {
    "test:unit": "vitest run",
    "test:unit:watch": "vitest"
  }
}
```

**Step 3: Maak `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup/dom.ts'],
    include: ['tests/**/*.test.ts']
  }
});
```

**Step 4: Schrijf de falende contracttest**

```ts
import { describe, expect, it } from 'vitest';
import { aiModeRequestSchema } from '../../src/shared/api-contract';

describe('aiModeRequestSchema', () => {
  it('rejects legacy client-owned systemPrompt payloads', () => {
    const result = aiModeRequestSchema.safeParse({
      systemPrompt: 'do not allow this',
      messages: [{ role: 'user', content: 'Hallo' }]
    });

    expect(result.success).toBe(false);
  });

  it('accepts validated structured mode payloads', () => {
    const result = aiModeRequestSchema.safeParse({
      mode: 'chat',
      settings: {
        setting: 'Verpleeghuis',
        scenarioType: 'Intake',
        leerdoelen: ['LSD'],
        moeilijkheid: 'Gemiddeld',
        archetype: 'Angstige cliënt',
        customScenario: '',
        customArchetype: ''
      },
      history: [{ role: 'user', content: 'Goedemorgen' }],
      message: 'Hoe gaat het met u?'
    });

    expect(result.success).toBe(true);
  });
});
```

**Step 5: Run test to verify it fails**

Run:

```bash
npm run test:unit -- tests/security/api-contract.test.ts
```

Expected: FAIL omdat `src/shared/api-contract.ts` nog niet bestaat.

**Step 6: Implementeer `src/shared/api-contract.ts`**

```ts
import { z } from 'zod';

export const roleSchema = z.enum(['user', 'assistant']);

export const messageSchema = z.object({
  role: roleSchema,
  content: z.string().min(1).max(10_000)
});

export const settingsSchema = z.object({
  setting: z.string().min(1),
  scenarioType: z.string().min(1),
  leerdoelen: z.array(z.string()).min(1).max(2),
  moeilijkheid: z.string().min(1),
  archetype: z.string().min(1),
  customScenario: z.string().max(1_000),
  customArchetype: z.string().max(250)
});

export const aiModeSchema = z.enum(['start', 'chat', 'coach', 'feedback', 'stream']);

export const aiModeRequestSchema = z.object({
  mode: aiModeSchema,
  settings: settingsSchema,
  history: z.array(messageSchema).max(100).default([]),
  message: z.string().max(10_000).optional(),
  selfAssessment: z.record(z.string(), z.string()).optional()
}).strict();

export type AiModeRequest = z.infer<typeof aiModeRequestSchema>;
```

**Step 7: Run test to verify it passes**

Run:

```bash
npm run test:unit -- tests/security/api-contract.test.ts
```

Expected: PASS.

**Step 8: Commit**

```bash
git add package.json package-lock.json vitest.config.ts tests/setup/dom.ts tests/security/api-contract.test.ts src/shared/api-contract.ts
git commit -m "test: add security contract test harness"
```

---

### Task 2: Sessietoken-bootstrap en routebescherming toevoegen

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.env.example`
- Modify: `server/index.ts`
- Create: `server/lib/session-tokens.ts`
- Create: `server/lib/turnstile.ts`
- Create: `tests/security/session-auth.test.ts`

**Step 1: Voeg runtime dependencies toe**

Run:

```bash
npm install zod jose
```

Expected: install voltooid.

**Step 2: Schrijf de falende auth-test**

```ts
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../server/index';

describe('session auth', () => {
  it('returns 401 for protected AI routes without bearer token', async () => {
    const app = createApp();
    const response = await request(app).post('/api/chat').send({});
    expect(response.status).toBe(401);
  });

  it('issues a short-lived session token', async () => {
    const app = createApp();
    const response = await request(app).post('/api/session').send({ challengeToken: 'dev-bypass' });
    expect(response.status).toBe(200);
    expect(response.body.sessionToken).toEqual(expect.any(String));
  });
});
```

**Step 3: Run test to verify it fails**

Run:

```bash
npm run test:unit -- tests/security/session-auth.test.ts
```

Expected: FAIL omdat `createApp`, `/api/session` en auth-middleware nog niet bestaan.

**Step 4: Implementeer tokenhelpers in `server/lib/session-tokens.ts`**

```ts
import { jwtVerify, SignJWT } from 'jose';

const encoder = new TextEncoder();

export async function createSessionToken(secret: string, sid: string): Promise<string> {
  return new SignJWT({ sid, scope: 'ai' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(encoder.encode(secret));
}

export async function verifySessionToken(secret: string, token: string) {
  const verified = await jwtVerify(token, encoder.encode(secret));
  return verified.payload;
}
```

**Step 5: Voeg `server/lib/turnstile.ts` toe met dev-bypass**

```ts
export async function verifyChallenge(token: string): Promise<boolean> {
  if (process.env.SESSION_AUTH_MODE !== 'turnstile') {
    return token === 'dev-bypass';
  }

  // Production implementation uses Cloudflare Turnstile siteverify.
  // Implement with fetch + TURNSTILE_SECRET_KEY and return success boolean.
  return false;
}
```

**Step 6: Refactor `server/index.ts` naar `createApp()` + auth**

Gebruik dit skelet:

```ts
export function createApp() {
  const app = express();

  app.post('/api/session', async (req, res) => {
    const ok = await verifyChallenge(req.body?.challengeToken);
    if (!ok) return res.status(403).json({ error: 'Challenge verification failed.' });

    const token = await createSessionToken(process.env.SESSION_TOKEN_SECRET!, crypto.randomUUID());
    return res.json({ sessionToken: token, expiresInSeconds: 900 });
  });

  app.use('/api', (req, res, next) => {
    if (req.path === '/session') return next();
    const auth = req.get('authorization');
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    next();
  });

  return app;
}
```

**Step 7: Voeg env-documentatie toe aan `.env.example`**

```env
SESSION_TOKEN_SECRET=replace-me-with-32-plus-random-chars
SESSION_AUTH_MODE=development
TURNSTILE_SECRET_KEY=
VITE_TURNSTILE_SITE_KEY=
```

**Step 8: Run test to verify it passes**

Run:

```bash
npm run test:unit -- tests/security/session-auth.test.ts
```

Expected: PASS.

**Step 9: Commit**

```bash
git add package.json package-lock.json .env.example server/index.ts server/lib/session-tokens.ts server/lib/turnstile.ts tests/security/session-auth.test.ts
git commit -m "security: require short-lived session tokens for AI routes"
```

---

### Task 3: Promptopbouw naar de server verplaatsen en publieke AI modes invoeren

**Files:**
- Create: `server/prompts/system-prompt.ts`
- Create: `server/prompts/feedback-prompt.ts`
- Create: `server/lib/prompt-builders.ts`
- Create: `server/lib/mode-handlers.ts`
- Modify: `server/index.ts`
- Create: `tests/security/server-ai-modes.test.ts`
- Read for copy-only: `src/prompts/system-prompt.ts`, `src/prompts/feedback-prompt.ts`, `src/knowledge/index.ts`, `src/config.ts`

**Step 1: Schrijf de falende mode-test**

```ts
import { describe, expect, it } from 'vitest';
import { buildModePayload } from '../../server/lib/mode-handlers';

describe('buildModePayload', () => {
  it('builds the patient prompt on the server for start mode', () => {
    const result = buildModePayload({
      mode: 'start',
      settings: {
        setting: 'Verpleeghuis',
        scenarioType: 'Intake',
        leerdoelen: ['LSD'],
        moeilijkheid: 'Gemiddeld',
        archetype: 'Angstige cliënt',
        customScenario: '',
        customArchetype: ''
      },
      history: []
    });

    expect(result.systemPrompt).toContain('Je bent');
    expect(result.messages[0].role).toBe('user');
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm run test:unit -- tests/security/server-ai-modes.test.ts
```

Expected: FAIL omdat de server builders nog niet bestaan.

**Step 3: Kopieer promptteksten ongewijzigd naar `server/prompts/`**

Gebruik exacte inhoud uit:
- `src/prompts/system-prompt.ts`
- `src/prompts/feedback-prompt.ts`

Doel: de prompttekst identiek houden zodat de botkwaliteit niet verandert.

**Step 4: Maak `server/lib/prompt-builders.ts`**

```ts
import { SYSTEM_PROMPT_MBO_V2 } from '../prompts/system-prompt';
import { FEEDBACK_PROMPT } from '../prompts/feedback-prompt';
import {
  getClientInstructies,
  getCoachContext,
  getRubricContext
} from '../../src/knowledge/index';
import {
  MOEILIJKHEID_BESCHRIJVING,
  MOEILIJKHEID_COLLEGA,
  getCollegaContext,
  getArchetypeBeschrijving,
  getRandomName
} from '../../src/config';

export function buildPatientSystemPrompt(settings: SelectedSettings) {
  // Same placeholder replacement logic as current frontend buildDynamicSystemPrompt().
}

export function buildFeedbackSystemPrompt(settings: SelectedSettings, selfAssessment: Record<string, string>) {
  // Same FEEDBACK_PROMPT replacement logic as current frontend generateAIFeedback().
}
```

**Step 5: Maak `server/lib/mode-handlers.ts`**

Gebruik één routerfunctie:

```ts
export function buildModePayload(input: AiModeRequest) {
  switch (input.mode) {
    case 'start':
      return { systemPrompt, messages: [{ role: 'user', content: openingPrompt }] };
    case 'chat':
    case 'stream':
      return { systemPrompt, messages: [...input.history, { role: 'user', content: input.message! }] };
    case 'coach':
      return { systemPrompt: coachSystemPrompt, messages: [{ role: 'user', content: coachUserPrompt }] };
    case 'feedback':
      return { systemPrompt: feedbackSystemPrompt, messages: [{ role: 'user', content: feedbackUserPrompt }] };
  }
}
```

**Step 6: Refactor `server/index.ts` om alleen gestructureerde modes te accepteren**

Belangrijk:
- verwijder publieke `systemPrompt`-invoer uit de request body
- parse met `aiModeRequestSchema`
- gebruik `buildModePayload()`
- laat alleen server-side code Anthropic `system` vullen

**Step 7: Run tests to verify they pass**

Run:

```bash
npm run test:unit -- tests/security/server-ai-modes.test.ts
npm run test:unit -- tests/security/api-contract.test.ts
```

Expected: PASS.

**Step 8: Commit**

```bash
git add server/prompts/system-prompt.ts server/prompts/feedback-prompt.ts server/lib/prompt-builders.ts server/lib/mode-handlers.ts server/index.ts tests/security/server-ai-modes.test.ts
git commit -m "security: move prompt authority from client to server"
```

---

### Task 4: Frontend omzetten naar het nieuwe server-owned contract

**Files:**
- Modify: `src/api.ts`
- Modify: `src/chat.ts`
- Modify: `src/speech.ts`
- Modify: `src/voice.ts`
- Modify: `src/state.ts`
- Modify: `src/types.ts`
- Delete: `src/prompts/system-prompt.ts`
- Delete: `src/prompts/feedback-prompt.ts`
- Create: `tests/security/frontend-api.test.ts`

**Step 1: Schrijf de falende frontend API-test**

```ts
import { describe, expect, it } from 'vitest';
import { buildAiRequest } from '../../src/api';

describe('buildAiRequest', () => {
  it('never includes systemPrompt in outbound payloads', () => {
    const payload = buildAiRequest('chat', {
      settings: {
        setting: 'Verpleeghuis',
        scenarioType: 'Intake',
        leerdoelen: ['LSD'],
        moeilijkheid: 'Gemiddeld',
        archetype: 'Angstige cliënt',
        customScenario: '',
        customArchetype: ''
      },
      history: [],
      message: 'Hallo'
    });

    expect(payload).not.toHaveProperty('systemPrompt');
    expect(payload.mode).toBe('chat');
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm run test:unit -- tests/security/frontend-api.test.ts
```

Expected: FAIL omdat `buildAiRequest()` nog niet bestaat.

**Step 3: Refactor `src/api.ts`**

Gebruik deze richting:

```ts
export async function bootstrapSession(challengeToken: string): Promise<{ sessionToken: string }> {
  const res = await fetch(`${API_BASE}/api/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeToken })
  });
  return res.json();
}

export function buildAiRequest(mode: AiMode, payload: Omit<AiModeRequest, 'mode'>): AiModeRequest {
  return { mode, ...payload };
}
```

**Step 4: Refactor `src/chat.ts`, `src/speech.ts` en `src/voice.ts`**

Vervang:
- `ensureSystemPromptLoaded()`
- `buildDynamicSystemPrompt()`
- directe promptimports

Door:
- `ensureSessionToken()`
- `sendAiModeRequest('start' | 'chat' | 'coach' | 'feedback' | 'stream', payload)`

**Step 5: Voeg sessietoken state toe aan `src/state.ts`**

```ts
sessionToken: string | null;
sessionTokenExpiresAt: number | null;
```

**Step 6: Verwijder client promptbestanden**

Delete:
- `src/prompts/system-prompt.ts`
- `src/prompts/feedback-prompt.ts`

Doel: prompttekst niet langer naar de browser bundelen.

**Step 7: Run tests to verify they pass**

Run:

```bash
npm run test:unit -- tests/security/frontend-api.test.ts
npm run build
```

Expected: PASS, en de build bundelt geen client promptmodule meer.

**Step 8: Commit**

```bash
git add src/api.ts src/chat.ts src/speech.ts src/voice.ts src/state.ts src/types.ts tests/security/frontend-api.test.ts
git rm src/prompts/system-prompt.ts src/prompts/feedback-prompt.ts
git commit -m "refactor: switch frontend to server-owned AI contract"
```

---

### Task 5: Feedback veilig renderen zonder `innerHTML`-sink

**Files:**
- Modify: `src/ui.ts`
- Create: `src/security/render-feedback.ts`
- Create: `tests/security/feedback-render.test.ts`

**Step 1: Schrijf de falende XSS-test**

```ts
import { describe, expect, it } from 'vitest';
import { renderFeedbackSafe } from '../../src/security/render-feedback';

describe('renderFeedbackSafe', () => {
  it('does not create executable nodes from model output', () => {
    const fragment = renderFeedbackSafe('## Titel\\n<img src=x onerror=alert(1)>');
    const container = document.createElement('div');
    container.appendChild(fragment);

    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('<img src=x onerror=alert(1)>');
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm run test:unit -- tests/security/feedback-render.test.ts
```

Expected: FAIL omdat de renderer nog niet bestaat.

**Step 3: Maak `src/security/render-feedback.ts`**

Gebruik veilige DOM-opbouw:

```ts
export function renderFeedbackSafe(text: string): DocumentFragment {
  const fragment = document.createDocumentFragment();

  for (const block of text.split('\n\n')) {
    const p = document.createElement('p');
    p.textContent = block;
    fragment.appendChild(p);
  }

  return fragment;
}
```

Vervolgimplementatie:
- parse het scoreblok apart
- bouw headings, quotes en bullets met `createElement`
- escape alle modeltekst met `textContent`

**Step 4: Refactor `src/ui.ts`**

Vervang:

```ts
feedbackContent.innerHTML = summaryHtml + formatFeedback(data.response);
```

Door:

```ts
feedbackContent.innerHTML = summaryHtml;
feedbackContent.appendChild(renderFeedbackSafe(data.response));
```

En vervang `formatFeedback()` door een veilige helper die geen HTML-string teruggeeft.

**Step 5: Run tests to verify they pass**

Run:

```bash
npm run test:unit -- tests/security/feedback-render.test.ts
npm run build
```

Expected: PASS.

**Step 6: Commit**

```bash
git add src/ui.ts src/security/render-feedback.ts tests/security/feedback-render.test.ts
git commit -m "security: render AI feedback with safe DOM nodes"
```

---

### Task 6: Backend baseline hardening en dependency patches uitvoeren

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `server/package.json`
- Modify: `server/package-lock.json`
- Modify: `server/index.ts`
- Create: `tests/security/server-hardening.test.ts`

**Step 1: Patch dependencies**

Run:

```bash
npm install helmet express-rate-limit@latest multer@latest
cd server && npm install helmet express-rate-limit@latest multer@latest
```

Expected: install voltooid; noteer eventuele breaking changes.

**Step 2: Schrijf de falende hardening-test**

```ts
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../server/index';

describe('server hardening', () => {
  it('removes x-powered-by header', async () => {
    const app = createApp();
    const response = await request(app).get('/does-not-exist');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});
```

**Step 3: Run test to verify it fails**

Run:

```bash
npm run test:unit -- tests/security/server-hardening.test.ts
```

Expected: FAIL.

**Step 4: Harden `server/index.ts`**

Voeg minimaal toe:

```ts
import helmet from 'helmet';

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(express.json({ limit: '64kb' }));
```

Voeg daarna toe:
- custom 404 handler
- custom error handler
- per-feature rate limiters
- expliciete `keyGenerator` die `::ffff:`-adressen normaliseert
- strengere `multer` limits voor MIME, parts en fileSize

**Step 5: Run tests and static checks**

Run:

```bash
npm run test:unit -- tests/security/server-hardening.test.ts
npm run server:check
npm run lint
```

Expected: PASS.

**Step 6: Commit**

```bash
git add package.json package-lock.json server/package.json server/package-lock.json server/index.ts tests/security/server-hardening.test.ts
git commit -m "security: harden express baseline and patch vulnerable dependencies"
```

---

### Task 7: Eén productie-backend afdwingen en deployment-docs gelijk trekken

**Files:**
- Delete: `api/chat.js`
- Modify: `vercel.json`
- Modify: `DEPLOY.md`
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`
- Modify: `.env.example`

**Step 1: Schrijf de falende deployment-check**

Voeg deze sanity-check toe aan het planuitvoeringsnotitieblok; geen nieuwe testfile nodig:

```bash
Select-String -Path "DEPLOY.md","AGENTS.md","CLAUDE.md",".env.example" -Pattern "VITE_API_URL|VITE_API_BASE"
```

Expected before fix: gemixte resultaten voor beide env-var namen.

**Step 2: Verwijder de Vercel chatfunctie**

Delete:

```text
api/chat.js
```

Doel: geen tweede publieke AI-proxy meer op Vercel.

**Step 3: Update `vercel.json`**

Gebruik alleen frontend-routing en security headers:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; connect-src 'self' https://YOUR-RENDER-HOST; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'self' https://aizorgacademy.nl"
        }
      ]
    }
  ],
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

**Step 4: Trek docs gelijk**

Vervang overal `VITE_API_URL` door `VITE_API_BASE`, en documenteer expliciet:
- frontend draait op Vercel
- backend draait op Render
- alleen Render verwerkt AI-calls

**Step 5: Run verification**

Run:

```bash
Select-String -Path "DEPLOY.md","AGENTS.md","CLAUDE.md",".env.example" -Pattern "VITE_API_URL|VITE_API_BASE"
npm run build
```

Expected: alleen `VITE_API_BASE` blijft over, build PASS.

**Step 6: Commit**

```bash
git rm api/chat.js
git add vercel.json DEPLOY.md AGENTS.md CLAUDE.md .env.example
git commit -m "chore: remove duplicate Vercel AI proxy and align deployment config"
```

---

### Task 8: Browser-opslag beperken en eindverificatie uitvoeren

**Files:**
- Modify: `src/config.ts`
- Modify: `src/ui.ts`
- Create: `tests/security/dashboard-storage.test.ts`

**Step 1: Schrijf de falende storage-test**

```ts
import { describe, expect, it } from 'vitest';
import { loadDashboardSessions } from '../../src/ui';

describe('dashboard storage hygiene', () => {
  it('drops expired dashboard entries', () => {
    localStorage.setItem('zorggesprek-docent-dashboard-v1', JSON.stringify([
      { id: '1', dateIso: '2020-01-01T00:00:00.000Z', studentName: 'Test', setting: 'GGZ', scenario: 'Intake', leerdoelen: ['LSD'], niveau: 'Basis', turns: 3, scores: null }
    ]));

    expect(loadDashboardSessions()).toEqual([]);
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm run test:unit -- tests/security/dashboard-storage.test.ts
```

Expected: FAIL.

**Step 3: Voeg TTL toe in `src/config.ts` en filter in `src/ui.ts`**

```ts
export const DASHBOARD_RETENTION_DAYS = 14;
```

```ts
const cutoff = Date.now() - DASHBOARD_RETENTION_DAYS * 24 * 60 * 60 * 1000;
return parsed.filter((session) => Date.parse(session.dateIso) >= cutoff);
```

Voeg ook een "Wis lokaal dashboard"-actie toe in de UI.

**Step 4: Run full verification**

Run:

```bash
npm run test:unit
npm run lint
npm run server:check
npm run build
```

Expected: alle checks PASS.

**Step 5: Final commit**

```bash
git add src/config.ts src/ui.ts tests/security/dashboard-storage.test.ts
git commit -m "security: limit dashboard retention and verify full hardening stack"
```

---

### Execution Notes

- Gebruik `@using-git-worktrees` vóór uitvoering als je een schone werkboom wilt.
- Voer elke task uit met `@verification-before-completion` voordat je statusclaims maakt.
- Gebruik `@subagent-driven-development` alleen als je de uitvoering in deze sessie wilt paralleliseren.
- Houd prompttekst functioneel identiek; de security-fix is eigendomsverplaatsing, niet promptversimpeling.
