# Security Audit ZorgGesprek+ (2026-03-22)

## Executive summary

De hoofdkwetsbaarheid is reëel en bevestigt je vermoeden: de bot-backends gedragen zich nu als een open AI-proxy. De browser bouwt zelf de `systemPrompt` op en stuurt die samen met de hele conversatie naar de backend. De backend valideert alleen vorm en lengte, maar niet de afzender of de inhoudelijke rechten van de prompt. Daardoor kan iemand buiten de normale UI om direct eigen prompts sturen en jouw Anthropic- en Google-quota verbruiken.

De tweede serieuze kwetsbaarheid zit in de feedbackweergave. AI-output wordt daar als HTML in de DOM gezet zonder echte sanitization. Een kwaadaardige prompt of een prompt-injected modelantwoord kan daardoor scriptbare markup in de browser laten landen.

Goed nieuws: je huidige gesprekskwaliteit hoeft hiervoor niet omlaag. De beste route is niet "minder slimme prompts", maar "dezelfde prompts server-side eigendom maken", gecombineerd met lichte sessie-authenticatie, betere abuse-controls en veilige rendering.

## Scope en beperkingen

- Gescande codepaden: frontend (`src/`), Render/Express backend (`server/index.ts`), Vercel function (`api/chat.js`), deployment-config (`vercel.json`, `DEPLOY.md`).
- Extra uitgevoerd: `npm audit --omit=dev` in root en in `server/`.
- Niet zichtbaar in repo: edge/CDN-config, WAF, hosting-auth, DNS, runtime headers in productie.
- Geheimen zijn niet uit `.env` overgenomen of gerapporteerd.

## Critical

### SEC-001: Open AI-proxy door client-gestuurde prompts en ontbrekende caller-auth

- Severity: Critical
- Rule IDs: `EXPRESS-INPUT-001`, abuse-control / auth gap
- Location:
  - `src/api.ts:4-14`
  - `src/api.ts:23-34`
  - `src/api.ts:78-99`
  - `src/chat.ts:147-153`
  - `src/chat.ts:292-310`
  - `src/chat.ts:325-331`
  - `server/index.ts:73-125`
  - `server/index.ts:136-159`
  - `server/index.ts:194-281`
  - `api/chat.js:58-98`
- Evidence:

```ts
// src/api.ts
4:export async function sendChatMessage(
5:  systemPrompt: string,
...
13:    body: JSON.stringify({ systemPrompt, messages })

// src/chat.ts
147:    const systemPrompt = buildDynamicSystemPrompt();
149:    const data = await sendChatMessage(
150:      systemPrompt,

292:export function buildDynamicSystemPrompt(): string {
296:    state
297:      .cachedSystemPrompt!.replace('{{SETTING}}', state.selectedSettings.setting)

// server/index.ts
73:function validateChatInput(
74:  body: { messages?: ChatMessage[]; systemPrompt?: string },
...
109:  return { messages, systemPrompt };

117:    const response = await anthropic.messages.create({
120:      system: input.systemPrompt,

151:    const stream = anthropic.messages.stream({
154:      system: input.systemPrompt,

194:app.post('/api/speech-to-text', upload.single('audio'), async (req: Request, res: Response) => {
239:app.post('/api/text-to-speech', async (req: Request, res: Response) => {

// api/chat.js
58:    const { messages, systemPrompt } = req.body;
87:    const response = await anthropic.messages.create({
90:      system: systemPrompt,
```

- Impact: Iedereen die de endpoint bereikt, kan buiten jouw UI om eigen prompts, gesprekken en speech-verzoeken sturen en daarmee direct jouw betaalde AI-diensten misbruiken.
- Waarom dit gebeurt:
  - De promptautoriteit ligt nu in de browser.
  - De backend vertrouwt de aangeleverde `systemPrompt`.
  - CORS is geen authenticatie.
  - De speech-endpoints zijn ook publiek bereikbaar.
