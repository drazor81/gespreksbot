# Concept: SOEP Spraakrapportage Oefentool
*Versie 0.1 - verkenning*

---

## Kernidee

Een losse webpagina waarop MBO-zorgstudenten zelfstandig thuis kunnen oefenen met het **inspreken van rapportages** volgens de SOEP-methode. De tool combineert browsergebaseerde spraakherkenning met AI-feedback die reageert op wat de student heeft ingesproken - niet op wat ze hebben getypt.

Het onderscheidende aan deze tool ten opzichte van bestaande e-learnings: **de student spreekt, niet typt**. De techniek van inspreken (vloeiend, duidelijk, in de juiste SOEP-volgorde) is het primaire leerdoel (70%). Het correct toepassen van SOEP-structuur is het secundaire leerdoel (30%).

---

## Gebruikersflow (stap voor stap)

### Stap 1 - Casus ophalen
De student opent de pagina. Geen login, geen registratie. Er verschijnt direct een zorgcasus: een korte situatiebeschrijving met een cliënt, een zorgmoment en relevante context (bijv. mevrouw Van Dam, 78 jaar, thuiszorg, klaagt over pijn in het linkerbeen bij het lopen).

De casus is realistisch en MBO-niveau-waardig. Er zijn meerdere casussen beschikbaar (roulatie of keuzemenu).

### Stap 2 - Inspreken
De student klikt op een microfoonknop en spreekt de rapportage in, live, alsof ze direct na het zorgmoment rapporteren. De browser zet spraak naar tekst om (Web Speech API). De ingesproken tekst verschijnt live op het scherm.

De student kan het opnieuw proberen als ze niet tevreden zijn.

### Stap 3 - AI-feedback
Na het inspreken analyseert de AI (Claude via API) de getranscribeerde tekst op twee lagen:

**Techniekfeedback (70% gewicht):**
- Is de rapportage vloeiend ingesproken (weinig herhalingen, twijfelgeluiden, onderbrekingen)?
- Zijn zinnen volledig en grammaticaal?
- Is de formulering professioneel en zakelijk (geen omgangstaal)?
- Is het tempo en de structuur van inspreken geschikt voor ECD-gebruik?

**SOEP-structuurfeedback (30% gewicht):**
- Zijn alle vier elementen aanwezig (S, O, E, P)?
- Staan subjectieve bevindingen onder S en observaties onder O?
- Is de evaluatie onderbouwd vanuit S en O?
- Is het plan concreet en opvolgbaar?

### Stap 4 - Reflectie + herhaling
De AI geeft feedback in begrijpelijke taal, passend bij MBO-niveau. Geen cijfer, wel een korte toelichting per onderdeel met een concreet verbeterpunt. De student kan daarna direct opnieuw inspreken (zelfde casus, verbeterd) of doorgaan naar een nieuwe casus.

---

## Technische architectuur (voor Claude Code)

```
soep-oefentool/
├── index.html              # Single-page app, geen framework nodig
├── style.css               # Styling (zorgkleurenpalet, rustig en professioneel)
├── app.js                  # Hoofdlogica
│   ├── speechEngine.js     # Web Speech API wrapper
│   ├── casusBank.js        # Array met zorgcasussen
│   └── feedbackEngine.js   # Claude API aanroep + response parsing
└── CLAUDE.md               # Projectcontext voor Claude Code
```

**Geen backend nodig.** De Claude API wordt direct vanuit de browser aangeroepen (API-key via omgevingsvariabele of eenvoudige config). Dit houdt de tool licht en deploybaar als statische pagina (bijv. via GitHub Pages of Vercel).

---

## Casussenbank (eerste 5 casussen)

Alle casussen zijn MBO-niveau, herkenbaar voor zorg- en welzijnsstudenten:

1. **Mevrouw Van Dam** - Thuiszorg, 78 jaar, klaagt over pijn linkerbeen, wond ziet er anders uit dan gisteren.
2. **De heer Jansen** - Verpleeghuis, 84 jaar, heeft slecht gegeten, is verward bij de lunch, herkent zijn dochter niet.
3. **Youssef** - Gehandicaptenzorg, 32 jaar, heeft incident gehad (conflict met medebewoner), is nu rustig maar teruggetrokken.
4. **Mevrouw Okeke** - Wijkverpleging, 67 jaar, wond na operatie, wondvocht toegenomen, geeft aan minder pijn te hebben dan gisteren.
5. **Stefan** - Jeugdzorg, 16 jaar, niet op school geweest, reageert kort bij thuiskomst, geen oogcontact.

---

## Feedbackstijl (afgeleide van oefenbot-aanpak)

De AI reageert als een betrokken, constructieve begeleider - niet als een docent die afvinkt. Toon is positief maar direct. Structuur van elke feedbackronde:

