# SOEP-rapportagemodus Implementatieplan

> **Voor Claude:** VEREISTE SUB-SKILL: gebruik `superpowers:executing-plans` om dit plan taak voor taak uit te voeren. Per backend-taak geldt de TDD-cyclus uit `superpowers:test-driven-development` (eerst de falende test, dan minimale code).

**Doel:** Een tweede oefenmodus in ZorgGesprek+ waarin de student een zorgrapportage inspreekt op een casus en AI-feedback krijgt op inspreektechniek (70%) en SOEP-structuur (30%).

**Architectuur:** Aparte, low-blast-radius feature naast de bestaande gesprekssimulator. Een nieuwe beschermde route `/api/soep/feedback` (krijgt auth en rate-limiting gratis via de bestaande `app.use('/api', ...)`-middleware), een eigen request-schema, een eigen prompt-builder en een eigen frontend-module `src/soep.ts`. De bestaande gespreksmodi (`start/chat/stream/coach/feedback`) blijven ongemoeid. Spraak hergebruikt het bestaande `/api/speech-to-text`-endpoint.

**Tech Stack:** TypeScript, Vite (frontend), Express 5 + `@anthropic-ai/sdk` (server), Zod 4 (validatie), Vitest + Supertest (tests), Google Cloud Speech (STT).

**Inhoudsbron (bron van waarheid):** `soepie/CONTEXT.md`, `soepie/soep-rubric.md`, `soepie/casusbank.md`, `soepie/concept-soep-oefentool.md`.

---

## Belangrijke ontwerpkeuzes (vooraf bevestigen, Phase 0)

Deze keuzes blokkeren schone code. Ze hebben een aanbevolen default, zodat je ook solo verder kunt.

1. **SOEP-kennis los van de gespreks-leerdoelen.** De SOEP-rubric komt in `src/knowledge/soep.json` (zelfde vorm als `sbar.json`), maar wordt **niet** geregistreerd in de `kennisbank`-map in `src/knowledge/index.ts` en **niet** toegevoegd aan `SETTINGS_OPTIONS.leerdoelen`. Anders zou SOEP als leerdoel opduiken in de gesprekssetup. Het veld `clientReactie` blijft daardoor ongebruikt (open punt 1 uit `soep-rubric.md`: opgelost door SOEP buiten de gespreks-kennisbank te houden).
2. **Twee rubrieken, twee plekken** (open punt 2). De **SOEP-structuur**-rubriek staat in `soep.json` (het `rubric`-veld) en wordt als tekst in de prompt geïnjecteerd. De **inspreektechniek**-criteria (de 70%) staan in de SOEP-feedbackprompt zelf, met het 70/30-gewicht expliciet benoemd.
3. **Casusafhankelijke feedback via data** (open punt 3). Elke casus levert `soepIjkpunten` (S/O/E/P) en een `valkuil` aan, die in de prompt worden meegegeven. Zo kan de AI checken op volledigheid en op de feit-versus-mening-scheiding.
4. **Spraak via de server, niet de Web Speech API.** Het concept ging uit van de browser-Web-Speech-API, maar de bot heeft al server-side STT (`/api/speech-to-text`, Google Cloud, `nl-NL`). We hergebruiken dat: opnemen met `MediaRecorder` → audio-blob → `/api/speech-to-text` → transcript. Geen API-key in de browser.
5. **Instap via een keuzescherm.** Bij binnenkomst kiest de student "Oefen een gesprek" of "Oefen een rapportage". Default: een licht landingsscherm vóór de bestaande setup.

> Loop deze vijf na voordat je begint. Wijk je af, pas dan de betrokken taken hieronder aan.

---

## Phase 1: Inhoud vaststellen (geen code)

Doel: rubric en casussen zorginhoudelijk goedkeuren, zodat de data-taken hieronder kloppen.

**Stap 1.1** Loop `soepie/soep-rubric.md` na: kloppen de niveaubeschrijvingen, de voorbeeldzinnen en de toon voor MBO 2 tot 4? Pas aan waar nodig.

