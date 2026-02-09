# Verbeterplan Gespreksbot Zorg - UI/UX Review

**Datum:** 9 februari 2026
**Beoordeeld door:** Docent (15 jaar MBO Verpleegkunde), MBO-4 Student, UX-Designer (10 jaar educatieve software)
**Versie:** 1.0

---

## Samenvatting

De Gespreksbot Zorg is vakinhoudelijk sterk (uitgebreide kennisbank, rubrics, zelfbeoordeling, spraakfunctie) maar heeft UI/UX-verbeteringen nodig om effectief inzetbaar te zijn in MBO-lessen. De belangrijkste blokkades zijn: accessibility-tekorten, ontbrekende export/opslaan-functionaliteit, en een verwarrende setup-flow.

---

## Sterke punten (behouden)

| # | Punt | Perspectief |
|---|------|-------------|
| 1 | Uitgebreide kennisbank met rubrics per leerdoel | Docent |
| 2 | Zelfbeoordeling voorafgaand aan AI-feedback | Alle drie |
| 3 | Gevarieerde combinatie van settings, scenario's, leerdoelen, niveaus en clienttypes | Docent |
| 4 | Chat-interface volgt universeel WhatsApp-patroon, herkenbaar voor doelgroep | Student, UX |
| 5 | Non-verbaal gedrag in italics met left-border is slim en onderscheidend | UX |
| 6 | Spraakfunctie met live-gesprek modus | Docent, Student |
| 7 | Coach-functie (tip-knop) simuleert meekijkende praktijkbegeleider | Docent, Student |
| 8 | Doordacht kleurensysteem met CSS custom properties | UX |

---

## Verbeterplan

### MUST-FIX (Sprint 1)

#### 1. Accessibility: focus states, ARIA labels, touch targets, contrast
**Bron:** UX #2, #3, #4, #5
**Probleem:** App is onbruikbaar met keyboard, touch targets te klein voor mobiel, kleurcontrast onder WCAG AA-norm.
**Wijzigingen:**

- **CSS (style.css):**
  - Globale focus-visible: `*:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }`
  - Toolbar buttons: padding verhogen naar `0.625rem 0.75rem`, font-size naar `0.875rem`
  - Checkboxes: vergroten naar minimaal 24x24px (liever 32px met padding)
  - `--text-muted` verhogen van `#94A3B8` naar `#6B7B8D` (WCAG AA compliant)
  - Disabled states: `opacity: 0.5` minimum (was 0.35)

- **HTML (main.ts):**
  - Scenario cards: `role="button" tabindex="0"` + keydown handler (Enter/Space)
  - Speech toggle: `role="switch" aria-label="Spraakmodus aan/uit"`
  - Welkom-collapse: `aria-expanded="true/false" aria-controls="welcome-body"`
  - Checklist panel: `aria-expanded` state bijhouden
  - Alle interactieve div-elementen: `tabindex="0"` + keyboard event handlers

---

#### 2. Gesprek en feedback exporteren
**Bron:** Docent #3, #6 | Student #8
**Probleem:** Geen manier om gesprek of feedback op te slaan. Docent kan het niet inzetten als beoordelingstool, student kan het niet toevoegen aan portfolio.
**Wijzigingen:**

- **HTML (main.ts):**
  - Voeg "Exporteer als PDF" knop toe aan feedback-scherm (naast "Kopieer")
  - PDF bevat: datum, studentnaam (optioneel invulveld), setting, scenario, leerdoelen, niveau, volledig gesprek, zelfbeoordeling, AI-feedback met scores
  - Implementatie: gebruik browser `window.print()` met `@media print` stylesheet, of een library zoals `html2pdf.js`

- **CSS (style.css):**
  - Voeg `@media print` styles toe die het feedback-scherm optimaliseren voor afdrukken
  - Verberg knoppen, header, en navigatie bij print

---

#### 3. Context-balk tijdens chat
**Bron:** Docent #5 | Student #3
**Probleem:** Tijdens het gesprek is niet zichtbaar welke setting, leerdoel of niveau actief is. Student weet niet meer waar die mee oefent.
**Wijzigingen:**