- Fix:
  - Verplaats promptopbouw volledig naar de server.
  - Laat de client alleen gestructureerde input sturen, bijvoorbeeld:
    - `conversationId`
    - `mode` (`chat`, `coach`, `feedback`, `voice`)
    - `setting`
    - `scenarioType`
    - `archetype`
    - `leerdoelen`
    - `difficulty`
    - `message`
  - Sla de prompttemplates en kenniscontext server-side op en gebruik inhoudelijk exact dezelfde prompttekst als nu.
  - Vereis caller-auth voor alle betaalde endpoints:
    - voorkeursoptie: school-login / docent-login
    - laagdrempelige optie: server-issued short-lived sessietoken + anti-bot challenge
  - Geef elk gesprek een server-side sessie of conversation state; accepteer niet langer willekeurige `messages` + `systemPrompt` als gezaghebbend inputmodel.
  - Splits rate limiting per feature (`chat`, `stream`, `stt`, `tts`) en per sessie + IP.
- Mitigation als tussenstap:
  - Zet de backend achter een gateway of reverse proxy met auth.
  - Voeg minimaal een kortlevend signed token toe dat alleen door jouw frontend verkregen kan worden.
  - Beperk speech-endpoints harder dan chat.
- False positive notes: als een upstream gateway al auth afdwingt, is die bescherming niet zichtbaar in deze repo en moet die apart gevalideerd worden.

## High

### SEC-002: DOM XSS via AI-feedback die ongefilterd als HTML wordt gerenderd

- Severity: High
- Rule IDs: `JS-XSS-001`
- Location:
  - `src/ui.ts:173-214`
  - `src/chat.ts:539-547`
  - `index.html:3-14`
- Evidence:

```ts
// src/ui.ts
173:export function formatFeedback(text: string): string {
193:        scoreHtml += `<div class="score-leerdoel-label">${leerdoel}</div>`;
197:          scoreHtml += `<div class="score-row"><span class="score-dot ${scoreClass}"></span><span class="score-criterium">${criterium}</span><span class="score-label ${scoreClass}">${score}</span></div>`;
206:  const feedbackHtml = text
207:    .replace(/### (.*)/g, '<h4>$1</h4>')
208:    .replace(/## (.*)/g, '<h3>$1</h3>')
209:    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

// src/chat.ts
539:    const data = await sendChatMessage(feedbackSystemPrompt, [{ role: 'user', content: feedbackUserPrompt }]);
546:      feedbackContent.innerHTML = summaryHtml + formatFeedback(data.response);

// index.html
14:    <script type="module" src="/src/main.ts"></script>
```

- Impact: Een kwaadaardige studentinput of prompt-injected modeloutput kan HTML/JS in de browser van de gebruiker laten landen. Zonder CSP is de impact groter.
- Waarom dit gebeurt:
  - `formatFeedback()` behandelt modeltekst als markup.
  - De output wordt direct via `innerHTML` gerenderd.
  - Er is geen echte sanitizer zoals DOMPurify.
- Fix:
  - Escape modeloutput eerst volledig.
  - Render daarna alleen een zeer beperkte allowlist aan markup, of bouw de feedback met DOM nodes op.
  - Als je markdown wilt houden: parse naar safe HTML en sanitize met DOMPurify.
  - Bouw de scoretabel niet uit ruwe modelstrings; escape `leerdoel`, `criterium` en `score` altijd expliciet.
- Mitigation:
  - Voeg een strikte CSP toe.
  - Overweeg Trusted Types als extra hardening.
- False positive notes: als het model in de praktijk meestal nette tekst geeft, vermindert dat de waarschijnlijkheid maar niet het risico; dit blijft een echte sink.

### SEC-003: Onbedoelde Vercel fallback kan een zwakker publiek chat-endpoint activeren

- Severity: High
- Rule IDs: deployment/auth hardening gap
- Location:
  - `src/api.ts:1-2`
  - `api/chat.js:17-18`
  - `api/chat.js:35-55`
  - `vercel.json:1-4`
  - `DEPLOY.md:30-33`
- Evidence:

