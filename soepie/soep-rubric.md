# SOEP-rubric en feedbacklogica

> Bron van waarheid voor de **inhoud** van de SOEP-rapportagemodus. Dit document is opgezet in het stramien van `src/knowledge/*.json` (zie `sbar.json`), zodat het later 1-op-1 naar `src/knowledge/soep.json` kan. Zie [[CONTEXT]] voor de kamerbeschrijving.
>
> **Let op, nog te bevestigen:** de inhoud hieronder is een eerste uitwerking. De voorbeeldzinnen en rubriekteksten willen we samen aanscherpen voordat dit naar code gaat. Open punten staan onderaan.

## Kern (mapt op de eerste velden van soep.json)

- **id:** `SOEP`
- **naam:** SOEP: gestructureerd rapporteren
- **korteUitleg:** Een methode om een zorgmoment kort en gestructureerd te rapporteren. Subjectief, Objectief, Evaluatie, Plan. Veel gebruikt in het ECD.

**uitgebreideTheorie:**

SOEP komt uit de probleemgerichte verslaglegging en wordt in de zorg gebruikt om een observatie of contactmoment compact vast te leggen. Het NHG omschrijft SOEP als hulpmiddel voor een duidelijk verslag van een deelcontact, met de onderdelen Subjectief, Objectief, Evaluatie en Plan (NHG HIS-Referentiemodel; bron [1] in het kennisrapport). De vier letters dwingen je om feit en mening te scheiden, en om af te sluiten met een concrete vervolgstap.

- **S (Subjectief):** wat de cliënt zelf aangeeft, in zijn of haar eigen beleving. Klachten, gevoelens, wat iemand zegt. Voorbeeld: "Mevrouw geeft aan meer pijn te hebben dan gisteren."
- **O (Objectief):** wat jij waarneemt en meet. Feiten, observaties, metingen. Geen interpretatie. Voorbeeld: "De wond is rood en voelt warm aan. Temperatuur 37,8."
- **E (Evaluatie):** jouw inschatting op basis van S en O. Wat betekenen die bevindingen samen? Voorbeeld: "Mogelijk begin van een ontsteking."
- **P (Plan):** wat ga je doen of voorstellen. Een concrete, opvolgbare actie. Voorbeeld: "Arts gebeld, wond morgen opnieuw controleren."

De kracht van SOEP zit in het scheiden van **wat de cliënt zegt** (S) en **wat jij ziet** (O), en het onderbouwen van je **inschatting** (E) voordat je een **plan** (P) maakt.

## De vier onderdelen (mapt op `technieken`)

| Letter | Vraag die het beantwoordt |
|--------|---------------------------|
| Subjectief | Wat geeft de cliënt zelf aan? |
| Objectief | Wat neem ik waar en meet ik? |
| Evaluatie | Wat is mijn inschatting op basis van S en O? |
| Plan | Wat ga ik doen of voorstellen? |

## Feedbackdimensies (gefaseerd)

Soepie is verbreed naar vier competenties (denken, spreken, controleren, verantwoorden; zie [[CONTEXT]] en het kennisrapport). De rubric volgt de oefenladder en groeit gefaseerd mee.

**Fase 1 (oefenladder niveau 1–4)** weegt twee dingen, met verschillend gewicht:

1. **Inspreektechniek (70%):** hoe de rapportage is ingesproken en geformuleerd. Zie Rubriek 1.
2. **SOEP-structuur (30%):** of de inhoud juist over S, O, E en P is verdeeld. Zie Rubriek 2.

In fase 1 is het primaire leerdoel de techniek van inspreken. SOEP is het kapstokje, maar de tool traint vooral helder, zakelijk en vloeiend spreken voor een ECD.

**Fase 2 (oefenladder niveau 5)** voegt een derde dimensie toe: **controle van AI-output** (Rubriek 3). Hier verschuift de weging naar het opsporen en corrigeren van fouten in een AI-concept.

**Fase 3 (oefenladder niveau 6)** voegt **privacy en contextkeuze** toe (Rubriek 4): kiest de student de juiste werkwijze en deelt die alleen wat nodig is.

## Rubriek 1: Inspreektechniek (70%)