**Stap 1.2** Loop `soepie/casusbank.md` na: kloppen de vijf `soepIjkpunten` en `valkuil`-velden zorginhoudelijk? Pas aan waar nodig.

**Stap 1.3** Vink in `soepie/CONTEXT.md` onder Bouwstatus af: "rubric nagelopen" en "casussen nagelopen". Commit de inhoudswijzigingen.

```bash
git add soepie/
git commit -m "docs: SOEP-rubric en casusbank inhoudelijk vastgesteld"
```

---

## Phase 2: Data en contract (backend, TDD)

### Taak 2.1: SOEP-kennisbestand

**Bestanden:**
- Maken: `src/knowledge/soep.json`

**Stap 1:** Zet de inhoud uit `soepie/soep-rubric.md` om naar de `Kennisitem`-vorm (zie `interface Kennisitem` in `src/knowledge/index.ts`): `id`, `naam`, `korteUitleg`, `uitgebreideTheorie`, `technieken` (S/O/E/P), `voorbeeldenGoed`, `voorbeeldenFout`, `coachTips`, `rubric` (de SOEP-structuur-rubriek). Laat `clientReactie` weg of zet lege strings (wordt niet gebruikt).

**Stap 2:** Geen losse test; dit JSON wordt gevalideerd door de test in Taak 3.1 (de builder importeert het). Commit.

```bash
git add src/knowledge/soep.json
git commit -m "feat: voeg SOEP-kennisbestand toe"
```

### Taak 2.2: Casussen-data + loader

**Bestanden:**
- Maken: `src/knowledge/soep-casussen.json`
- Maken: `src/knowledge/soep-casussen.ts`
- Test: `tests/soep/casussen.test.ts`

**Stap 1: Schrijf de falende test**

```ts
import { describe, expect, it } from 'vitest';
import { soepCasussen, getCasusById } from '../../src/knowledge/soep-casussen';

describe('soep-casussen', () => {
  it('bevat minstens 5 casussen met verplichte velden', () => {
    expect(soepCasussen.length).toBeGreaterThanOrEqual(5);
    for (const c of soepCasussen) {
      expect(c.id).toBeTruthy();
      expect(c.naam).toBeTruthy();
      expect(c.casustekst).toBeTruthy();
      expect(c.soepIjkpunten.s).toBeTruthy();
      expect(c.soepIjkpunten.o).toBeTruthy();
      expect(c.soepIjkpunten.e).toBeTruthy();
      expect(c.soepIjkpunten.p).toBeTruthy();
    }
  });

  it('vindt een casus op id', () => {
    const eerste = soepCasussen[0];
    expect(getCasusById(eerste.id)).toEqual(eerste);
    expect(getCasusById('bestaat-niet')).toBeUndefined();
  });
});
```

**Stap 2: Run de test, verwacht FAIL**

Run: `npm run test:unit -- tests/soep/casussen.test.ts`
Verwacht: FAIL ("Cannot find module ../../src/knowledge/soep-casussen").

**Stap 3: Maak de data en de loader**

`src/knowledge/soep-casussen.json`: array met de 5 casussen uit `soepie/casusbank.md`. Per casus: `id` (bijv. `"van-dam"`), `naam`, `setting`, `niveau`, `casustekst`, `soepIjkpunten` (`{ s, o, e, p }`), `valkuil`.

`src/knowledge/soep-casussen.ts`:

```ts
import casussenData from './soep-casussen.json';

export interface SoepCasus {
  id: string;
  naam: string;
  setting: string;
  niveau: string;
  casustekst: string;
  soepIjkpunten: { s: string; o: string; e: string; p: string };
  valkuil: string;
}

export const soepCasussen: SoepCasus[] = casussenData;

export function getCasusById(id: string): SoepCasus | undefined {
  return soepCasussen.find((c) => c.id === id);
}
```

**Stap 4: Run de test, verwacht PASS**

Run: `npm run test:unit -- tests/soep/casussen.test.ts`
Verwacht: PASS.

**Stap 5: Commit**

```bash
git add src/knowledge/soep-casussen.json src/knowledge/soep-casussen.ts tests/soep/casussen.test.ts
git commit -m "feat: voeg SOEP-casussen en loader toe"
```

