# Fase 1: Beveiliging & Cleanup - Implementatieplan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Beveilig de backend API (CORS, rate limiting, input validatie), voorkom XSS in de frontend, verwijder ongebruikte dependencies, en voeg een reset-bevestiging toe.

**Architecture:** De server (`server/index.js`) krijgt CORS-restricties, rate limiting middleware, input validatie en generieke foutmeldingen. De frontend (`src/main.ts`) wordt beveiligd tegen XSS door `innerHTML` in `addMessage()` te vervangen door veilige DOM-constructie. Ongebruikte packages (lodash, lucide-static) en bestanden (counter.ts, prompt-v1-backup.ts) worden verwijderd.

**Tech Stack:** Express.js, express-rate-limit, cors (configured), TypeScript, Vite

---

### Task 1: CORS configureren met specifieke origins

**Files:**
- Modify: `server/index.js:17` (de `app.use(cors())` regel)

**Step 1: Pas CORS aan met allowlist**

Vervang regel 17 in `server/index.js`:

```javascript
// OUD:
app.use(cors());

// NIEUW:
const allowedOrigins = [
  'http://localhost:5173',           // Vite dev server
  'http://localhost:4173',           // Vite preview
  process.env.FRONTEND_URL,         // Productie frontend (Vercel)
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
```

**Step 2: Test dat de server opstart**

Run: `cd "C:\Obsidian vault\Gespreksbot\server" && node index.js`
Expected: Server start zonder errors. Sluit af met Ctrl+C.

**Step 3: Commit**

```bash
git add server/index.js
git commit -m "security: configure CORS with origin allowlist"
```

---

### Task 2: Rate limiting toevoegen

**Files:**
- Modify: `server/package.json` (dependency toevoegen)
- Modify: `server/index.js:1-18` (import + middleware)

**Step 1: Installeer express-rate-limit**

Run: `cd "C:\Obsidian vault\Gespreksbot\server" && npm install express-rate-limit`

**Step 2: Voeg rate limiter toe aan server/index.js**

Voeg na de imports (na regel 9) toe:

```javascript
import rateLimit from 'express-rate-limit';
```

Voeg na `app.use(express.json());` (na regel 18, na de CORS middleware) toe:

```javascript
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minuut
  max: 20,               // max 20 requests per minuut per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Te veel verzoeken. Probeer het over een minuut opnieuw.' }
});

app.use('/api/', apiLimiter);
```

**Step 3: Test dat de server opstart**

Run: `cd "C:\Obsidian vault\Gespreksbot\server" && node index.js`
Expected: Server start zonder errors. Sluit af met Ctrl+C.

**Step 4: Commit**

```bash
git add server/index.js server/package.json server/package-lock.json
git commit -m "security: add rate limiting to API endpoints (20 req/min)"
```

---

### Task 3: Input validatie op /api/chat endpoint

**Files:**
- Modify: `server/index.js:37-61` (de `/api/chat` handler)

**Step 1: Voeg input validatie toe aan /api/chat**

Voeg na `const { messages, systemPrompt } = req.body;` (regel 39) en na de API key check (regel 43) de volgende validatie toe:

```javascript
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
```

**Step 2: Test dat de server opstart**

Run: `cd "C:\Obsidian vault\Gespreksbot\server" && node index.js`
Expected: Server start zonder errors.

**Step 3: Commit**

```bash
git add server/index.js
git commit -m "security: add input validation on /api/chat endpoint"
```

---

### Task 4: Generieke foutmeldingen (geen error.message naar client)

**Files:**
- Modify: `server/index.js:57-60` (catch block /api/chat)
- Modify: `server/index.js:91-94` (catch block /api/speech-to-text)
- Modify: `server/index.js:124-127` (catch block /api/text-to-speech)

**Step 1: Vervang error.message door generieke meldingen**

In alle drie de catch blocks, vervang `error.message || '...'` door een generieke melding:

