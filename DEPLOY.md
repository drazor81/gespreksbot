# Handleiding: Gespreksbot Online Zetten

Je hebt een applicatie die uit twee delen bestaat: een **Server** (backend) en een **Website** (frontend). Je moet ze allebei online zetten. Hieronder de makkelijkste (vaak gratis) manier.

## Stap 1: De Server Online Zetten (via Render.com)
De server is nodig om veilig met Claude (AI) te praten.

1.  Zet je hele project op **GitHub** (als je dat nog niet hebt gedaan).
2.  Maak een gratis account op [Render.com](https://render.com).
3.  Klik op **New +** -> **Web Service**.
4.  Koppel je GitHub repo.
5.  Vul de volgende gegevens in bij de setup:
    *   **Root Directory:** `server` (Belangrijk! De server zit in een submapje).
    *   **Environment:** `Node`.
    *   **Build Command:** `npm install`.
    *   **Start Command:** `npm start`.
6.  Scroll naar beneden naar **Environment Variables** en voeg toe:
    *   Key: `ANTHROPIC_API_KEY`
    *   Value: `sk-ant-...` (Je echte API sleutel die nu in je `.env` bestand staat).
7.  Klik op **Create Web Service**.
8.  Wacht tot hij klaar is. Je krijgt nu een URL (bijv. `https://gespreksbot-server.onrender.com`). **Kopieer deze URL.**

## Stap 2: De Website Online Zetten (via Vercel)
Nu zetten we de voorkant online en koppelen we deze aan je nieuwe server.

1.  Maak een gratis account op [Vercel.com](https://vercel.com).
2.  Klik op **Add New** -> **Project**.
3.  Importeer dezelfde GitHub repo.
4.  Bij **Framework Preset** kies je `Vite`.
5.  Bij **Environment Variables** voeg je toe:
    *   Key: `VITE_API_URL`
    *   Value: `https://gespreksbot-server.onrender.com/api/chat` (Plak hier de URL van Stap 1 en plak er `/api/chat` achter!).
6.  Klik op **Deploy**.

## Stap 3: Klaar!
Vercel geeft je nu een link naar je website. Als je daar op klikt:
1.  Laadt de site.
2.  Stuurt hij verzoeken naar je Render-server.
3.  Stuurt de Render-server ze door naar Claude.

**Let op:** De gratis versie van Render gaat in 'slaapstand' als hij even niet gebruikt wordt. Het eerste verzoek kan daarom soms 30-50 seconden duren.

## Stap 4: Integratie met aizorgacademy.nl
Nu de app draait (op bijv. Vercel), wil je hem op je eigen site hebben.

**Optie A: Een Subdomein (Mooiste optie)**
Je kunt bijvoorbeeld `oefenen.aizorgacademy.nl` aanmaken.
1.  Ga naar de hosting van je domeinnaam (waar je je DNS beheert).
2.  Maak een `CNAME` record aan met naam `oefenen` en verwijs deze naar de Vercel URL (bijv. `cname.vercel-dns.com`).
3.  Voeg in Vercel bij **Settings -> Domains** het domein `oefenen.aizorgacademy.nl` toe.

**Optie B: Insluiten (Makkelijkste optie)**
Als je een WordPress of andere site hebt, kun je de bot op een pagina zetten met een `iframe` (een venster naar de app).
Code voor op je pagina:
```html
<iframe src="https://JOUW-VERCEL-LINK.vercel.app" width="100%" height="800px" frameborder="0" style="border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"></iframe>
```