### Taak 2.3: Request-schema voor SOEP-feedback

**Bestanden:**
- Wijzigen: `src/shared/api-contract.ts` (toevoegen onderaan)
- Test: `tests/soep/contract.test.ts`

**Stap 1: Schrijf de falende test**

```ts
import { describe, expect, it } from 'vitest';
import { soepFeedbackRequestSchema } from '../../src/shared/api-contract';

describe('soepFeedbackRequestSchema', () => {
  it('accepteert een geldig verzoek', () => {
    const r = soepFeedbackRequestSchema.safeParse({ casusId: 'van-dam', transcript: 'Mevrouw geeft aan...' });
    expect(r.success).toBe(true);
  });

  it('weigert een leeg transcript', () => {
    const r = soepFeedbackRequestSchema.safeParse({ casusId: 'van-dam', transcript: '' });
    expect(r.success).toBe(false);
  });

  it('weigert onbekende velden', () => {
    const r = soepFeedbackRequestSchema.safeParse({ casusId: 'van-dam', transcript: 'x', extra: 1 });
    expect(r.success).toBe(false);
  });
});
```

**Stap 2:** Run: `npm run test:unit -- tests/soep/contract.test.ts` → FAIL.

**Stap 3: Voeg het schema toe** aan `src/shared/api-contract.ts`:

```ts
export const soepFeedbackRequestSchema = z
  .object({
    casusId: z.string().min(1).max(50),
    transcript: z.string().min(1).max(10_000)
  })
  .strict();

export type SoepFeedbackRequest = z.infer<typeof soepFeedbackRequestSchema>;
```

**Stap 4:** Run: `npm run test:unit -- tests/soep/contract.test.ts` → PASS.

**Stap 5: Commit**

```bash
git add src/shared/api-contract.ts tests/soep/contract.test.ts
git commit -m "feat: voeg SOEP-feedback request-schema toe"
```

---

## Phase 3: Prompt en payload-builder (backend, TDD)

### Taak 3.1: SOEP-feedbackprompt

**Bestanden:**
- Maken: `server/prompts/soep-feedback-prompt.ts`

**Stap 1:** Maak een prompt-template naar voorbeeld van `server/prompts/feedback-prompt.ts` (geïmporteerd in `prompt-builders.ts`). Inhoud uit `soepie/soep-rubric.md`: de vaste feedbackopbouw (wat ging goed → techniek → SOEP-check → uitnodiging), de inspreektechniek-criteria (70%), het 70/30-gewicht, toon (positief, direct, MBO, geen cijfers), max ~150 woorden, Nederlands. Gebruik placeholders die de builder invult:

```ts
export const SOEP_FEEDBACK_PROMPT = `Je bent een begeleider voor MBO-zorgstudenten die oefenen met spraakrapportage...

## SOEP-theorie en rubriek
{{SOEP_KENNIS}}

## Ijkpunten voor deze casus
{{IJKPUNTEN}}

## Veelgemaakte valkuil bij deze casus
{{VALKUIL}}

## Jouw feedbackopbouw (altijd in deze volgorde)
1. WAT GING GOED ...
2. TECHNIEK (70%) ...
3. SOEP-CHECK (30%) ...
4. UITNODIGING ...

Toon: ... Max 150 woorden. Nederlands.`;
```

**Stap 2:** Geen losse test; gedekt door Taak 3.2. Commit.

```bash
git add server/prompts/soep-feedback-prompt.ts
git commit -m "feat: voeg SOEP-feedbackprompt toe"
```

### Taak 3.2: `buildSoepFeedbackPayload`

**Bestanden:**
- Maken: `server/lib/soep-feedback.ts`
- Test: `tests/soep/payload.test.ts`

**Stap 1: Schrijf de falende test**