```javascript
// /api/chat catch (rond regel 59):
// OUD:
res.status(500).json({ error: error.message || 'Er ging iets mis met de AI.' });
// NIEUW:
res.status(500).json({ error: 'Er ging iets mis met de AI. Probeer het opnieuw.' });

// /api/speech-to-text catch (rond regel 93):
// OUD:
res.status(500).json({ error: error.message || 'Speech-to-Text fout.' });
// NIEUW:
res.status(500).json({ error: 'Spraakherkenning mislukt. Probeer het opnieuw.' });

// /api/text-to-speech catch (rond regel 127):
// OUD:
res.status(500).json({ error: error.message || 'Text-to-Speech fout.' });
// NIEUW:
res.status(500).json({ error: 'Spraaksynthese mislukt. Probeer het opnieuw.' });
```

**Step 2: Commit**

```bash
git add server/index.js
git commit -m "security: use generic error messages, don't expose internals"
```

---

### Task 5: XSS-preventie in addMessage()

**Files:**
- Modify: `src/main.ts:791-806` (functie `addMessage`)
- Modify: `src/main.ts:808-821` (functie `formatMessageText`)

**Step 1: Vervang innerHTML door veilige DOM-constructie in addMessage()**

Vervang de hele `addMessage` functie (regels 791-806) door:

```typescript
function addMessage(sender: string, text: string, type: 'student' | 'patient' | 'system' | 'meta') {
  const container = document.querySelector('#chat-container')!;
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${type}`;

  const strong = document.createElement('strong');
  strong.textContent = sender;

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  // Use safe formatting that escapes HTML
  contentDiv.appendChild(formatMessageSafe(text));

  const infoDiv = document.createElement('div');
  infoDiv.className = 'message-info';
  infoDiv.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  msgDiv.appendChild(strong);
  msgDiv.appendChild(contentDiv);
  msgDiv.appendChild(infoDiv);
  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
}
```

**Step 2: Vervang formatMessageText door een veilige variant**

Vervang de hele `formatMessageText` functie (regels 808-821) door:

```typescript
function formatMessageSafe(text: string): DocumentFragment {
  const fragment = document.createDocumentFragment();
  // Split by asterisk patterns for non-verbal cues
  const parts = text.split(/(\*[^*]+\*)/g);

  for (const part of parts) {
    if (part.startsWith('*') && part.endsWith('*')) {
      const div = document.createElement('div');
      div.className = 'nonverbal';
      div.textContent = part.slice(1, -1);
      fragment.appendChild(div);
    } else if (part.trim()) {
      const span = document.createElement('span');
      span.textContent = part;
      fragment.appendChild(span);
    }
  }

  return fragment;
}
```

**Step 3: Update verwijzingen naar formatMessageText**

Zoek of `formatMessageText` ergens anders aangeroepen wordt. Het wordt alleen gebruikt in de oude `addMessage`. De nieuwe code noemt het `formatMessageSafe`, dus de oude functienaam kan weg.

**Step 4: Build controleren**

Run: `cd "C:\Obsidian vault\Gespreksbot" && npx tsc --noEmit`
Expected: Geen TypeScript errors.

**Step 5: Commit**

```bash
git add src/main.ts
git commit -m "security: prevent XSS by replacing innerHTML with safe DOM construction"
```

---

### Task 6: Ongebruikte dependencies verwijderen

**Files:**
- Modify: `package.json` (verwijder lodash, @types/lodash, lucide-static)
- Delete: `src/counter.ts`
- Delete: `src/prompts/prompt-v1-backup.ts`

**Step 1: Verwijder ongebruikte npm packages**

Run: `cd "C:\Obsidian vault\Gespreksbot" && npm uninstall lodash @types/lodash lucide-static`

**Step 2: Verwijder ongebruikte bestanden**

Delete `src/counter.ts` (Vite template overblijfsel, wordt nergens geimporteerd).
Delete `src/prompts/prompt-v1-backup.ts` (backup bestand, gebruik git history).

**Step 3: Build controleren**

Run: `cd "C:\Obsidian vault\Gespreksbot" && npx tsc --noEmit`
Expected: Geen errors (deze bestanden werden nergens geimporteerd).

**Step 4: Commit**

```bash
git add package.json package-lock.json
git rm src/counter.ts src/prompts/prompt-v1-backup.ts
git commit -m "cleanup: remove unused dependencies (lodash, lucide-static) and dead files"
```

---

### Task 7: Dubbele font-import verwijderen

**Files:**
- Modify: `src/style.css:1` (verwijder @import)
  OF
- Modify: `index.html:8-10` (verwijder link tags)

De font wordt zowel in `style.css` regel 1 (`@import url(...)`) als in `index.html` regels 8-10 (`<link>` tags) geladen. De `<link>` tag variant in HTML is performanter (parallelleert beter), dus verwijder de CSS @import.

**Step 1: Verwijder de @import uit style.css**

Verwijder regel 1 uit `src/style.css`:

```css
/* VERWIJDER deze regel: */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap');
```

Let op: de HTML link laadt alleen `Inter:wght@400;600;700`. De CSS @import laadt ook `Plus Jakarta Sans` en `Inter:wght@500`. Controleer of `Plus Jakarta Sans` of `font-weight: 500` ergens in de CSS gebruikt wordt.

**Step 2: Controleer of Plus Jakarta Sans gebruikt wordt**

Zoek in `src/style.css` naar "Plus Jakarta" of "Jakarta". Als het nergens gebruikt wordt, is de @import veilig te verwijderen. Als het WEL gebruikt wordt, voeg dan `Plus+Jakarta+Sans:wght@500;600;700` toe aan de link tag in index.html en update de Inter weights.

**Step 3: Commit**

```bash
git add src/style.css index.html
git commit -m "perf: remove duplicate font import from CSS (keep HTML link)"
```

---

### Task 8: Bevestigingsdialoog bij Reset-knop

**Files:**
- Modify: `src/main.ts:388-390` (reset button event listener)

**Step 1: Voeg bevestiging toe aan reset-knop**

Vervang de reset event listener (regels 388-390):

```typescript
// OUD:
  document.querySelector('#reset-btn')?.addEventListener('click', () => {
    location.reload();
  });