| Criterium | Onvoldoende | Voldoende | Goed |
|-----------|-------------|-----------|------|
| Vloeiendheid | Veel haperingen, twijfelgeluiden (uh, eh), herhalingen of valse starts | Spreekt grotendeels door, met enkele haperingen | Vloeiend en rustig ingesproken, weinig tot geen haperingen |
| Volledige zinnen | Losse woorden of halve zinnen, moeilijk te volgen | Meeste zinnen zijn af, enkele onvolledig | Hele, grammaticaal lopende zinnen |
| Zakelijk taalgebruik | Omgangstaal of waardeoordelen ("deed raar", "beetje zielig") | Overwegend zakelijk, soms informeel | Professioneel, objectief en respectvol geformuleerd |
| Bruikbaar voor ECD | Onduidelijk, te lang of niet navolgbaar | Begrijpelijk maar kan beknopter of strakker | Beknopt, duidelijk en direct bruikbaar als rapportage |

## Rubriek 2: SOEP-structuur (30%) (mapt op `rubric`)

| Criterium | Onvoldoende | Voldoende | Goed |
|-----------|-------------|-----------|------|
| Subjectief | Geen weergave van wat de cliënt zelf aangeeft | Noemt de beleving van de cliënt, maar onvolledig | Geeft helder weer wat de cliënt zelf aangeeft, in diens beleving |
| Objectief | Geen eigen waarnemingen of metingen | Noemt enkele observaties, mist concrete metingen | Geeft concrete, feitelijke observaties en metingen, zonder interpretatie |
| Evaluatie | Geen inschatting, of mening zonder onderbouwing | Doet een inschatting maar koppelt die los van S en O | Onderbouwt de inschatting duidelijk vanuit S en O |
| Plan | Geen vervolgactie genoemd | Vaag plan zonder concrete actie | Concreet en opvolgbaar plan |

> Veelgemaakte verwisseling om op te letten: een mening of interpretatie onder **O** zetten ("mevrouw is verward") in plaats van onder **E**. Onder O hoort de waarneming ("mevrouw herkende haar dochter niet en vroeg meermaals wanneer ze naar huis mag").

## Rubriek 3: Controle van AI-output (fase 2, oefenladder niveau 5)

Bij oefenstap 5 toont de bot een AI-gegenereerd SOEP-concept met bewust ingebouwde fouten (zie de foutconcepten in [[casusbank]]). De student moet die opsporen en corrigeren. Dit traint AI-geletterdheid: de gebruiker blijft eindverantwoordelijk voor wat in het dossier komt (WHO, IGJ, EU AI Act; bronnen [14-16] in het kennisrapport).

| Criterium | Onvoldoende | Voldoende | Goed |
|-----------|-------------|-----------|------|
| Transcriptiefouten | Verkeerde naam, getal, dosering of tijd blijft staan | Sommige fouten gevonden, kritische gemist | Alle namen, getallen, doseringen en tijden gecontroleerd en gecorrigeerd |
| Toegevoegde details | Neemt verzonnen of niet-ingesproken details over | Merkt iets op maar laat een toevoeging staan | Herkent en verwijdert details die niet zijn ingesproken |
| Verkeerde SOEP-plaatsing | Mening onder O of feit onder E blijft staan | Verbetert deels | Zet elk onderdeel onder het juiste kopje |
| Ontkenningen | Mist een omgedraaide ontkenning ("geen pijn" wordt "pijn") | Twijfelt maar corrigeert niet altijd | Controleert ontkenningen expliciet |

> Bekende risicocategorieën om de bot expliciet op te laten wijzen: **namen, doseringen, tijdstippen, ontkenningen en toegevoegde details** (AI Zorg Academy en systematische review; bronnen [2,7]).

## Rubriek 4: Privacy en contextkeuze (fase 3, oefenladder niveau 6)

Bij oefenstap 6 oefent de student met de keuze *of* en *hoe* je hardop rapporteert (ruis, cliënt of familie erbij, privacydilemma, tijdsdruk).

| Criterium | Onvoldoende | Voldoende | Goed |
|-----------|-------------|-----------|------|
| Contextkeuze | Spreekt altijd in, ongeacht de situatie | Twijfelt, kiest niet bewust | Kiest passend: spreken, typen, later rapporteren of overleggen |
| Dataminimalisatie | Noemt onnodige of herleidbare persoonsgegevens | Grotendeels passend, nog te veel detail | Deelt alleen wat nodig is voor zorgcontinuïteit |
| Verantwoordelijkheidsbesef | Vertrouwt blind op AI-output | Noemt controle maar handelt er niet naar | Benoemt en neemt eindverantwoordelijkheid voor het dossier |