```ts
import { describe, expect, it } from 'vitest';
import { buildSoepFeedbackPayload } from '../../server/lib/soep-feedback';
import { soepCasussen } from '../../src/knowledge/soep-casussen';

describe('buildSoepFeedbackPayload', () => {
  it('bouwt een systeem- en userprompt met casus-ijkpunten en transcript', () => {
    const casus = soepCasussen[0];
    const transcript = 'Mevrouw geeft aan pijn te hebben in haar been.';
    const payload = buildSoepFeedbackPayload({ casus, transcript });

    expect(payload.systemPrompt).toContain(casus.valkuil);
    expect(payload.systemPrompt).toContain(casus.soepIjkpunten.s);
    expect(payload.userPrompt).toContain(transcript);
    expect(payload.userPrompt).toContain(casus.casustekst);
  });
});
```

**Stap 2:** Run: `npm run test:unit -- tests/soep/payload.test.ts` → FAIL.

**Stap 3: Implementeer de builder**

```ts
import { SOEP_FEEDBACK_PROMPT } from '../prompts/soep-feedback-prompt';
import soepKennis from '../../src/knowledge/soep.json';
import type { SoepCasus } from '../../src/knowledge/soep-casussen';

function formatKennis(): string { /* korteUitleg + technieken + rubric als tekst */ }

export function buildSoepFeedbackPayload({ casus, transcript }: { casus: SoepCasus; transcript: string }) {
  const ijkpunten = `S: ${casus.soepIjkpunten.s}\nO: ${casus.soepIjkpunten.o}\nE: ${casus.soepIjkpunten.e}\nP: ${casus.soepIjkpunten.p}`;
  return {
    systemPrompt: SOEP_FEEDBACK_PROMPT
      .replace('{{SOEP_KENNIS}}', formatKennis())
      .replace('{{IJKPUNTEN}}', ijkpunten)
      .replace('{{VALKUIL}}', casus.valkuil),
    userPrompt: `Casus die de student kreeg:\n---\n${casus.casustekst}\n---\n\nDe student sprak deze rapportage in (automatisch getranscribeerd):\n---\n${transcript}\n---\n\nGeef nu je feedback volgens de voorgeschreven structuur.`
  };
}
```

**Stap 4:** Run: `npm run test:unit -- tests/soep/payload.test.ts` → PASS.

**Stap 5: Commit**

```bash
git add server/lib/soep-feedback.ts tests/soep/payload.test.ts
git commit -m "feat: voeg SOEP-feedback payload-builder toe"
```

---

## Phase 4: Serverroute (backend, TDD met Supertest)

### Taak 4.1: `POST /api/soep/feedback`

**Bestanden:**
- Wijzigen: `server/app.ts` (nieuwe route toevoegen vóór de 404-handler, na `/api/ai-mode/stream`)
- Test: `tests/soep/route.test.ts`

**Stap 1: Schrijf de falende test** (mirror `tests/security/server-ai-modes.test.ts` voor opzet: app maken, sessietoken genereren, Anthropic mocken). Test minimaal:
- zonder `Authorization` → 401;
- ongeldige body (leeg transcript) → 400;
- onbekende `casusId` → 400/404;
- geldig verzoek → 200 met `{ response: string }` (Anthropic gemockt).

**Stap 2:** Run: `npm run test:unit -- tests/soep/route.test.ts` → FAIL.

**Stap 3: Implementeer de route** in `server/app.ts`:

```ts
app.post('/api/soep/feedback', async (req: Request, res: Response) => {
  const parsed = soepFeedbackRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Ongeldig SOEP-feedbackverzoek.' });
    return;
  }
  const casus = getCasusById(parsed.data.casusId);
  if (!casus) {
    res.status(400).json({ error: 'Onbekende casus.' });
    return;
  }
  try {
    const built = buildSoepFeedbackPayload({ casus, transcript: parsed.data.transcript });
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 600,
      system: built.systemPrompt,
      messages: [{ role: 'user', content: built.userPrompt }]
    });
    const textContent = response.content.find((c) => c.type === 'text');
    res.json({ response: textContent && 'text' in textContent ? textContent.text : 'Geen antwoord ontvangen.' });
  } catch (error) {
    console.error('SOEP feedback error:', error);
    res.status(500).json({ error: 'Er ging iets mis met de AI. Probeer het opnieuw.' });
  }
});
```

