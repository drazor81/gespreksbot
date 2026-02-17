# Gezamenlijk Verbeterplan: ZorgGesprek+

*Samengesteld op basis van drie perspectieven: Student, Docent en Expert Coder*

---

## Eindoordeel per perspectief

| Perspectief | Oordeel |
|---|---|
| **Student** | Goed en bruikbaar hulpmiddel. Realistisch en herkenbaar. Mist begeleiding bij eerste gebruik en feedback-export. |
| **Docent** | Didactisch sterk en inhoudelijk correct (8.5/10). Mist portfolio-integratie, self-assessment en docentenomgeving. |
| **Expert Coder** | Functioneel prototype met sterke prompt engineering. Mist security hardening, modulaire architectuur en tests. |

---

## Fase 1: Kritiek & Beveiliging (HOOG) - AFGEROND

*Direct oppakken - betreft veiligheid en bruikbaarheid*

| # | Actie | Bron | Impact | Status |
|---|---|---|---|---|
| 1.1 | **CORS beperken tot eigen frontend-origin** | Coder | Voorkomt API-misbruik | Done |
| 1.2 | **Rate limiting toevoegen** (express-rate-limit) | Coder | Budget-bescherming | Done |
| 1.3 | **Input validatie op /api/chat** | Coder | Voorkomt crashes en misbruik | Done |
| 1.4 | **XSS-preventie in addMessage()** - `innerHTML` vervangen door veilige methode | Coder | Beveiligingsrisico | Done |
| 1.5 | **Ongebruikte dependencies verwijderen** (lodash, lucide-static) | Coder | Kleinere bundle | Done |
| 1.6 | **Bevestigingsdialoog bij Reset-knop** | Student | Voorkomt dataverlies | Done |

---

## Fase 2: Gebruikerservaring & Onboarding (HOOG) - AFGEROND

*Grootste impact op dagelijks gebruik door studenten*

| # | Actie | Bron | Impact | Status |
|---|---|---|---|---|
| 2.1 | **Welkomstscherm/introductie toevoegen** | Student | Verlaagt instapdrempel | Done |
| 2.2 | **Tooltips bij leerdoelen** - korte uitleg per afkorting | Student + Docent | Zelfsturend leren | Done |
| 2.3 | **Meer vooraf ingestelde scenario's** (8 i.p.v. 2) | Student | Sneller starten | Done |
| 2.4 | **Theorie ook VOOR het gesprek beschikbaar** maken | Student + Docent | Didactisch beter | Done |
| 2.5 | **Checklist/geheugensteuntje** zichtbaar tijdens het gesprek | Student | Betere toepassing technieken | Done |
| 2.6 | **Debounce op verstuurknop** | Coder | Voorkomt dubbele berichten | Done |

---

## Fase 3: Feedback & Leerrendement (MIDDEN) - AFGEROND

*Vergroot het leereffect aanzienlijk*

| # | Actie | Bron | Impact | Status |
|---|---|---|---|---|
| 3.1 | **Feedback exporteerbaar maken** (PDF/tekst/kopieerknop) | Student + Docent | Portfolio-integratie | Done |
| 3.2 | **Self-assessment stap VOOR automatische feedback** | Docent | Reflectievaardigheid | Done |
| 3.3 | **Visuele feedbacksamenvatting** (tabel of score per techniek-element) | Student + Docent | Overzichtelijker | Done |
| 3.4 | **Rubrics per leerdoel** toevoegen aan kennisbank | Docent | Studenten weten waarop ze beoordeeld worden | Done |
| 3.5 | **"Vrije oefening" aanpassen** - basis LSD altijd meegeven | Docent | Altijd feedback op basisvaardigheden | Done |
| 3.6 | **Feedback-layout fixen** (CSS bug: column vs. row op groot scherm) | Coder | UI-bug | Done |

---

## Fase 4: Code-architectuur (MIDDEN) - AFGEROND

*Maakt de codebase onderhoudbaar en uitbreidbaar*

