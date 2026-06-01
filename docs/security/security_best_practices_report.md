# Security Best Practices Report

## Executive Summary

The API surface is only partially hardened. The highest-risk issue is that the public AI endpoints rely on CORS and basic input validation, but do not require any authentication or server-side caller authorization. That means non-browser clients can call the backend directly and consume Anthropic or Google Cloud quota at your expense.

There is also a deployment mismatch: the frontend calls four `/api/*` endpoints, while the Vercel deployment currently exposes only `api/chat.js`. In practice this means the public endpoint layout is inconsistent across environments, which increases the chance of broken controls, missing middleware, and accidental exposure.

## Critical / High

### Finding SEC-001

- Severity: High
- Rule IDs: EXPRESS-INPUT-001, baseline auth/abuse control gap
- Location: `server/index.ts:112`, `server/index.ts:136`, `server/index.ts:194`, `server/index.ts:239`, `api/chat.js:35`
- Evidence:

```ts
// server/index.ts
112:app.post('/api/chat', async (req: Request, res: Response) => {
136:app.post('/api/chat/stream', async (req: Request, res: Response) => {
194:app.post('/api/speech-to-text', upload.single('audio'), async (req: Request, res: Response) => {
239:app.post('/api/text-to-speech', async (req: Request, res: Response) => {

// api/chat.js
35:export default async function handler(req, res) {
38:  if (origin && allowedOrigins.includes(origin)) {
48:  if (req.method !== 'POST') {
```

- Impact: Anyone who can reach the endpoint can call the LLM and speech services directly from Postman, curl, or a script, which can lead to quota theft, billing abuse, and uncontrolled backend usage.
- Why this matters: CORS is only a browser policy. It does not authenticate the caller and does not block direct server-to-server or CLI requests.
- Fix:
  - Add server-side authentication for all paid or privileged endpoints.
  - Prefer short-lived signed tokens, a session-based backend, or an API gateway layer with auth and per-user quotas.
  - Keep CORS, but treat it only as a browser restriction, not as an access-control mechanism.
- Mitigation: Until auth exists, put the API behind a private frontend origin plus edge protections such as Vercel Authentication, a reverse proxy with auth, or a secret-bearing backend proxy not callable from arbitrary clients.
- False positive notes: If an upstream gateway already enforces auth, that control is not visible in this repo and should be verified separately.

### Finding SEC-002

- Severity: High
- Rule IDs: abuse control / rate limiting robustness
- Location: `api/chat.js:17`, `api/chat.js:22`, `api/chat.js:53`
- Evidence:

```js
17:// Simple in-memory rate limiting (resets per cold start)
18:const rateLimitMap = new Map();
22:function checkRateLimit(ip) {
53:  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
54:  if (!checkRateLimit(clientIp)) {
```

- Impact: The deployed `api/chat.js` limiter can be bypassed or weakened by cold starts, horizontal scaling, and spoofable `x-forwarded-for` values, making abuse easier than intended.
- Fix:
  - Move rate limiting to a shared store or edge layer.
  - Trust only platform-provided client IP metadata, not raw forwarded headers.
  - Apply the same control model to all public endpoints, not only `/api/chat`.
- Mitigation: Add platform-native edge rate limits immediately if available.
- False positive notes: Some hosting platforms sanitize forwarded headers, but that guarantee is not asserted in this code.

## Medium

### Finding SEC-003

- Severity: Medium
- Rule IDs: EXPRESS-HEADERS-001, EXPRESS-FINGERPRINT-001
- Location: `server/index.ts:17`, `server/index.ts:25`, `server/index.ts:36`, `server/index.ts:288`, `api/chat.js:35`
- Evidence:

```ts
17:const app = express();
25:app.use(
36:app.use(express.json());
288:const PORT = process.env.PORT || 3001;
289:app.listen(PORT, () => {
```

- Impact: The Express server does not show `helmet()`, `app.disable('x-powered-by')`, or custom 404/error hardening. The Vercel function also sets only CORS headers. This leaves basic header hardening and fingerprint reduction absent in app code.
- Fix:
  - Add `helmet()` early in the middleware chain.
  - Disable `x-powered-by`.
  - Add explicit 404 and generic error handlers that do not leak internals.
- Mitigation: If headers are already added by your reverse proxy or Vercel edge, document that and verify the runtime responses.
- False positive notes: This may be partially mitigated at the hosting layer, but that is not visible in the repository.

### Finding SEC-004

- Severity: Medium
- Rule IDs: production baseline body size limits
- Location: `server/index.ts:36`, `server/index.ts:73`, `api/chat.js:59`
- Evidence:

```ts
36:app.use(express.json());
73:function validateChatInput(
77:  const { messages, systemPrompt } = body;

// api/chat.js
59:    const { messages, systemPrompt } = req.body;
```

- Impact: JSON body size is not limited before parsing. Length checks happen after the body has already been accepted into memory, which leaves room for oversized-request memory pressure or denial-of-service attempts.
- Fix:
  - Use `express.json({ limit: '256kb' })` or another explicit limit sized to the real payload.
  - Enforce the same payload ceiling in the serverless handler path.
- Mitigation: If the platform already enforces a low request-size limit, verify it and document it, but keep the app-level limit anyway.

### Finding SEC-005

- Severity: Medium
- Rule IDs: deployment consistency / control coverage
- Location: `src/api.ts:2`, `src/api.ts:29`, `src/api.ts:82`, `src/api.ts:95`, `vercel.json:3`, `api/chat.js:35`
- Evidence:

```ts
2:export const API_URL = `${API_BASE}/api/chat`;
29:  const res = await fetch(`${API_BASE}/api/chat/stream`, {
82:  const res = await fetch(`${API_BASE}/api/speech-to-text`, {
95:  const res = await fetch(`${API_BASE}/api/text-to-speech`, {

// vercel.json
3:    { "source": "/api/(.*)", "destination": "/api/$1" }

// api directory
api/chat.js
```

- Impact: The frontend expects four API endpoints, but the Vercel deployment in this repo only contains one serverless function. That mismatch can cause 404s in production, inconsistent middleware coverage, and security assumptions that hold locally but not in the deployed path.
- Fix:
  - Choose one backend architecture for production: either deploy the Express server with all routes, or create matching serverless functions for every referenced endpoint.
  - Keep auth, rate limiting, and request validation identical across all deployment paths.
- Mitigation: Disable or hide frontend features that target endpoints not actually deployed.

## Low

### Finding SEC-006

- Severity: Low
- Rule IDs: file validation defense-in-depth
- Location: `server/index.ts:66`, `server/index.ts:207`
- Evidence:

```ts
66:const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
207:    const allowedMimeTypes = ['audio/webm', 'audio/ogg', 'audio/wav', 'audio/mpeg', 'audio/mp4'];
208:    if (!allowedMimeTypes.includes(req.file.mimetype)) {
```

- Impact: The speech upload path trusts MIME metadata only. That is often enough for a controlled prototype, but it is weak as a content-validation boundary.
- Fix:
  - Validate actual file signatures or decodeability before handing the buffer to downstream services.
  - Consider a lower upload size limit if realistic audio clips are much smaller.

## Recommended Order of Remediation

1. Add authentication and quota ownership for all paid AI endpoints.
2. Replace the serverless in-memory rate limiter with an edge or shared-store limiter.
3. Unify the production API architecture so the deployed endpoint set matches the frontend.
4. Add `helmet()`, `x-powered-by` disabling, and explicit body limits.
5. Tighten upload validation for speech endpoints.