Voeg bovenaan `server/app.ts` de imports toe: `soepFeedbackRequestSchema` (uit `../src/shared/api-contract`), `getCasusById` (uit `../src/knowledge/soep-casussen`), `buildSoepFeedbackPayload` (uit `./lib/soep-feedback`). Auth en rate-limiting gelden automatisch via de bestaande `app.use('/api', ...)`-middleware (pad is niet `/session`).

**Stap 4:** Run: `npm run test:unit -- tests/soep/route.test.ts` → PASS. Daarna de hele suite: `npm run test:unit` → alles groen (geen regressie op bestaande modi).

**Stap 5: Commit**

```bash
git add server/app.ts tests/soep/route.test.ts
git commit -m "feat: voeg /api/soep/feedback route toe"
```

---

## Phase 5: Frontend SOEP-flow

> Frontend-DOM laat zich hier lastig via TDD testen (één grote `initUI()`-string). Werk klein, verifieer handmatig in de browser (`npm run dev` + `npm run server`). De `frontend-api.test.ts` kan wel een unit-test voor de nieuwe API-call dekken.

### Taak 5.1: API-client voor SOEP

**Bestanden:**
- Wijzigen: `src/api.ts` (functie toevoegen)
- Test: `tests/soep/frontend-api.test.ts` (mirror `tests/security/frontend-api.test.ts`)

**Stap 1:** Test: `sendSoepFeedback(casusId, transcript)` doet een `POST` naar `/api/soep/feedback` met `Authorization: Bearer ...` en geeft `{ response }` terug. → FAIL.

**Stap 2:** Implementeer met het bestaande `withFreshSessionToken`-patroon (zie `sendAiModeRequest`):

