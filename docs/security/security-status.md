# Security Status

Laatst bijgewerkt: 2026-03-31

## Huidige status

De productieversie van ZorgGesprek+ draait nu in een server-owned AI-architectuur.

- De browser praat met Render, niet rechtstreeks met Anthropic.
- Promptopbouw gebeurt server-side via de `ai-mode` flow.
- De oude raw-prompt routes `/api/chat` en `/api/chat/stream` zijn verwijderd.
- Toegang tot AI-endpoints vereist eerst een geldige Turnstile-challenge en daarna een kortlevend sessietoken.
- De frontend bevat geen server secrets zoals `ANTHROPIC_API_KEY` of `TURNSTILE_SECRET_KEY`.
- Feedback van het model wordt veilig gerenderd via DOM-nodes in plaats van ongefilterde model-HTML.

## Wat nu is afgedicht

### 1. Tokenmisbruik via client-side API keys

Afgedicht.

De Anthropic-key staat alleen nog server-side op Render en wordt niet meer naar de browser of Vercel-frontend gelekt.

### 2. Misbruik als open prompt-proxy

Afgedicht.

Externe gebruikers kunnen niet meer een eigen `systemPrompt` meesturen via de verwijderde legacy routes. De backend accepteert alleen nog gestructureerde `ai-mode` verzoeken.

### 3. Onbeveiligde directe AI-calls

Afgedicht.

AI-routes vereisen een bearer sessietoken. Sessietokens worden alleen uitgegeven na een geldige Turnstile-verificatie.

### 4. Browser-side XSS in feedbackweergave

Afgedicht voor de AI-feedbackflow.

Modeloutput wordt niet meer direct als HTML geïnjecteerd in de feedbackweergave.

## Vereiste productieconfig

### Render

- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL`
- `SESSION_TOKEN_SECRET`
- `TURNSTILE_SECRET_KEY`
- `SESSION_AUTH_MODE=turnstile`
- `FRONTEND_URL=https://gesprekoefenen.aizorgacademy.nl,https://gespreksbot.vercel.app`

### Vercel

- `VITE_API_BASE=https://gespreksbot.onrender.com`
- `VITE_TURNSTILE_SITE_KEY`

### Cloudflare Turnstile

Toegestane hostnames:

- `gesprekoefenen.aizorgacademy.nl`
- `gespreksbot.vercel.app`

## Resterende aandachtspunten

- Turnstile verlaagt misbruik sterk, maar voorkomt niet dat een echte menselijke gebruiker de app normaal gebruikt. Het doel is hier misbruik van jouw tokens en promptproxy te blokkeren, niet om publieke toegang volledig te verbieden.
- Het docentdashboard gebruikt lokale browseropslag. Dat is geen server-secret risico, maar wel relevant voor privacy en device hygiene.
- `showTheory()` in de frontend rendert statische kennisbankinhoud als HTML. Dat is acceptabel zolang die content build-time en repo-owned blijft. Maak die bron niet dynamisch zonder een echte allowlist sanitizer.

## Periodieke controle

Gebruik voor terugkerende productiechecks en incident-signalen:

- [operations.md](C:/Obsidian vault/Gespreksbot/operations.md)

## Conclusie

De belangrijkste misbruikroute is gesloten: jouw backend functioneert niet meer als vrije prompt-proxy voor derden. De productieopzet is nu geschikt om tokens en promptkwaliteit te beschermen, zolang de bovenstaande productieconfig actief blijft en de periodieke controles uit `operations.md` worden gevolgd.
