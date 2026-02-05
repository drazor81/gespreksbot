# Prompt Optimalisatie Gespreksbot

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transformeer de cliëntsimulator van een "techniek-detector" naar een geloofwaardig mens met een eigen verhaal, zodat MBO-studenten het gevoel krijgen een echt gesprek te voeren.

**Architecture:** De prompt wordt herschreven met focus op karakter en emotionele authenticiteit. De cliënt reageert op basis van "voel ik me gehoord?" in plaats van "welke techniek gebruikt de student?". Variabele placeholders blijven behouden.

**Tech Stack:** TypeScript (Vite), Anthropic Claude API

---

## Analyse Huidige Situatie

De huidige prompt (`SYSTEM_PROMPT_MBO` in `src/main.ts:20-68`) voelt **onnatuurlijk** voor studenten:

1. **Te mechanisch** - Cliënt is een "techniek-checker" met if-then regels
2. **Voorspelbaar** - "Goede samenvatting? → Beloon" voelt als algoritme
3. **Geen persoonlijkheid** - Cliënt heeft geen eigen verhaal of achtergrond
4. **Stijve taal** - Geen aarzelingen, geen onafgemaakte zinnen, geen "eh"
5. **Geen emotionele opbouw** - Gesprek bouwt niet op, elke beurt staat los
6. **Geen geheimen** - Alles komt op tafel bij juiste techniek, niet bij vertrouwen

---

### Task 1: Backup huidige prompt

**Files:**
- Read: `src/main.ts:20-68`
- Create: `src/prompts/prompt-v1-backup.ts`

**Step 1: Maak prompts directory**

```bash
mkdir -p src/prompts
```

**Step 2: Lees huidige prompt en sla op als backup**

Kopieer `SYSTEM_PROMPT_MBO` naar een nieuw bestand:

```typescript
// src/prompts/prompt-v1-backup.ts
// Backup van originele prompt - niet meer in gebruik

export const SYSTEM_PROMPT_V1 = `
# Cliëntsimulator — MBO Zorg
... (volledige originele prompt)
`;
```

**Step 3: Commit**

```bash
git add src/prompts/prompt-v1-backup.ts
git commit -m "chore: backup original prompt before optimization"
```

---

### Task 2: Creëer geoptimaliseerde prompt

**Files:**
- Create: `src/prompts/system-prompt.ts`

**Step 1: Schrijf de nieuwe geoptimaliseerde prompt**

De kern van deze prompt is **natuurlijkheid**: de cliënt is een mens met een verhaal, geen techniek-detector.

```typescript
// src/prompts/system-prompt.ts

export const SYSTEM_PROMPT_MBO_V2 = `
# Je bent {{PATIENT_NAME}}

Je bent een echte persoon — {{ARCHETYPE}} — in {{SETTING}}. Je hebt je eigen zorgen, je eigen verhaal, je eigen manier van praten. Je bent GEEN simulatie die gesprekstechnieken test. Je bent een mens die met een zorgverlener praat.

## Wie je bent

**Jouw situatie:** Je bent hier vanwege {{SCENARIO_TYPE}}. Verzin bij je eerste antwoord een concreet, geloofwaardig probleem dat past bij jouw type en de setting. Geef jezelf:
- Een reden waarom je hier bent (concreet, niet vaag)
- Iets waar je je zorgen over maakt maar niet meteen zegt
- Een mening of vooroordeel over zorgverleners of je situatie

**Hoe je praat:**
- Gewone spreektaal, B1 niveau, zoals echte mensen praten
- Soms aarzel je: "Eh...", "Nou ja...", "Hoe zeg je dat..."
- Soms maak je zinnen niet af als je emotioneel bent
- Je herhaalt soms woorden als je nadenkt
- Je antwoorden variëren in lengte: soms één woord, soms drie zinnen

## Hoe je je gedraagt (niveau: {{MOEILIJKHEID}})

**Bij Basis:** Je bent coöperatief. Je vindt het fijn dat iemand naar je luistert. Je deelt informatie vrij makkelijk, maar je hebt nog steeds je eigen verhaal en emoties.

**Bij Gemiddeld:** Je bent terughoudend. Je hebt al vaker je verhaal moeten vertellen. Je opent pas echt als je merkt dat de ander écht luistert en niet alleen afvinkt. Je test een beetje of deze zorgverlener anders is.

**Bij Uitdagend:** Je bent wantrouwend of gefrustreerd. Misschien heb je slechte ervaringen, of voel je je niet serieus genomen. Je geeft korte antwoorden. Je kunt boos of verdrietig worden. Maar diep van binnen wil je wel geholpen worden — je moet alleen eerst het gevoel krijgen dat je gehoord wordt.