| # | Actie | Bron | Impact | Status |
|---|---|---|---|---|
| 4.1 | **`main.ts` opsplitsen** in modules: types, config, state, api, speech, chat, ui | Coder | Onderhoudbaarheid | Done |
| 4.2 | **State centraliseren** in een state-object met setState/getState | Coder | Debugbaarheid, race conditions | Done |
| 4.3 | **ESLint + Prettier configureren** | Coder | Code-consistentie | Done |
| 4.4 | **Server naar TypeScript migreren** | Coder | Type-safety hele stack | Done |
| 4.5 | **Foutmeldingen generiek maken** (geen error.message naar client) | Coder | Security | Done |
| 4.6 | **Dubbele font-import verwijderen** | Coder | Performance | Done |
| 4.7 | **Opruimen** - counter.ts, prompt-v1-backup.ts, package hernoemen | Coder | Schone codebase | Done |

---

## Fase 5: Didactische uitbreiding (LAAG/MIDDEN) - TODO

*Maakt de bot completer als onderwijsmiddel*

| # | Actie | Bron | Impact |
|---|---|---|---|
| 5.1 | **Lokale voortgangsregistratie** (localStorage) - welke leerdoelen geoefend | Student + Docent | Zelfinzicht |
| 5.2 | **Meer scenariotypes** - ADL-zorg, palliatief, mantelzorgsamenwerking | Student + Docent | Breder oefen-aanbod |
| 5.3 | **Culturele sensitiviteit als leerdoel** | Docent | Actueel thema |
| 5.4 | **Ethische dilemma-scenario's** | Docent | Verdieping curriculum |
| 5.5 | **MGV verrijken** - ambivalentie, fasen van gedragsverandering expliciet | Docent | Inhoudelijke verdieping |
| 5.6 | **"Probeer opnieuw"-optie na feedback** | Student | Herhaaloefening |

---

## Fase 6: Toekomstvisie (LAAG) - TODO

*Langetermijn-verbeteringen*

| # | Actie | Bron | Impact |
|---|---|---|---|
| 6.1 | **Docentenomgeving** - gesprekken inzien, voortgang volgen, lessets maken | Docent | Integratie in onderwijs |
| 6.2 | **Scenario-pakketten per les** (via link of code) | Docent | Eenvoudige uitrol |
| 6.3 | **Dark mode** | Coder | Toegankelijkheid |
| 6.4 | **Meerdere CSS breakpoints** (tablet, desktop) | Coder + Student | Responsiveness |
| 6.5 | **Unit tests** voor kernfuncties | Coder | Regressie-preventie |
| 6.6 | **Peer-feedback mogelijkheid** | Docent | Samenwerkend leren |
| 6.7 | **`max_tokens` configureerbaar** per context | Coder | Feedback-kwaliteit |

---

## Prioriteitsschema

- **HOOG**: Fase 1 & 2 (beveiliging, gebruikerservaring)
- **MIDDEN**: Fase 3 & 4 (feedback, architectuur)
- **LAAG/MIDDEN**: Fase 5 (didactische uitbreiding)
- **LAAG**: Fase 6 (toekomstvisie)

## Aanbevolen implementatie-volgorde

1. ~~**Fase 1** (beveiliging) - essentieel voor productiegebruik~~ AFGEROND
2. ~~**Fase 2** (onboarding) - vergroot direct de bruikbaarheid~~ AFGEROND
3. ~~**Fase 3 + 4 samen** - feedback-export en code-opsplitsing in dezelfde sprint~~ AFGEROND
4. **Fase 5 + 6** - planmatig uitbreiden op basis van gebruikersfeedback

## Bronverdeling

- **Student-perspectief**: items gericht op gebruikerservaring (onboarding, scenarios, UI)
- **Docent-perspectief**: items gericht op onderwijs-integratie (feedback, self-assessment, rubrics)
- **Coder-perspectief**: items gericht op technische kwaliteit (security, architectuur, tests)
