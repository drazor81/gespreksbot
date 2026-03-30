# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

ZorgGesprek+ is a Dutch-language conversation training application for MBO nursing students. It simulates patient/colleague interactions using Codex AI, allowing students to practice healthcare communication techniques (LSD, SBAR, de-escalation, etc.) and receive AI-generated feedback.

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

### Server (standalone)
```bash
cd server && npm install && npm start  # Production server
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
- **knowledge/** - JSON files containing conversation techniques with rubrics, examples, coach tips

### Backend (server/)
Express.js API server with separate package.json and node_modules.

- **app.ts** - Express app with CORS, Helmet, rate limiting, session auth and Anthropic integration
- **index.ts** - Loads environment variables and starts the Express app
- **prompts/** - Server-owned prompt templates for patient simulation and feedback generation
- Endpoints: `/api/session`, `/api/ai-mode`, `/api/ai-mode/stream`, `/api/speech-to-text`, `/api/text-to-speech`
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

### DOM Structure
UI is rendered as one large HTML string in `initUI()`, then event listeners are attached. Modals use `showModal(id)` / `hideModal(id)` pattern.

## Coding Rules

From `rules/`:
- **async-parallel.md**: Use `Promise.all()` for independent async operations
- **bundle-barrel-imports.md**: Import directly from specific files, avoid barrel re-exports

## Environment Variables

- `ANTHROPIC_API_KEY` - Required for backend
- `ANTHROPIC_MODEL` - Optional, defaults to claude-sonnet-4-20250514
- `GOOGLE_APPLICATION_CREDENTIALS` - Optional, enables speech features
- `FRONTEND_URL` - Comma-separated allowed origins for CORS
- `SESSION_TOKEN_SECRET` - Secret used to sign short-lived session tokens
- `SESSION_AUTH_MODE` - `development` locally or `turnstile` in production
- `TURNSTILE_SECRET_KEY` - Cloudflare Turnstile secret for the backend
- `VITE_API_BASE` - Frontend API base URL (Render origin only, no route suffix)
- `VITE_TURNSTILE_SITE_KEY` - Cloudflare Turnstile site key for the frontend

## Deployment

- **Backend**: Render.com (root directory: `server`)
- **Frontend**: Vercel with `VITE_API_BASE` pointing to the Render origin; only Render processes AI calls
- See `DEPLOY.md` for detailed instructions