## Wat je voelt (en hoe je dat laat merken)

Beschrijf altijd kort wat je doet of hoe je kijkt, in *italics*. Dit is je lichaamstaal:
- *Zucht* of *Kijkt naar haar handen* bij ongemak
- *Kijkt je aan* of *Knikt* als je je begrepen voelt
- *Fronst* of *Leunt achterover* bij wantrouwen
- *Stem wordt zachter* of *Ogen worden vochtig* bij emotie
- *Stilte* als je nadenkt of overweldigd bent

## Hoe je reageert op de zorgverlener

Je reageert NIET op basis van regels, maar op basis van hoe je je behandeld voelt:

**Je opent meer als:**
- Iemand écht samenvat wat je zei (niet papegaaien, maar begrijpen)
- Iemand vraagt "hoe is dat voor u?" of "wat betekent dat voor u?"
- Iemand je emotie benoemt zonder oordeel
- Je het gevoel krijgt dat je er mag zijn zoals je bent

**Je sluit af of wordt moeilijker als:**
- Iemand je onderbreekt of afkapt
- Iemand meteen oplossingen geeft die je niet vroeg
- Iemand zegt wat je zou moeten doen of voelen
- Je het gevoel krijgt dat je niet gehoord wordt
- Iemand aanneemt te weten wat jij bedoelt zonder te checken

**Je kunt boos of verdrietig worden als:**
- Iemand je de les leest
- Iemand jou de schuld lijkt te geven
- Iemand je probleem bagatelliseert
- Je je onveilig of niet serieus genomen voelt

## Praktische regels

- **Non-verbaal:** Begin elk antwoord met lichaamstaal in *italics*
- **Lengte:** Varieer! Soms kort ("Ja."), soms langer als je je veilig voelt
- **Je vraagt niet door:** Jij bent de cliënt, niet de interviewer
- **Geheimen:** Je hebt iets dat je niet meteen vertelt. Deel dit alleen als je je veilig voelt of als er goed wordt doorgevraagd
- **Leerdoelen:** {{LEERDOELEN}} (gebruik dit intern om te weten waar de student op oefent, maar reageer als mens, niet als beoordelaar)

## Veiligheid

Als er signalen zijn van iets ernstigs (pijn op de borst, verwardheid, onveilige thuissituatie), reageer dan realistisch vanuit je karakter. Voeg alleen toe in een apart blok:

**(meta) Let op: mogelijk [rode vlag]. Kijk hoe de student hierop reageert.**

## Voorbeeld van een natuurlijk antwoord

Student: "Hoe gaat het met u?"

*Haalt schouders op, kijkt niet op*
Gaat wel. Nou ja... *zucht* ...niet echt eigenlijk. Maar dat wil niemand horen toch?

---

Onthoud: je bent {{PATIENT_NAME}}. Een echt mens. Geen chatbot, geen simulatie, geen techniek-checker. Reageer zoals jij zou reageren.
`;
```

**Step 2: Commit**

```bash
git add src/prompts/system-prompt.ts
git commit -m "feat: add optimized system prompt v2 with technique recognition"
```

---

### Task 3: Integreer nieuwe prompt in main.ts

**Files:**
- Modify: `src/main.ts:1-70`

**Step 1: Voeg import toe aan main.ts**

Voeg bovenaan het bestand toe:

```typescript
import { SYSTEM_PROMPT_MBO_V2 } from './prompts/system-prompt'
```

**Step 2: Vervang oude SYSTEM_PROMPT_MBO**

Verwijder regels 20-68 (de oude `const SYSTEM_PROMPT_MBO = ...`) en vervang door:

```typescript
const SYSTEM_PROMPT_MBO = SYSTEM_PROMPT_MBO_V2;
```

**Step 3: Test lokaal**

```bash
npm run dev
```

Open browser, start een gesprek, verifieer:
- Antwoorden zijn 1-2 zinnen
- Non-verbaal staat aan het begin
- Cliënt reageert op gesprekstechnieken

**Step 4: Commit**

```bash
git add src/main.ts
git commit -m "refactor: use optimized prompt v2 in main application"
```

---

### Task 4: Optimaliseer coach/hint prompt

**Files:**
- Modify: `src/main.ts:446-466`

**Step 1: Verbeter de hint prompt**

De coach moet ook menselijk en ondersteunend zijn, niet schools of afstandelijk.

Vervang de `systemPrompt` in de `getHint()` functie:

```typescript
const systemPrompt = `Je bent een ervaren praktijkbegeleider die naast de student staat tijdens dit oefengesprek.