1. **Wat ging goed** (altijd minstens één punt, concreet)
2. **Techniek: aandachtspunt** (één verbeterpunt max, met voorbeeld)
3. **SOEP: check** (kort: wat ontbreekt of wat is sterk)
4. **Uitnodiging** ("Wil je het opnieuw proberen of een nieuwe casus?")

Geen lange lappen tekst. Geen schoolse taal. Geen cijfers. Wel: voorbeeldzinnen die laten zien hoe het beter kan.

---

## Bewuste keuzes en afbakening

| Keuze | Motivatie |
|---|---|
| Geen login | Drempelvrij, direct bruikbaar thuis |
| Web Speech API (gratis) | Geen extra kosten, werkt in Chrome/Edge |
| Claude API voor feedback | Rijke, contextgevoelige feedback vs. simpele regex |
| Geen score/cijfer | Formatieve toets, niet summatief - gaat om leren |
| Max 5 casussen v1 | Klein en beheersbaar; uitbreidbaar |
| Nederlandse UI | Doelgroep is NL MBO-student |
| Statische pagina | Geen server, geen AVG-hoofdpijn, gratis hosting |

---

## Wat dit NIET is (bewuste uitsluitingen v1)

- Geen ECD-simulator (te complex, te duur)
- Geen login of voortgangsbeheer
- Geen audio-opname (alleen transcriptie)
- Geen gamification (punten, badges)
- Geen mobiele app

---

## Claude Code prompt (klaar voor gebruik)

Zie sectie hieronder. Te plakken als eerste bericht in een lege Claude Code sessie.

---

## CLAUDE CODE STARTPROMPT

