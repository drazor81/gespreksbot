# CONTEXT.md (Laag 2: de kamer "Soepie")

> Dit is de ontwerp- en inhoudskamer voor de **SOEP-rapportagemodus** binnen ZorgGesprek+.
> De code leeft in `src/` en `server/`. De kaart (Laag 1) is de `CLAUDE.md` in de root van dit project.
> Hier woont de **inhoud**: het concept, de casussen, de SOEP-rubric en de feedbacklogica.

## Wat we bouwen

Een tweede oefenmodus in ZorgGesprek+: niet een gesprek voeren met een client, maar een **rapportage inspreken** over een zorgmoment volgens de SOEP-methode (Subjectief, Objectief, Evaluatie, Plan). De student krijgt een casus, spreekt de rapportage in, en de AI geeft feedback.

Het verschil met de bestaande gespreksmodus: daar praat de student *met* iemand, hier rapporteert de student *over* iemand. Andere vaardigheid, ander moment, andere feedbacklogica. De infrastructuur (veilige Claude-proxy, spraak, kennisbank, styling) wordt gedeeld.

Vier samenhangende competenties vormen de ruggengraat (onderbouwd in het kennisrapport, zie [[Kennisrapport_spraakgestuurd_rapporteren_SOEP_oefenbot]]):
- **Methodisch denken:** informatie ordenen volgens S, O, E en P; feit en mening scheiden.
- **Professioneel spreken:** vloeiend, zakelijk en volledig formuleren via spraak, geschikt voor een ECD met spraakherkenning.
- **AI-output controleren:** fouten in transcriptie en AI-concept herkennen en corrigeren (AI-geletterdheid).
- **Verantwoord handelen:** privacybewust werken, weten wanneer spraak wél en niet passend is, en eindverantwoordelijk blijven voor het dossier.