// NIEUW:
  document.querySelector('#reset-btn')?.addEventListener('click', () => {
    if (conversationHistory.length === 0 || confirm('Weet je zeker dat je het gesprek wilt afsluiten? Je voortgang gaat verloren.')) {
      location.reload();
    }
  });
```

**Step 2: Build controleren**

Run: `cd "C:\Obsidian vault\Gespreksbot" && npx tsc --noEmit`
Expected: Geen errors.

**Step 3: Commit**

```bash
git add src/main.ts
git commit -m "ux: add confirmation dialog before reset to prevent data loss"
```

---

### Task 9: Package hernoemen

**Files:**
- Modify: `package.json:2` (naam wijzigen)

**Step 1: Hernoem package**

Wijzig in `package.json` regel 2:

```json
// OUD:
"name": "tmp-app",

// NIEUW:
"name": "gespreksbot-zorg",
```

**Step 2: Commit**

```bash
git add package.json
git commit -m "chore: rename package from tmp-app to gespreksbot-zorg"
```

---

## Samenvatting

| Task | Wat | Bestand(en) | Type |
|------|-----|-------------|------|
| 1 | CORS met allowlist | server/index.js | Security |
| 2 | Rate limiting | server/index.js, server/package.json | Security |
| 3 | Input validatie | server/index.js | Security |
| 4 | Generieke foutmeldingen | server/index.js | Security |
| 5 | XSS-preventie | src/main.ts | Security |
| 6 | Ongebruikte deps verwijderen | package.json, counter.ts, backup.ts | Cleanup |
| 7 | Dubbele font-import | src/style.css of index.html | Performance |
| 8 | Reset bevestiging | src/main.ts | UX |
| 9 | Package hernoemen | package.json | Cleanup |