```
## IDENTITY

Je bent een senior frontend developer en UX-specialist met expertise in 
educatieve tools voor zorgonderwijs. Je bouwt een kleine, zelfstandig 
werkende webapplicatie zonder framework, gericht op MBO-zorgstudenten 
in Nederland. Je schrijft en communiceert in het Nederlands. Je codeert 
clean en goed gedocumenteerd.

---

## TASK

Bouw een losse webpagina: de SOEP Spraakrapportage Oefentool. Dit is een 
educatieve tool waarmee MBO-zorgstudenten zelfstandig thuis kunnen oefenen 
met het inspreken van zorgrapportages volgens de SOEP-methode (Subjectief, 
Objectief, Evaluatie, Plan).

De tool heeft geen login, geen backend en geen database. Alles draait 
client-side, behalve de Claude API-aanroep voor feedback.

---

## CONTEXT

Doelgroep: MBO-zorgstudenten niveau 2-4 (Verzorgende IG, Verpleegkunde, 
Helpende Zorg en Welzijn). Ze oefenen spraakrapportage als voorbereiding 
op gebruik van ECD-systemen met spraakherkenning in de praktijk.

Primair leerdoel (70%): techniek van inspreken - vloeiend, zakelijk, 
volledig, professioneel formuleren via spraak.
Secundair leerdoel (30%): SOEP-structuur correct toepassen.

Feedbackstijl: constructief en begeleidend, MBO-taalniveau, geen cijfers, 
geen schoolse taal. Altijd eerst wat goed ging, dan één verbeterpunt techniek, 
dan SOEP-check, dan uitnodiging om opnieuw te proberen of door te gaan.

Technische context: losse HTML/CSS/JS pagina, geen framework. 
Web Speech API voor spraakherkenning (werkt in Chrome en Edge). 
Claude API (claude-sonnet-4-20250514) voor feedbackgeneratie.
Deploybaar als statische pagina (GitHub Pages of Vercel).

---

## CONSTRAINTS

- Geen externe CSS-frameworks (geen Bootstrap, geen Tailwind)
- Geen npm, geen build tools - gewone HTML/CSS/JS bestanden
- Wel: Google Fonts mag via CDN
- API-key wordt ingelezen via een config-object bovenaan app.js 
  (const CONFIG = { apiKey: 'JOUW_KEY_HIER' }) - geen .env
- Alles in het Nederlands (UI, feedback, casussen)
- Maximaal 3 bestanden: index.html, style.css, app.js
- Web Speech API: gebruik SpeechRecognition met continuous: false 
  en lang: 'nl-NL'
- Claude API aanroep: fetch naar https://api.anthropic.com/v1/messages
  met model claude-sonnet-4-20250514, max_tokens 600
- Geen audio-opnames opslaan - alleen de transcript verwerken
- Responsive: werkt op laptop en tablet, mobiel is nice-to-have

---

## CASUSSENBANK

Verwerk deze 5 casussen als array in app.js:

1. Mevrouw Van Dam, 78 jaar, thuiszorg. Klaagt over pijn in linkerbeen bij 
   het lopen. Bij inspectie zie je een rode plek ter grootte van een €2-munt 
   op de linkerscheenbeen. Huid voelt warm aan. Ze heeft gisterenochtend 
   haar steunkousen niet aangehad omdat ze 'te strak zaten'.

2. De heer Jansen, 84 jaar, verpleeghuis. Heeft tijdens de lunch slecht 
   gegeten (minder dan een kwart van zijn bord). Herkende zijn dochter niet 
   tijdens bezoek. Is onrustig geweest en heeft meerdere keren gevraagd 
   'wanneer hij naar huis mag'. Bloeddruk 145/90, temperatuur normaal.

3. Youssef, 32 jaar, gehandicaptenzorg (licht verstandelijke beperking). 
   Had vanmiddag een conflict met medebewoner over de televisie. Schreeuwde 
   en gooide een kussen. Is nu rustig op zijn kamer, reageert kort, maakt 
   geen oogcontact. Geeft aan 'het niet meer te willen uitleggen'.

4. Mevrouw Okeke, 67 jaar, wijkverpleging. Wond linker onderbeen na 
   operatie 12 dagen geleden. Wondvocht licht toegenomen ten opzichte van 
   gisteren, kleur gelig. Omliggende huid niet rood. Mevrouw geeft aan 
   minder pijn te hebben dan gisteren en slaapt weer beter.

5. Stefan, 16 jaar, jeugdzorg (gezinshuis). Niet op school geweest vandaag 
   zonder melding. Thuisgekomen om 16:30, reageert kort op vragen, geen 
   oogcontact. Trekt zich terug op zijn kamer. Heeft wel gegeten bij het 
   avondeten maar zegt niets.

---

## SYSTEEM PROMPT VOOR CLAUDE FEEDBACK

Gebruik deze systeem prompt exact in elke API-aanroep:

"Je bent een begeleider voor MBO-zorgstudenten die oefenen met spraakrapportage. 
Je geeft feedback op een ingesproken zorgrapportage. De student heeft hardop 
gerapporteerd en de tekst is automatisch omgezet naar tekst via spraakherkenning.

Jouw feedback bestaat altijd uit vier onderdelen, in deze volgorde:
1. WAT GING GOED: noem één concreet sterk punt (formulering, structuur, volledigheid)
2. TECHNIEK: geef één verbeterpunt over hoe de rapportage is ingesproken of geformuleerd 
   (zinsbouw, omgangstaal, onduidelijkheden, incomplete zinnen). Geef een voorbeeldzin.
3. SOEP-CHECK: controleer of S, O, E en P aanwezig zijn. Noem wat ontbreekt of 
   wat sterk is. Maximaal 2 zinnen.
4. UITNODIGING: sluit af met een korte aanmoediging en vraag of de student opnieuw 
   wil proberen of een nieuwe casus wil.

Toon: positief, direct, MBO-taalniveau. Geen cijfers. Geen schoolse taal. 
Totale feedback: maximaal 150 woorden. Schrijf in het Nederlands."

---

## UI-VEREISTEN

Scherm 1 - Start:
- Naam van de tool: 'SOEP Oefentool'
- Korte uitleg (2 zinnen) wat de bedoeling is
- Knop: 'Start met oefenen'

Scherm 2 - Casus + inspreken:
- Casusnummer + casusnaam zichtbaar
- Casustekst duidelijk leesbaar
- Grote microfoonknop (rood tijdens opname)
- Transcriptie verschijnt live onder de microfoonknop
- Knop 'Stuur in voor feedback' (actief zodra er tekst is)
- Kleine knop 'Opnieuw inspreken' (reset transcriptie)

Scherm 3 - Feedback:
- Feedbacktekst duidelijk weergegeven (vier onderdelen visueel gescheiden)
- Knop 'Opnieuw proberen' (zelfde casus)
- Knop 'Volgende casus'
- Kleine indicatie welke casus (1/5, 2/5 etc.)

Visuele stijl: rustig, professioneel, zorgkleurenpalet (blauw/groen tinten), 
geen speelse elementen. Voelt als een serieuze leertool, niet als een game.

---

## OUTPUT FORMAT

Lever de drie bestanden in deze volgorde:
1. index.html (volledig)
2. style.css (volledig)
3. app.js (volledig, inclusief casussenbank en alle logica)

Daarna: korte gebruiksinstructie (5 bullets) hoe de tool te openen en 
te testen lokaal, en waar de API-key in te vullen.

---

## DEFINITION OF DONE

De tool is klaar als:
- [ ] Alle 5 casussen beschikbaar en wisselend
- [ ] Microfoonknop activeert Web Speech API met lang: 'nl-NL'
- [ ] Live transcriptie zichtbaar tijdens inspreken
- [ ] Claude API-aanroep werkt met de exacte systeem prompt hierboven
- [ ] Feedback verschijnt in vier visueel gescheiden blokken
- [ ] Knoppen 'Opnieuw proberen' en 'Volgende casus' werken correct
- [ ] Pagina werkt zonder internet-verbinding behalve voor de API-aanroep
- [ ] Geen console-errors bij normaal gebruik in Chrome
- [ ] Stijl is rustig en professioneel (geen felle kleuren, geen game-elementen)
- [ ] Alle tekst in het Nederlands
```
