# CONTEXT.md (Laag 2: de kamer "Soepie")

> Dit is de ontwerp- en inhoudskamer voor de **SOEP-rapportagemodus** binnen ZorgGesprek+.
> De code leeft in `src/` en `server/`. De kaart (Laag 1) is de `CLAUDE.md` in de root van dit project.
> Hier woont de **inhoud**: het concept, de casussen, de SOEP-rubric en de feedbacklogica.

## Wat we bouwen

Een tweede oefenmodus in ZorgGesprek+: niet een gesprek voeren met een client, maar een **rapportage inspreken** over een zorgmoment volgens de SOEP-methode (Subjectief, Objectief, Evaluatie, Plan). De student krijgt een casus, spreekt de rapportage in, en de AI geeft feedback.

Het verschil met de bestaande gespreksmodus: daar praat de student *met* iemand, hier rapporteert de student *over* iemand. Andere vaardigheid, ander moment, andere feedbacklogica. De infrastructuur (veilige Claude-proxy, spraak, kennisbank, styling) wordt gedeeld.

Twee leerdoelen, met gewicht:
- **Inspreektechniek (70%):** vloeiend, zakelijk, volledig en professioneel formuleren via spraak. Geschikt voor gebruik in een ECD met spraakherkenning.
- **SOEP-structuur (30%):** zijn S, O, E en P aanwezig, en staan de juiste dingen onder het juiste kopje?

## Doelgroep

MBO-zorgstudenten niveau 2 tot 4 (Verzorgende IG, Verpleegkunde, Helpende Zorg en Welzijn). Zij oefenen spraakrapportage als voorbereiding op het werken met ECD-systemen die spraakherkenning gebruiken.

## Hoe een geslaagd resultaat eruitziet

- De student kiest bij binnenkomst tussen "gesprek oefenen" en "rapportage oefenen" (heldere modus-splitsing, geen verwarring).
- De student krijgt een realistische casus op MBO-niveau, spreekt de rapportage in, en ziet de transcriptie.
- De AI-feedback volgt een vaste opbouw: eerst wat goed ging, dan een verbeterpunt techniek met voorbeeldzin, dan een korte SOEP-check, dan een uitnodiging om opnieuw te proberen of door te gaan.
- Feedback is constructief en begeleidend, op MBO-taalniveau. Geen cijfers, geen schoolse taal, geen lappen tekst.
- De SOEP-rubric in deze kamer is 1-op-1 te porten naar `src/knowledge/soep.json`, in hetzelfde stramien als de bestaande kennisbestanden.

## Wat we vermijden

- De rapportagemodus en de gespreksmodus door elkaar laten lopen in de UI. Ze delen techniek, maar zijn voor de gebruiker twee duidelijk gescheiden dingen.
- Cijfers of summatieve beoordeling. Dit is formatief: het gaat om leren.
- Feedback die te lang, te schools of te streng is.
- Inhoud (casussen, rubric, toon) in de codebestanden zetten. Die hoort hier. De code verwijst ernaar, andersom niet.
- De API-key in de browser. We gebruiken de bestaande serverproxy (Turnstile, sessietoken, key op de server). Zie de root-`CLAUDE.md`.

## Werkverdeling: waar woont wat

| Soort | Plek | Bron van waarheid |
|------|------|-------------------|
| Concept, casussen, SOEP-rubric, feedbacktoon | deze kamer (`soepie/`) | **inhoud** |
| Spraak, beveiliging, modus-routing, UI, prompts | `src/`, `server/` | **techniek** |
| Geporte rubric voor de bot | `src/knowledge/soep.json` (volgt) | afgeleide van `soep-rubric.md` |

## Bestanden in deze kamer

- `concept-soep-oefentool.md`: de oorspronkelijke conceptverkenning (v0.1). Uitgangspunt, niet de laatste waarheid. Let op: het concept ging nog uit van een losse statische pagina met de API-key in de browser. Dat is achterhaald; we bouwen als modus in ZorgGesprek+ met de bestaande serverproxy.
- `casusbank.md`: de zorgcasussen (volgende stap).
- `soep-rubric.md`: de SOEP-rubric en feedbacklogica in het kennisbank-stramien (volgende stap).

## Bouwstatus

- [x] Beslist: SOEP wordt een modus binnen ZorgGesprek+, geen losse bot.
- [x] Beslist: serverproxy hergebruiken, geen API-key in de browser.
- [x] Ontwerpkamer `soepie/` ingericht met deze `CONTEXT.md`.
- [x] Concept verplaatst naar deze kamer.
- [x] SOEP-rubric uitgewerkt in kennisbank-stramien (`soep-rubric.md`). Eerste versie, inhoud nog na te lopen.
- [x] Casusbank uitgewerkt (`casusbank.md`). Eerste versie, ijkpunten nog na te lopen.
- [ ] Bouwfase: rubric porten naar `src/knowledge/soep.json`.
- [ ] Bouwfase: regel toevoegen aan routeringstabel in root-`CLAUDE.md`.
- [ ] Bouwfase: scenariotype/modus voor rapportage toevoegen in de code.

## Verwante sporen (geen code-koppeling)

- **Spraakgestuurd rapporteren** (apart marketingplatform in de vault): deze oefentool kan daar later als lead magnet of databron voor dienen (fase 2 van dat masterplan). Dat koppelen we op distributieniveau, niet door codebases samen te voegen.
