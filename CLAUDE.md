# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ZorgGesprek+ is a Dutch-language conversation training application for MBO nursing students. It simulates patient/colleague interactions using Claude AI, allowing students to practice healthcare communication techniques (LSD, SBAR, de-escalation, etc.) and receive AI-generated feedback.

## Commands

### Development
```bash
npm run dev          # Start Vite dev server (frontend)
npm run server       # Start Express backend (requires .env with ANTHROPIC_API_KEY)
```

### Build & Quality
```bash
npm run build        # TypeScript check + Vite build
npm run lint         # ESLint on src/
npm run lint:fix     # ESLint with auto-fix
npm run format       # Prettier on src/ and server/
npm run format:check # Prettier check
npm run server:check # TypeScript check server only
```

### Server (productie)
De backend draait vanaf de **repo-root** via `tsx` (hij importeert `src/` buiten `server/`, dus `cd server && npm start` werkt NIET):
```bash
npm install && npm run server  # tsx server/index.ts, luistert op $PORT (default 3001)
```

## Architecture

### Frontend (src/)
Vanilla TypeScript with Vite bundling. No framework - direct DOM manipulation.

- **main.ts** - Entry point, imports styles and calls `initUI()`
- **ui.ts** - Renders entire UI, event listeners, modal management, toast notifications
- **state.ts** - Single mutable `AppState` object for all application state
- **chat.ts** - Conversation flow: starting scenarios, sending messages, generating feedback
- **api.ts** - HTTP client for session bootstrap, structured AI mode routes (`/api/session`, `/api/ai-mode`, `/api/ai-mode/stream`) and speech endpoints
- **config.ts** - Settings options, difficulty descriptions, client archetypes, random name generation
- **types.ts** - TypeScript interfaces (Scenario, Persona, DashboardSession, etc.)
- **voice.ts** / **speech.ts** - Web Speech API and Google Cloud Speech integration
- **security/** - Safe DOM renderers and frontend security helpers
- **knowledge/** - JSON files containing conversation techniques with rubrics, examples, coach tips (incl. `soep.json` for the SOEP structure rubric)
- **speech-recognition.ts** - Reusable Web Speech API factory (`createSpeechRecognition`), shared by the voice overlay and the SOEP mode
- **soep/** - SOEP reporting practice mode: `soep-state.ts`, `soep-ui.ts`, `soep-flow.ts`, `soep-api.ts`
- **shared/** - Cross-tier contracts: `api-contract.ts`, `soep-contract.ts` (request schema + `PublicSoepCasus`), `soep-settings.ts` (zod-free werkveldlijst, importable by the frontend without bundling zod), `soep-casussen.ts` (server-only casus data with hidden answer keys)

### Backend (server/)
Express.js API server with separate package.json and node_modules.

- **app.ts** - Express app with CORS, Helmet, rate limiting, session auth and Anthropic integration
- **index.ts** - Loads environment variables and starts the Express app
- **prompts/** - Server-owned prompt templates for patient simulation and feedback generation
- Endpoints: `/api/session`, `/api/ai-mode`, `/api/ai-mode/stream`, `/api/speech-to-text`, `/api/text-to-speech`, `/api/soep-mode`, `/api/soep-casussen`, `/api/soep-casus` (genereert een casus, niveau 4)
- Google Cloud Speech/TTS initialized only if `GOOGLE_APPLICATION_CREDENTIALS` is set

### Knowledge Base (src/knowledge/)
Each JSON file defines a conversation technique with:
- `korteUitleg` / `uitgebreideTheorie` - Theory content
- `technieken` - Technique descriptions
- `voorbeeldenGoed` / `voorbeeldenFout` - Good/bad examples
- `clientReactie` - How the AI patient should react
- `coachTips` - Tips for the coach system
- `rubric` - Assessment criteria with goed/voldoende/onvoldoende levels

## Key Patterns

### State Management
All state lives in a single `AppState` object exported from `state.ts`. UI updates read from and write to this object directly.

### AI Integration
- Prompt templates live server-side in `server/prompts/`
- The browser sends validated AI modes (`start`, `chat`, `coach`, `feedback`, `stream`) instead of raw `systemPrompt` strings
- Session tokens are bootstrapped via `/api/session`; only the Render backend talks to Anthropic

### Collega Mode
When archetype is "Collega", the app switches to colleague-to-colleague mode (SBAR handoffs, etc.) with different prompt context via `getCollegaContext()`.

### SOEP Mode (spraakgestuurd rapporteren)
A second practice mode, reachable from the home screen. `setAppMode`/`showScreen` in `ui.ts` toggle between `home` / `setup` / `chat` / `feedback` / `soep` (visibility is imperative via `style.display`; mode-classes only set max-width). Students pick a fictional casus, speak a SOEP report (Subjectief/Objectief/Evaluatie/Plan) via the browser Web Speech API, and get formative, coaching feedback (oefenstand) weighted 70% speech technique / 30% SOEP structure. Flow lives in `src/soep/soep-flow.ts`. Backend: `POST /api/soep-mode` (validated by `soepModeRequestSchema`, a discriminated union on `actie: 'ordenen' | 'feedback'`) routes through `buildSoepPayload` in `server/lib/soep-handlers.ts`, always on `FEEDBACK_MODEL`; transcripts are sanitized against `<!--SCORES-->` injection. Hidden casus data (ijkpunten, valkuilen, foutconcepten, correct ordering) stays server-side in `src/shared/soep-casussen.ts`; the browser only receives `PublicSoepCasus` via `GET /api/soep-casussen`. MVP covers oefenladder niveau 1-4; niveau 5 (AI-foutdetectie) and 6 (privacy/context) are future phases.

On **niveau 4** students can also generate a fresh casus (werkveld + lengte) via `POST /api/soep-casus` (separate `soepGenereerLimiter`, generated on `SOEP_GENEREER_MODEL` which defaults to `CHAT_MODEL`). The vaste bank stays selectable alongside it. The generated casus's hidden ijkpunten travel back to the feedback call inside an **encrypted JWE "casus-ticket"** (`server/lib/soep-ticket.ts` — `dir`/A256GCM, key = `sha256(SESSION_TOKEN_SECRET)`, 4h TTL) so anti-spieken holds without server state; the browser only ever sees `PublicSoepCasus` + opaque ticket. `feedbackRequestSchema` accepts either `casusId` (bankcasus) or `casusTicket` (generated), enforced by a `superRefine` (exactly one; a ticket implies niveau 4). The route resolves either into a `SoepCasus` via `resolveSoepCasus` before calling `buildSoepPayload(request, casus)`; the model's JSON casus is validated by `parseGegenereerdeCasus` (502 on garbage). Generated casussen are niveau-4-only (no `ordenItems`); switching to niveau 1-3 falls back to a bankcasus.

### DOM Structure
UI is rendered as one large HTML string in `initUI()`, then event listeners are attached. Modals use `showModal(id)` / `hideModal(id)` pattern.

## Coding Rules

From `rules/`:
- **async-parallel.md**: Use `Promise.all()` for independent async operations
- **bundle-barrel-imports.md**: Import directly from specific files, avoid barrel re-exports

## Environment Variables

- `ANTHROPIC_API_KEY` - Required for backend
- `ANTHROPIC_MODEL` - Optional, overrides both models below at once (backward compatible)
- `ANTHROPIC_MODEL_CHAT` - Optional, model for patient role-play (start/chat/stream), defaults to claude-haiku-4-5-20251001
- `ANTHROPIC_MODEL_FEEDBACK` - Optional, model for didactic assessment (coach/feedback), defaults to claude-sonnet-4-6
- `ANTHROPIC_MODEL_SOEP_GENEREER` - Optional, model for SOEP casus generation (niveau 4), defaults to `CHAT_MODEL` (Haiku)
- `GOOGLE_APPLICATION_CREDENTIALS` - Optional, enables speech features
- `FRONTEND_URL` - Comma-separated allowed origins for CORS
- `SESSION_TOKEN_SECRET` - Secret used to sign short-lived session tokens
- `SESSION_AUTH_MODE` - `development` locally or `turnstile` in production
- `TURNSTILE_SECRET_KEY` - Cloudflare Turnstile secret for the backend
- `VITE_API_BASE` - Frontend API base URL (Render origin only, no route suffix)
- `VITE_TURNSTILE_SITE_KEY` - Cloudflare Turnstile site key for the frontend

## Deployment

- **Backend**: Render.com — Root Directory leeg (repo-root), Build `npm install`, Start `npm run server` (tsx; geen buildstap). Auto-deploy vanaf `main`.
- **Frontend**: Vercel with `VITE_API_BASE` pointing to the Render origin; only Render processes AI calls
- See `docs/DEPLOY.md` for detailed instructions