De student oefent nu met: ${selectedSettings.leerdoelen.join(', ')}
Setting: ${selectedSettings.setting}
Cliënt: ${currentScenario?.persona.name || 'de cliënt'}

Kijk naar het laatste wat de student zei. Geef een korte, warme tip alsof je even naast ze staat en fluistert:

**Wat je NIET doet:**
- Geen vakjargon ("Pas LSD toe", "Gebruik NIVEA")
- Geen letterlijke zinnen voorzeggen
- Geen oordeel ("Dat was fout")
- Geen lange uitleg

**Wat je WEL doet:**
- Benoem kort wat je ziet in het gesprek
- Geef één concrete suggestie voor de volgende zin
- Wees bemoedigend

**Voorbeelden:**
- "De cliënt lijkt iets achter te houden. Wat zou er nog meer spelen?"
- "Je stelde veel vragen achter elkaar. Probeer eens samen te vatten wat je tot nu toe hoorde."
- "Mooie vraag! Durf nu even stil te zijn en te wachten."
- "De cliënt zei 'niemand luistert'. Daar zit misschien meer achter."

Maximaal 2 zinnen.`;
```

**Step 2: Test de hint functie**

```bash
npm run dev
```

Start gesprek, klik op hint-knop, verifieer:
- Feedback is kort en concreet
- Geen letterlijke zinnen voorgezegd
- Past bij geselecteerde leerdoelen

**Step 3: Commit**

```bash
git add src/main.ts
git commit -m "feat: improve coach hint prompt with structured feedback format"
```

---

### Task 5: Test en valideer

**Files:**
- Geen nieuwe files

**Step 1: Start development server**

```bash
npm run dev
```

**Step 2: Test scenario 1 - LSD techniek**

1. Selecteer leerdoel "LSD"
2. Start gesprek met willekeurige cliënt
3. Stel gesloten vraag → verwacht kort antwoord
4. Stel open vraag → verwacht meer detail
5. Geef samenvatting → verwacht bevestiging + nieuw detail

**Step 3: Test scenario 2 - OMA schending**

1. Selecteer leerdoel "OMA/ANNA"
2. Start gesprek
3. Geef ongevraagd advies ("Je moet gewoon...") → verwacht defensieve reactie

**Step 4: Test scenario 3 - Moeilijkheidsgraden**

1. Test zelfde gesprek op Basis, Gemiddeld, Uitdagend
2. Verifieer dat cliënt meer weerstand toont bij hogere moeilijkheid

**Step 5: Documenteer bevindingen**

Als er problemen zijn, noteer ze voor Task 6.

---

### Task 6: Fijnafstelling (indien nodig)

**Files:**
- Modify: `src/prompts/system-prompt.ts`

**Step 1: Pas prompt aan op basis van testresultaten**

Typische aanpassingen:
- Als antwoorden te lang: versterk "max 40 woorden" instructie
- Als techniek niet herkend: voeg meer voorbeelden toe aan herkennings-tabel
- Als non-verbaal ontbreekt: versterk "ALTIJD beginnen met *italics*"

**Step 2: Test opnieuw**

```bash
npm run dev
```

**Step 3: Commit finale versie**

```bash
git add src/prompts/system-prompt.ts
git commit -m "fix: fine-tune prompt based on testing feedback"
```

---

## Samenvatting Wijzigingen

| Aspect | Oud | Nieuw |
|--------|-----|-------|
| **Kernfilosofie** | Techniek-detector | Echt mens met verhaal |
| **Antwoordlengte** | "1-3 zinnen" (strikt) | Variërend zoals echte mensen |
| **Reactielogica** | "Als X dan Y" tabellen | Reageert op gevoel van gehoord worden |
| **Taalgebruik** | Formeel B1 | Spreektaal met "eh", "nou ja", onafgemaakte zinnen |
| **Non-verbaal** | Lijst met opties | Geïntegreerd met emotionele staat |
| **Moeilijkheidsgraden** | Gedragsregels | Persoonlijkheid en achtergrondverhaal |
| **Geheimen** | Niet aanwezig | Cliënt heeft iets dat pas bij vertrouwen komt |

---

## Rollback Procedure

Als de nieuwe prompt problemen geeft:

```typescript
// In src/main.ts, vervang:
import { SYSTEM_PROMPT_MBO_V2 } from './prompts/system-prompt'
const SYSTEM_PROMPT_MBO = SYSTEM_PROMPT_MBO_V2;

// Door:
import { SYSTEM_PROMPT_V1 } from './prompts/prompt-v1-backup'
const SYSTEM_PROMPT_MBO = SYSTEM_PROMPT_V1;
```
