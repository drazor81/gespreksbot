# Handleiding: ZorgGesprek+ veilig online zetten

ZorgGesprek+ draait als twee gescheiden onderdelen:
- **Frontend** op **Vercel**
- **Backend** op **Render**

Belangrijk: alleen **Render** verwerkt AI-verkeer. **Vercel host alleen de frontend** en proxy't geen prompts meer.

## Stap 1: Backend op Render
1. Zet de repo op GitHub.
2. Maak op [Render](https://render.com) een nieuwe **Web Service**.
3. Koppel dezelfde repo.
4. Gebruik deze instellingen:
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Voeg minimaal deze environment variables toe:
   - `ANTHROPIC_API_KEY=sk-ant-...`
   - `SESSION_TOKEN_SECRET=` een random geheim van minimaal 32 tekens
   - `SESSION_AUTH_MODE=turnstile` voor productie, `development` alleen lokaal
   - `TURNSTILE_SECRET_KEY=` je Cloudflare Turnstile secret
   - `FRONTEND_URL=` de Vercel URL van je frontend, bijvoorbeeld `https://zorggesprek-plus.vercel.app`
   - `GOOGLE_APPLICATION_CREDENTIALS=` optioneel, alleen nodig voor speech features
6. Deploy de service en kopieer daarna de Render basis-URL, bijvoorbeeld `https://zorggesprek-server.onrender.com`.

## Stap 2: Frontend op Vercel
1. Maak op [Vercel](https://vercel.com) een nieuw project van dezelfde repo.
2. Kies **Vite** als framework preset.
3. Voeg deze environment variables toe:
   - `VITE_API_BASE=https://zorggesprek-server.onrender.com`
   - `VITE_TURNSTILE_SITE_KEY=` je Cloudflare Turnstile site key
4. Deploy het project.

Gebruik bij `VITE_API_BASE` **geen** `/api/chat` of andere route suffix. De frontend spreekt zelf de juiste backendroutes aan.

## Stap 3: Verkeersstroom controleren
Na deployment hoort de keten zo te lopen:
1. De browser laadt de frontend vanaf Vercel.
2. De frontend vraagt een sessietoken op via Render (`/api/session`).
3. De frontend verstuurt gestructureerde AI-modes naar Render (`/api/ai-mode` en `/api/ai-mode/stream`).
4. Alleen Render praat met Anthropic.

## Stap 4: Integratie met aizorgacademy.nl
**Subdomein**
1. Maak bijvoorbeeld `oefenen.aizorgacademy.nl` aan.
2. Zet een `CNAME` naar de Vercel-hostnaam.
3. Voeg het domein toe in Vercel bij **Settings -> Domains**.

**Iframe**
```html
<iframe src="https://JOUW-VERCEL-LINK.vercel.app" width="100%" height="800" frameborder="0" style="border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"></iframe>
```

## Opmerking over slaapstand
De gratis Render-tier kan in slaap vallen. Het eerste backendverzoek kan daardoor merkbaar trager zijn.