```ts
// src/api.ts
1:export const API_BASE = import.meta.env.VITE_API_BASE || '';

// api/chat.js
17:// Simple in-memory rate limiting (resets per cold start)
35:export default async function handler(req, res) {
53:  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';

// vercel.json
2:  "rewrites": [
3:    { "source": "/api/(.*)", "destination": "/api/$1" },

// DEPLOY.md
31:    *   Key: `VITE_API_URL`
32:    *   Value: `https://zorggesprek-server.onrender.com/api/chat`
```

- Impact: Als `VITE_API_BASE` niet is gezet, valt de frontend terug op same-origin `/api/chat`. Omdat `api/chat.js` in de repo staat en `vercel.json` `/api/*` behoudt, kun je ongemerkt op een minder goed beveiligde Vercel functie uitkomen.
- Waarom dit gevaarlijk is:
  - De documentatie noemt `VITE_API_URL`, maar de code leest `VITE_API_BASE`.
  - De Vercel functie heeft alleen in-memory rate limiting.
  - Daardoor ontstaan twee verschillende publieke backend-oppervlakken met verschillende controls.
- Fix:
  - Kies exact één publieke backendstrategie.
  - Advies hier: houd Render/Express als enige AI-backend en verwijder `api/chat.js` als productiepad.
  - Laat de frontend in productie hard falen als `VITE_API_BASE` ontbreekt.
  - Trek de documentatie gelijk met de code.
- Mitigation:
  - Als je `api/chat.js` tijdelijk behoudt, zet daar geen Anthropic-key op productie zolang dit pad niet bewust beheerd wordt.

## Medium

### SEC-004: Baseline hardening ontbreekt in app-code (Helmet, CSP, fingerprint reduction)

- Severity: Medium
- Rule IDs: `EXPRESS-HEADERS-001`, `EXPRESS-FINGERPRINT-001`
- Location:
  - `server/index.ts:25-36`
  - `server/index.ts:288-290`
  - `index.html:3-14`
  - `api/chat.js:35-42`
- Evidence:

```ts
// server/index.ts
25:app.use(
36:app.use(express.json());
288:const PORT = process.env.PORT || 3001;
289:app.listen(PORT, () => {

// api/chat.js
41:  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
42:  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

// index.html
3:  <head>
8:    <link rel="preconnect" href="https://fonts.googleapis.com">
14:    <script type="module" src="/src/main.ts"></script>
```

- Impact: Deze ontbrekende baseline maakt XSS-impact groter en laat onnodige fingerprinting / standaardgedrag staan.
- Fix:
  - Voeg `helmet()` toe op Express.
  - Zet `app.disable('x-powered-by')`.
  - Voeg custom 404- en error-handlers toe.
  - Lever CSP via response headers.
  - Stel `frame-ancestors` bewust in.
- Belangrijke nuance voor jouw product:
  - In `DEPLOY.md` staat een `iframe`-integratie genoemd. Gebruik dus geen blinde `DENY`; zet een expliciete allowlist, bijvoorbeeld alleen jouw domeinen.
- Mitigation:
  - Als headers nu aan de edge worden gezet, documenteer dat en controleer de runtime response expliciet.

### SEC-005: Actieve dependency-advisories in rate limiting, uploads en transitive chain

- Severity: Medium
- Rule IDs: dependency hygiene
- Location:
  - `package.json:29-37`
  - `server/package.json:8-16`
- Evidence:

```json
// package.json
29:  "dependencies": {
36:    "express-rate-limit": "^8.2.1",
37:    "multer": "^2.0.2"

// server/package.json
8:    "dependencies": {
15:        "express-rate-limit": "^8.2.1",
16:        "multer": "^2.0.2"
```

- Extra runtime evidence:
  - `npm audit --omit=dev` meldde op 2026-03-22:
    - `express-rate-limit 8.2.0 - 8.2.1` high: bypass via IPv4-mapped IPv6
    - `multer <=2.1.0` high: meerdere DoS-risico’s
    - extra advisories in `minimatch`, `qs` en de Google dependency chain (`@tootallnate/once` via `google-gax`)
- Impact: Je huidige abuse-controls en uploadpad hangen deels af van versies met bekende issues.
- Fix:
  - Update `express-rate-limit` en `multer` naar gepatchte versies en test chat/speech regressies.
  - Herhaal daarna `npm audit --omit=dev`.
  - Doe geen blinde `npm audit fix --force` op productie: de audit wil voor een deel breaking dependency-versies trekken in de Google speech chain.
- Mitigation:
  - Tot update: beperk upload- en rate-limit paths extra aan de edge.

## Low

### SEC-006: Dashboardgegevens blijven onbeperkt in `localStorage` staan op gedeelde apparaten

- Severity: Low
- Rule IDs: browser storage hygiene
- Location:
  - `src/ui.ts:218-231`
- Evidence:

```ts
218:export function loadDashboardSessions(): DashboardSession[] {
220:    const raw = localStorage.getItem(DASHBOARD_STORAGE_KEY);
225:    localStorage.removeItem(DASHBOARD_STORAGE_KEY);
230:export function saveDashboardSessions(sessions: DashboardSession[]): void {
231:  localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(sessions.slice(0, 120)));
```

- Impact: Studentnamen, scenario’s en scores blijven lokaal op de browser staan. Op gedeelde schoolapparaten is dat een privacy- en inzagerisico.
- Fix:
  - Voeg een bewaartermijn toe.
  - Bied een duidelijke "wis lokaal dashboard"-actie.
  - Overweeg dit dashboard optioneel te maken.

## Voorstel: veilig maken met behoud van kwaliteit

### Fase 1: hoogste impact, laag regressierisico

1. Maak de server eigenaar van alle prompts.
2. Laat de client geen `systemPrompt` meer opsturen.
3. Gebruik exact dezelfde promptteksten die nu goed werken, maar server-side.
4. Vervang feedback-rendering door veilige rendering met escaping + sanitizer.
5. Kies één backendpad in productie en verwijder of deactiveer de andere publieke proxy.

### Fase 2: abuse-preventie zonder zware UX-schade

1. Voeg short-lived sessietokens toe.
2. Bind quotas aan sessie + IP + feature.
3. Zet een lichte anti-bot challenge voor anonieme publieke toegang.
4. Gebruik strengere limieten voor `speech-to-text` en `text-to-speech` dan voor chat.

### Fase 3: hardening en onderhoud

1. Voeg `helmet`, CSP, `x-powered-by` disable, 404/error handlers toe.
2. Patch dependency-versies en herhaal de audit.
3. Documenteer de echte productie-architectuur, inclusief welke backend publiek hoort te zijn.

## Aanbevolen eindarchitectuur

Mijn aanbeveling als je de huidige kwaliteit wilt behouden zonder de UX onnodig zwaarder te maken:

- Frontend blijft scenario-keuzes en UI leveren.
- Backend bouwt de prompt op uit vaste templates + kennisbank + gevalideerde scenario-parameters.
- Frontend stuurt alleen:
  - gevalideerde scenario-keuzes
  - het actuele studentbericht
  - een server-issued sessie-id / token
- Backend bewaart de conversation state of valideert strikt welke state door de client terugkomt.
- Feedback wordt als veilige tekst/markdown verwerkt, niet als ruwe HTML.

Dit behoudt de huidige inhoudelijke kwaliteit, omdat de promptinhoud zelf niet hoeft te veranderen. Alleen de eigendomsgrens verschuift van browser naar server.

## Conclusie

De bot is inhoudelijk sterk, maar security-technisch nu nog te vertrouwend richting de browser. Het belangrijkste is niet om de prompt "simpeler" te maken, maar om te zorgen dat alleen jouw server bepaalt welke prompt er überhaupt gebruikt mag worden. Zodra je dat combineert met veilige feedback-rendering en één duidelijke backendroute, verdwijnt het grootste misbruikscenario zonder dat de gesprekservaring slechter hoeft te worden.