## Voorbeelden (mapt op `voorbeeldenGoed` / `voorbeeldenFout`)

**Goed ingesproken (techniek):**
- "Mevrouw geeft aan vannacht slecht geslapen te hebben door pijn in haar linkerbeen."
- "Bij inspectie zie ik een rode plek op het scheenbeen, ongeveer zo groot als een twee-euromunt. De huid voelt warm aan."
- "Mogelijk een beginnende ontsteking, mede doordat ze haar steunkousen niet heeft gedragen."
- "Ik heb dit doorgegeven aan de verpleegkundige en controleer de wond vanmiddag opnieuw."

**Fout ingesproken (techniek):**
- "Uh ja, die mevrouw, eh, die had dus pijn ofzo aan haar been." (haperingen, omgangstaal, vaag)
- "Rood plekje been warm." (losse woorden, geen hele zin)
- "Ze deed een beetje zielig vandaag." (waardeoordeel, niet objectief)

## Coachpunten (mapt op `coachTips`)

- Let vooral op de inspreektechniek: vloeiendheid, hele zinnen, zakelijk taalgebruik.
- Check daarnaast of S, O, E en P alle vier herkenbaar zijn.
- Let op of feit (O) en mening (E) gescheiden blijven.
- Geef altijd minstens één concreet sterk punt terug.
- Geef maximaal één verbeterpunt techniek per keer, met een voorbeeldzin die laat zien hoe het beter kan.

## Feedbackopbouw (leeft straks in een serverprompt, niet in soep.json)

Elke feedbackronde heeft vaste onderdelen, in deze volgorde:

1. **Wat ging goed:** één concreet sterk punt.
2. **Techniek:** één verbeterpunt over hoe is ingesproken of geformuleerd, met een voorbeeldzin.
3. **SOEP-check:** kort, maximaal twee zinnen. Wat ontbreekt of wat is sterk.
4. **Uitnodiging:** korte aanmoediging, en de vraag of de student opnieuw wil proberen of een nieuwe casus wil.

**Toon en grenzen:** positief, direct, MBO-taalniveau. Geen cijfers. Geen schoolse taal. Maximaal ongeveer 150 woorden. In het Nederlands.

## Mapping naar soep.json

| Veld in soep.json | Vul met |
|-------------------|---------|
| `id`, `naam`, `korteUitleg`, `uitgebreideTheorie` | de "Kern" hierboven |
| `technieken` | de vier onderdelen (S, O, E, P) |
| `voorbeeldenGoed`, `voorbeeldenFout` | de voorbeelden hierboven |
| `coachTips` | de coachpunten |
| `rubric` | Rubriek 2 (SOEP-structuur) |
| `clientReactie` | **Niet van toepassing bij rapporteren.** Zie open punt 1. |

Alleen Rubriek 2 (SOEP-structuur) gaat naar het `rubric`-veld. Rubriek 1 (techniek), Rubriek 3 (controle AI-output) en Rubriek 4 (privacy/context) leven in de serverprompts per oefenstap, niet in `soep.json`. Zie open punt 2.

## Open punten (samen beslissen voordat dit naar code gaat)

1. **`clientReactie` bij rapporteren.** Bij een gesprek reageert de AI-client; bij rapporteren niet. Opties: het veld leeg/weglaten, of het schema licht aanpassen zodat een kennisitem ook "alleen rapportage" kan zijn. Mijn voorstel: voor nu leeglaten en in de code afvangen.
2. **Meerdere rubrieken in plaats van één.** Het schema kent één `rubric`-lijst; wij hebben er nu vier (techniek, SOEP, controle AI-output, privacy/context). Voorstel: alleen de SOEP-rubriek in `soep.json`; de overige rubrieken in de serverprompt per oefenstap, met de fase-gebonden weging expliciet benoemd (fase 1: 70/30 techniek/SOEP). Zo blijft het schema ongewijzigd terwijl de tool gefaseerd kan groeien.
3. **Casusafhankelijke ijkpunten.** Sommige feedback (bijvoorbeeld of een meting klopt) hangt aan de casus. Dat regelen we via de casusbank, niet via deze rubric. Zie [[casusbank]].
4. **Foutconcepten voor oefenstap 5.** De AI-foutdetectie heeft per casus een concept met bewust ingebouwde fouten nodig. Die staan in [[casusbank]] (veld `foutConcept`). Te bevestigen: hoeveel en welke fouttypen per casus, en of de bot ze willekeurig combineert of vast aanbiedt.
