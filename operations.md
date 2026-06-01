# Operations

## Productiecheck

1. Controleer maandelijks of `https://gesprekoefenen.aizorgacademy.nl` nog een gesprek kan starten, een antwoord krijgt en feedback kan genereren.
2. Controleer in Render of `SESSION_AUTH_MODE=turnstile` nog actief is en of `TURNSTILE_SECRET_KEY` niet per ongeluk is verwijderd.
3. Controleer in Vercel dat alleen `VITE_API_BASE` en `VITE_TURNSTILE_SITE_KEY` nodig zijn, en dat er geen server-secrets zoals `ANTHROPIC_API_KEY` meer staan.
4. Controleer in Cloudflare Turnstile of alleen deze hostnames toegestaan zijn:
   - `gesprekoefenen.aizorgacademy.nl`
   - `gespreksbot.vercel.app`
5. Controleer na elke code-update of Render en Vercel allebei op dezelfde nieuwe commit draaien.
6. Test na elke modelwijziging minstens 3 vaste scenario's: een clientgesprek, een lastig gesprek en een feedbackmoment.
7. Houd Anthropic-usage en Render-verkeer in de gaten op onverwachte pieken; dat is je vroegste signaal van misbruik of loops.
8. Controleer periodiek of lokale dashboarddata nog past bij je privacybeleid, omdat docentdashboardgegevens in de browser worden opgeslagen.
9. Draai bij dependency-updates opnieuw:
   - `npm run test:unit`
   - `npm run lint`
   - `npm run build`
   - `npm audit --omit=dev`
10. Bewaar een korte rollback-notitie: welke commit live staat, wat de laatste stabiele commit is, en welke env-vars productie nodig heeft.

## Direct Ingrijpen

1. Als gesprekken ineens `Er is een probleem met de verbinding` geven.
2. Als Render `401` of `403` fouten geeft op `/api/session` of `/api/ai-mode`.
3. Als Vercel per ongeluk weer een `ANTHROPIC_API_KEY` of andere secret krijgt.
4. Als Turnstile in Cloudflare veel errors of plotseling sterk afwijkend verkeer laat zien.
5. Als een nieuw model merkbaar slechtere gesprekken of feedback geeft.

## Productie Env Vars

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

## Opruimen Vercel

Deze oude variabelen horen niet in Vercel te blijven staan:

- `ANTHROPIC_API_KEY`
- `FRONTEND_URL`