```ts
export async function sendSoepFeedback(casusId: string, transcript: string): Promise<{ response?: string; error?: string }> {
  return withFreshSessionToken(async (sessionToken) => {
    const response = await fetch(`${API_BASE}/api/soep/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify({ casusId, transcript })
    });
    if (!response.ok) await throwForFailedResponse(response, `Server error: ${response.status}`);
    return (await response.json()) as { response?: string; error?: string };
  });
}
```

**Stap 3:** Test → PASS. Commit.

### Taak 5.2: Opname → transcript-helper

**Bestanden:**
- Lezen (verkenning, 5 min): `src/speech.ts`, `src/voice.ts` — bestaat er al een herbruikbare `MediaRecorder`-helper die een audio-blob oplevert? Zo ja, hergebruik die. Zo nee:
- Maken: kleine opname-helper in `src/soep.ts` met `MediaRecorder` (mimeType `audio/webm`), die de blob naar de bestaande `speechToText(blob)` uit `src/api.ts` stuurt en het transcript teruggeeft.

**Verificatie:** handmatig. Opnemen levert na stop een Nederlandse transcriptie op (vereist `GOOGLE_APPLICATION_CREDENTIALS` op de server).

### Taak 5.3: SOEP-schermlogica

**Bestanden:**
- Maken: `src/soep.ts`
- Wijzigen: `src/state.ts` (klein `soep`-deelobject: `currentCasusIndex`, `transcript`, `isRecording`), of houd deze state lokaal in `src/soep.ts`.

**Flow (uit `soepie/concept-soep-oefentool.md`, scherm 2 en 3):**
1. Toon casus (`casustekst`, naam, `setting`, teller `n/totaal`).
2. Microfoonknop: start/stop opname (Taak 5.2). Toon transcript live/na afloop.
3. "Stuur in voor feedback" → `sendSoepFeedback(casus.id, transcript)`.
4. Render feedback (hergebruik `renderFeedbackSafe` uit `src/security/render-feedback.ts`, of een eenvoudige veilige renderer).
5. Knoppen "Opnieuw proberen" (zelfde casus, reset transcript) en "Volgende casus" (volgende index, rouleer).

**Verificatie:** handmatig, hele flow doorlopen in de browser.

**Commit** na een werkende flow:

```bash
git add src/soep.ts src/state.ts src/api.ts tests/soep/frontend-api.test.ts
git commit -m "feat: voeg SOEP-rapportageflow toe (frontend)"
```

---

## Phase 6: Keuzescherm (instap)

### Taak 6.1: Landingsscherm "gesprek of rapportage"

**Bestanden:**
- Wijzigen: `index.html` (containers voor keuzescherm en SOEP-scherm)
- Wijzigen: `src/ui.ts` (`initUI()`): render een eerste keuzescherm met twee knoppen; "Oefen een gesprek" toont de bestaande setup, "Oefen een rapportage" start `src/soep.ts`.
- Wijzigen: `src/main.ts` indien nodig (init-volgorde).

**Aanpak:** voeg een nieuw startscherm toe vóór de bestaande `.settings-panel`. Hergebruik de bestaande `setAppMode`/scherm-toggle-helpers in `src/ui.ts` zodat het past bij hoe schermen nu getoond/verborgen worden. Houd de bestaande gespreksflow exact intact.

**Verificatie:** handmatig. Beide modi bereikbaar vanaf het keuzescherm; terug kunnen naar de keuze.

**Commit:**

```bash
git add index.html src/ui.ts src/main.ts
git commit -m "feat: voeg keuzescherm gesprek/rapportage toe"
```

---

## Phase 7: Afronding en verificatie

**Stap 7.1** Volledige suite: `npm run test:unit` → alles groen.

**Stap 7.2** Kwaliteit: `npm run lint` en `npm run format:check` → schoon. Server-types: `npm run server:check`.

**Stap 7.3** Handmatige end-to-end (uit de Definition of Done in het concept):
- [ ] Keuzescherm toont beide modi.
- [ ] Alle casussen beschikbaar en wisselend.
- [ ] Opname → Nederlandse transcriptie zichtbaar.
- [ ] Feedback komt terug in de vier blokken (goed → techniek → SOEP → uitnodiging).
- [ ] "Opnieuw proberen" en "Volgende casus" werken.
- [ ] Geen console-errors in Chrome.
- [ ] Bestaande gespreksmodus werkt nog onveranderd (regressiecheck).

**Stap 7.4** Documentatie bijwerken: voeg de SOEP-modus toe aan de Architecture-sectie van `CLAUDE.md` en `AGENTS.md` (kort: nieuwe route, `src/soep.ts`, `src/knowledge/soep*.`). Vink de bouwstatus af in `soepie/CONTEXT.md`. Deploy-notities: geen nieuwe env-vars nodig; STT vereist `GOOGLE_APPLICATION_CREDENTIALS` (al gedocumenteerd in `DEPLOY.md`).

**Stap 7.5** Afronden volgens `superpowers:finishing-a-development-branch`.

---

## Risico's en aandachtspunten

- **STT-afhankelijkheid:** spraak werkt alleen met `GOOGLE_APPLICATION_CREDENTIALS` op de server. Zonder dat geeft `/api/speech-to-text` een 500. Bouw een nette foutmelding in de SOEP-flow.
- **`max_tokens` feedback:** 600 is ruim voor ~150 woorden; stel bij indien feedback wordt afgekapt.
- **Geen regressie:** raak de bestaande `aiModeRequestSchema` en `buildModePayload` niet aan. De SOEP-route staat er volledig los van.
- **UI-complexiteit:** `src/ui.ts` is één groot bestand. Houd SOEP-logica in `src/soep.ts` en laat `ui.ts` alleen schermen tonen/verbergen.
- **Inhoud blijft in `soepie/`:** wijzig je rubric of casussen, doe dat in `soepie/` en port opnieuw naar `src/knowledge/soep*`. `soepie/` is de bron van waarheid voor inhoud.

---

## Uitvoeringskeuze (na vaststellen van dit plan)

**1. Subagent-gedreven (deze sessie):** ik dispatch per taak een verse subagent met code review ertussen. Snelle iteratie, jij blijft in de lus. Vereist `superpowers:subagent-driven-development`.

**2. Aparte sessie:** open een nieuwe sessie met `superpowers:executing-plans` en voer batchgewijs uit met checkpoints.

Aanbevolen start: **Phase 0 bevestigen → Phase 1 (inhoud) → daarna de backend-taken (Phase 2-4) als aaneengesloten TDD-blok**, want die zijn goed testbaar en vormen het fundament. De frontend (Phase 5-6) daarna.