- **HTML (main.ts):**
  - Voeg een compact info-element toe bovenaan `#chat-container`:
    ```
    <div class="chat-context-bar">
      <span>Thuiszorg</span> <span>LSD</span> <span>Gemiddeld</span>
    </div>
    ```
  - Voeg een beurtenteller toe ("Beurt 4 van ~8")
  - Bij <4 beurten: toon hint "Probeer minimaal 6 beurten"
  - Na het aanbevolen minimum: toon subtiele suggestie "Je kunt nu het gesprek afronden of doorgaan"

- **CSS (style.css):**
  - `.chat-context-bar`: flex, gap, kleine pills/chips, sticky top, background blur
  - Beurtenteller: discrete stijl, niet afleidend van het gesprek

---

#### 4. Feedback-knop scheiden van hulpknoppen
**Bron:** Alle drie
**Probleem:** De Feedback-knop beeindigt het gesprek maar ziet er hetzelfde uit als Theorie/Checklist/Tip. Dit is verwarrend.
**Wijzigingen:**

- **HTML (main.ts):**
  - Verplaats de Feedback-knop uit de toolbar naar een aparte positie (bijv. onder het invoerveld, of als floating action)
  - Of: geef de knop een afwijkende kleur (groen/oranje) en een icoon dat "afsluiten" communiceert

- **CSS (style.css):**
  - Feedback-knop: andere achtergrondkleur, grotere padding, visueel onderscheidend van de drie hulpknoppen

---

#### 5. Developer-foutmeldingen vervangen
**Bron:** Student (extra) | UX #8
**Probleem:** Foutmelding "Start de server met: cd server && npm start" is voor ontwikkelaars, niet voor studenten.
**Wijzigingen:**

- **TypeScript (main.ts):**
  - Vervang lijn ~1209 `'Kan geen verbinding maken met de AI-server. Start de server met: cd server && npm start'` door: `'Er is een probleem met de verbinding. Probeer het later opnieuw of neem contact op met je docent.'`
  - Vervang alle `alert()` calls (lijn ~372, ~496) door inline foutmeldingen
  - Vervang `confirm()` (lijn ~447) door een custom modal-dialog

---

### SHOULD-FIX (Sprint 2)

