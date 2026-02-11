# Live Voice Mode - Design Document

*11 februari 2026*

## Samenvatting

Live speech-to-speech modus voor de Gespreksbot, vergelijkbaar met ChatGPT's voice mode. Studenten praten direct met de bot zonder opnameknop - de browser luistert continu en de bot antwoordt zin-voor-zin.

## Ontwerpbeslissingen

| Keuze | Beslissing | Reden |
|-------|-----------|-------|
| STT | Web Speech API (browser-native) | Geen upload nodig, instant herkenning |
| TTS | Google Cloud TTS (server) | Betere stemkwaliteit dan browser TTS |
| Streaming | Zin-voor-zin via SSE | ~1-2s wachttijd i.p.v. ~5-8s |
| Barge-in | Ja, direct stoppen | Natuurlijk gespreksgevoel |
| UI | Fullscreen overlay met pulserende orb | Duidelijke focus op spraakgesprek |
| Fallback | Bestaande speech.ts flow | Voor browsers zonder Web Speech API |

## Architectuur

### State machine

```
IDLE → LISTENING → PROCESSING → SPEAKING → LISTENING (loop)
                                     ↓
                               BARGE-IN → LISTENING
```

### Data flow

```
Client                         Server                      Anthropic
  |                              |                            |
  | SpeechRecognition (browser)  |                            |
  | → transcript                 |                            |
  |                              |                            |
  |-- POST /api/chat/stream ---->|                            |
  |                              |-- messages.stream() ------>|
  |<--- SSE: text deltas --------|<--- text_delta ------------|
  |                              |                            |
  | Client splitst op zinsgrenzen|                            |
  | → POST /api/text-to-speech   |                            |
  |<--- audio blob --------------|                            |
  | → afspelen                   |                            |
```

### TTS-wachtrij pipeline

- Zin 1: fetch audio → afspelen
- Zin 2: prefetch audio terwijl zin 1 speelt
- Zin N: wacht in queue
- Bij barge-in: queue legen, audio stoppen

## Server: Streaming endpoint

Nieuw endpoint `POST /api/chat/stream`:
- Zelfde input validatie als `/api/chat`
- Gebruikt `anthropic.messages.stream()` van de SDK
- Stuurt SSE events: `data: {"delta":"tekst"}` per text chunk
- Sluit af met `data: {"done":true,"fullText":"volledige tekst"}`
- Rate limiting: telt als 1 request

## Client: Voice module

### SpeechRecognition

- `continuous: true` - blijft luisteren
- `interimResults: true` - toont live wat herkend wordt
- `lang: 'nl-NL'`
- `onresult` met `isFinal` triggert verwerking
- Auto-restart bij `onend` als voice mode actief is
- Bij barge-in: detecteert spraak tijdens SPEAKING status

### Zinssplitsing

Regex op binnenkomende stream-tekst:
- Splitst op `. `, `! `, `? ` (gevolgd door spatie of einde)
- Houdt `*non-verbale cues*` intact als deel van de zin
- Buffer voor onvoltooide zinnen

### Barge-in mechanisme

1. SpeechRecognition detecteert spraak tijdens SPEAKING
2. Huidige audio wordt direct gepauzeerd
3. TTS-wachtrij wordt geleegd
4. Volledige bot-tekst (gesproken + ongesproken) gaat naar chat
5. Nieuwe LISTENING cyclus begint

## UI: Voice overlay

```
┌──────────────────────────────────────┐
│                                  [X] │
│           ╭─────────────╮            │
│           │  ◉ pulsing  │            │
│           │    orb      │            │
│           ╰─────────────╯            │
│         "Luistert..."                │
│  ┌────────────────────────────────┐  │
│  │ Live transcript hier           │  │
│  └────────────────────────────────┘  │
│       [ Stop spraakgesprek ]         │
└──────────────────────────────────────┘
```

| Status | Kleur | Animatie | Label |
|--------|-------|----------|-------|
| LISTENING | Groen | Langzaam pulsen | "Luistert..." |
| PROCESSING | Blauw | Snel pulsen | "Denkt na..." |
| SPEAKING | Oranje | Golfbeweging | "Spreekt..." |

## Bestanden

### Nieuw
- `src/voice.ts` - Voice overlay logica, SpeechRecognition, TTS-wachtrij
- `src/voice.css` - Overlay styling, orb animaties

### Gewijzigd
- `server/index.ts` - POST /api/chat/stream SSE endpoint
- `src/api.ts` - streamChatMessage() functie
- `src/ui.ts` - Knop opent voice overlay
- `src/state.ts` - Voice state velden

### Ongewijzigd (fallback)
- `src/speech.ts` - Bestaande flow voor browsers zonder Web Speech API

## Implementatievolgorde

1. Server streaming endpoint
2. streamChatMessage() in api.ts
3. Voice module (SpeechRecognition + TTS-queue + barge-in)
4. Overlay UI (HTML + CSS)
5. Integratie in ui.ts
6. Fallback detectie