We bouwen **gefaseerd**, niet alles tegelijk. **Fase 1 (de buildbare MVP)** richt zich op spreken + denken, met de bekende weging inspreektechniek (70%) en SOEP-structuur (30%). De latere fasen voegen *controleren* (AI-foutdetectie) en *verantwoorden* (privacy- en contextscenario's) toe als eigen oefenstappen. Zo blijft Soepie toekomstbestendig en breed inzetbaar, terwijl er een concreet startpunt is dat snel kan draaien.

## Doelgroep

MBO-zorgstudenten niveau 2 tot 4 (Verzorgende IG, Verpleegkunde, Helpende Zorg en Welzijn). Zij oefenen spraakrapportage als voorbereiding op het werken met ECD-systemen die spraakherkenning gebruiken.

## Hoe een geslaagd resultaat eruitziet

- De student kiest bij binnenkomst tussen "gesprek oefenen" en "rapportage oefenen" (heldere modus-splitsing, geen verwarring).
- De student krijgt een realistische casus op MBO-niveau, spreekt de rapportage in, en ziet de transcriptie.
- De AI-feedback volgt een vaste opbouw: eerst wat goed ging, dan een verbeterpunt techniek met voorbeeldzin, dan een korte SOEP-check, dan een uitnodiging om opnieuw te proberen of door te gaan.
- Feedback is constructief en begeleidend, op MBO-taalniveau. Geen cijfers, geen schoolse taal, geen lappen tekst.
- De SOEP-rubric in deze kamer is 1-op-1 te porten naar `src/knowledge/soep.json`, in hetzelfde stramien als de bestaande kennisbestanden.

## Didactisch frame: handelingsverlegenheid

Het kennisrapport benoemt waaróm oefenen nodig is: studenten en professionals ervaren *handelingsverlegenheid* bij spraakgestuurd rapporteren. Elke ontwerpkeuze in deze kamer is terug te voeren op één van vijf vormen.

| Vorm | Wat de student voelt | Wat de tool ertegen doet |
|------|----------------------|--------------------------|
| Spreekverlegenheid | "Raar om hardop tegen een systeem te praten." | Kleine oefenstappen, voorbeeldzinnen, oefenstand zonder beoordeling. |
| Methodische verlegenheid | "Wat hoort nou bij S, O, E of P?" | Eerst ordenen, dan per onderdeel inspreken. |
| Sociale verlegenheid | "Wat als de cliënt of collega meeluistert?" | Contextscenario's: wanneer wel/niet hardop rapporteren. |
| Technologische verlegenheid | "Ik vertrouw dat transcript of AI-concept niet." | Transcript én concept tonen; foutdetectie oefenen. |
| Ethisch-juridische verlegenheid | "Mag dit wel, qua privacy en verantwoordelijkheid?" | Concrete regels, privacydilemma's, feedback op privacy. |

## Oefenladder (van laag naar hoog)

Het rapport stelt een opbouw voor van veilig naar complex. We nemen die over als ruggengraat van de tool. Fase 1 dekt niveau 1 tot en met 4; de latere fasen voegen 5 en 6 toe.

1. **Ordenen zonder spreken** — casusinformatie sorteren naar S/O/E/P. Drempel laag, structuur eerst.
2. **Eén zin per onderdeel** — alleen S inspreken, daarna O, E en P. Spreekdrempel plus methodische focus.
3. **Voorbeeldtaal aanpassen** — bot geeft een voorbeeldzin, student scherpt aan. Professionele taal aanleren.
4. **Volledige inspraak** — complete SOEP inspreken. Rubric op SOEP, taal en volledigheid.
5. **AI-output corrigeren** — bot toont een concept mét fouten, student spoort ze op (zie [[soep-rubric]] en [[casusbank]]). Controlevaardigheid en AI-geletterdheid.
6. **Contextscenario** — ruis, cliënt of familie erbij, privacydilemma, tijdsdruk. Student kiest: spreken, typen, later rapporteren of overleggen.

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

- `Kennisrapport_spraakgestuurd_rapporteren_SOEP_oefenbot.md`: de **onderbouwingslaag** (v1.0, 1 juni 2026). Bronnen-gestaafde kennisbasis (NHG, Vilans, JAMA, BMC-reviews, WHO, IGJ, EU AI Act) over spraakgestuurd rapporteren, ambient listening en handelingsverlegenheid, plus didactische vertaling, een evaluatie-/onderzoeksopzet en een factcheckmatrix. Geen bouwspec, maar het *waarom* en de evidence onder de ontwerpkeuzes. Hieruit komen het vier-competentiemodel, de oefenladder en het handelingsverlegenheid-frame.
- `concept-soep-oefentool.md`: de oorspronkelijke conceptverkenning (v0.1). Uitgangspunt, niet de laatste waarheid. Let op: het concept ging nog uit van een losse statische pagina met de API-key in de browser én een platte flow casus→inspreken→feedback. Beide zijn achterhaald; we bouwen als modus in ZorgGesprek+ met de bestaande serverproxy en de gefaseerde oefenladder hierboven.
- `casusbank.md`: de zorgcasussen, met SOEP-ijkpunten, valkuilen en (voor oefenstap 5) foutconcepten.
- `soep-rubric.md`: de SOEP-rubric en feedbacklogica in het kennisbank-stramien.

## Bouwstatus

- [x] Beslist: SOEP wordt een modus binnen ZorgGesprek+, geen losse bot.
- [x] Beslist: serverproxy hergebruiken, geen API-key in de browser.
- [x] Ontwerpkamer `soepie/` ingericht met deze `CONTEXT.md`.
- [x] Concept verplaatst naar deze kamer.
- [x] SOEP-rubric uitgewerkt in kennisbank-stramien (`soep-rubric.md`). Eerste versie, inhoud nog na te lopen.
- [x] Casusbank uitgewerkt (`casusbank.md`). Eerste versie, ijkpunten nog na te lopen.
- [x] Kennisbasis toegevoegd: kennisrapport met bronnen en factcheckmatrix.
- [x] Koers verbreed naar vier competenties (denken, spreken, controleren, verantwoorden) met gefaseerde bouw.
- [x] Oefenladder (6 niveaus) en handelingsverlegenheid-frame vastgelegd.
- [ ] Bouwfase 1: rubric porten naar `src/knowledge/soep.json` (oefenladder niveau 1–4).
- [ ] Bouwfase 1: regel toevoegen aan routeringstabel in root-`CLAUDE.md`.
- [ ] Bouwfase 1: scenariotype/modus voor rapportage toevoegen in de code.
- [ ] Bouwfase 2: AI-foutdetectie-oefenstap (oefenladder niveau 5) — foutconcepten uit `casusbank.md`, rubriekcriterium "controle AI-output".
- [ ] Bouwfase 3: privacy- en contextscenario's (oefenladder niveau 6).

## Verwante sporen (geen code-koppeling)

- **Spraakgestuurd rapporteren** (apart marketingplatform in de vault): deze oefentool kan daar later als lead magnet of databron voor dienen (fase 2 van dat masterplan). Dat koppelen we op distributieniveau, niet door codebases samen te voegen.