#### 6. Setup-flow vereenvoudigen
**Bron:** Alle drie
**Probleem:** Twee aparte routes (instellingen vs. predefined scenario's) zijn verwarrend. Predefined scenario's missen leerdoel-koppeling.
**Voorstel:**
- Optie A: Predefined scenario's worden "startpunten" die de instellingen pre-fillen, waarna student nog leerdoel/niveau kiest
- Optie B: Stapsgewijze wizard (stap 1: kies scenario of stel in, stap 2: kies leerdoel, stap 3: kies niveau, stap 4: start)
- Aanbeveling: Optie A is het minst ingrijpend

---

#### 7. Responsive breakpoints toevoegen
**Bron:** UX #1 | Docent #8 | Student (extra)
**Probleem:** Slechts 1 breakpoint (520px). Op Chromebooks/tablets is de app een smal kolommetje.
**Voorstel:**
- Behoud 520px max-width voor chat-view (past bij chat-patroon)
- Setup-scherm en feedback-scherm: max-width verhogen naar 768px (tablet) en 1024px (desktop)
- Feedback-scherm op desktop: side-by-side layout met voldoende ruimte
- Feedback-scherm op mobiel: tab-interface (gesprek | feedback) i.p.v. gestapeld

---

#### 8. Leerdoelen groeperen en compacter weergeven
**Bron:** UX #9 | Docent (nuance)
**Probleem:** 10 leerdoelen in een platte lijst is overweldigend. Max-2 beperking is pas bij interactie zichtbaar.
**Voorstel:**
- Groepeer in categorieen: Basistechnieken (LSD, OMA/ANNA, NIVEA), Structuurtechnieken (SBAR, STARR, Klinisch Redeneren), Specialistisch (MGV, 4G-model, De-escalatie), Vrij (Vrije oefening)
- Chip/pill selectie i.p.v. checkboxes (compacter, touch-friendly)
- Toon "Maximaal 2" prominent boven de selectie

---

#### 9. Vervang alert()/confirm() door custom UI
**Bron:** UX #8
**Voorstel:** Inline error messages bij validatie, custom modal bij reset-bevestiging

---

#### 10. Gesprek afsluiten als vaardigheid
**Bron:** Docent #7 | Student (reactie)
**Probleem:** Er is geen optie om het gesprek netjes af te sluiten. Afsluiten (samenvatten, afspraken, afscheid) is een belangrijke vaardigheid die nu niet gestimuleerd wordt. Hangt samen met de voortgangsindicator in MUST-FIX #3.
**Voorstel:**
- Voeg een "Rond gesprek af" knop toe die na het aanbevolen minimum beurten verschijnt
- De AI reageert als client op het afscheid van de student
- Pas daarna verschijnt de Feedback-optie prominent
- Dit lost twee problemen op: studenten oefenen afsluiten EN weten wanneer ze klaar zijn

---

#### 11. Persistent help-knop in header
**Bron:** Docent #4 | Student #6 | UX-designer
**Probleem:** Het welkomblok verdwijnt na inklappen en is niet meer bereikbaar zodra het gesprek start. Nieuwe gebruikers missen instructies tijdens het gebruik.
**Voorstel:**
- Voeg een "?" icon-button toe in de header naast de Reset-knop
- Bij klik: toon de welkomst-inhoud als modal (hergebruik bestaande modal-component)
- Klein, niet opdringerig, altijd beschikbaar in elke schermstatus
- Vervangt de huidige inklapbare welkomstkaart op het setup-scherm

---

### NICE-TO-HAVE (Sprint 3+)

| # | Verbetering | Bron |
|---|-------------|------|
| 12 | Typing-dots animatie i.p.v. "denkt na..." | UX |
| 13 | Schermovergang-animaties (fade/slide) | UX |
| 14 | Toast/snackbar voor bevestigingsmeldingen | UX |
| 15 | Docentdashboard met klasoverzicht | Docent |
| 16 | iOS scroll-optimalisatie (overscroll-behavior) | UX |
| 17 | Typografie-hierarchie vereenvoudigen (3-4 stappen) | UX |

### UI Polish (Direct Request)

#### 18. Consistente en Nette UI (Leerdoelen + Algemeen)
**Bron:** User Feedback
**Probleem:**
- Leerdoel-vakken zijn ongelijk van hoogte/breedte ("rommeltje").
- Hover-randen zijn niet oranje (zijn nu blauw).
- Lettertypes voelen inconsistent.
**Voorstel:**
- **Layout:** Gebruik `display: grid` voor `.leerdoel-chips` zodat alle kaarten in een rij gelijke hoogte en breedte hebben.
- **Styling:** Update hover- en checked-states van Leerdoelen naar `var(--primary)` (Oranje) i.p.v. `--brand`.
- **Typografie:** Standardiseer font-gebruik. Headers `Plus Jakarta Sans`, Body `Inter`. Consistente font-weights/sizes.
- **Witruimte:** Consistente padding en margins in de kaarten.

---

## Niet in scope (bewust niet opgenomen)

- **Dark mode**: Genoemd door student, maar lage prioriteit voor een tool die primair in lesuren wordt gebruikt
- **Max leerdoelen verhogen**: Docent noemde dit, maar de beperking van 2 is didactisch verantwoord (focus)
- **Gespreksgeschiedenis over sessies heen**: Vereist backend/database, te groot voor dit plan

---

## Benodigde bestanden voor wijzigingen

| Bestand | Sprints |
|---------|---------|
| `src/style.css` | 1, 2 |
| `src/main.ts` | 1, 2 |
| `src/prompts/system-prompt.ts` | 2 (afsluitinstructie voor #10) |
| Nieuw: `src/print.css` (optioneel) | 1 |
| `personas.json` (leerdoel-koppeling) | 2 |
