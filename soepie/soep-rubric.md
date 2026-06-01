# SOEP-rubric en feedbacklogica

> Bron van waarheid voor de **inhoud** van de SOEP-rapportagemodus. Dit document is opgezet in het stramien van `src/knowledge/*.json` (zie `sbar.json`), zodat het later 1-op-1 naar `src/knowledge/soep.json` kan. Zie [[CONTEXT]] voor de kamerbeschrijving.
>
> **Let op, nog te bevestigen:** de inhoud hieronder is een eerste uitwerking. De voorbeeldzinnen en rubriekteksten willen we samen aanscherpen voordat dit naar code gaat. Open punten staan onderaan.

## Kern (mapt op de eerste velden van soep.json)

- **id:** `SOEP`
- **naam:** SOEP: gestructureerd rapporteren
- **korteUitleg:** Een methode om een zorgmoment kort en gestructureerd te rapporteren. Subjectief, Objectief, Evaluatie, Plan. Veel gebruikt in het ECD.

**uitgebreideTheorie:**

SOEP komt uit de probleemgerichte verslaglegging en wordt in de zorg gebruikt om een observatie of contactmoment compact vast te leggen. De vier letters dwingen je om feit en mening te scheiden, en om af te sluiten met een concrete vervolgstap.

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

## Twee feedbackdimensies

De feedback weegt twee dingen, met verschillend gewicht:

1. **Inspreektechniek (70%):** hoe de rapportage is ingesproken en geformuleerd.
2. **SOEP-structuur (30%):** of de inhoud juist over S, O, E en P is verdeeld.

Het primaire leerdoel is de techniek van inspreken. SOEP is het kapstokje, maar de tool traint vooral helder, zakelijk en vloeiend spreken voor een ECD.

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

De inspreektechniek-rubriek (Rubriek 1) past niet in het bestaande `rubric`-veld van het schema. Zie open punt 2.

## Open punten (samen beslissen voordat dit naar code gaat)

1. **`clientReactie` bij rapporteren.** Bij een gesprek reageert de AI-client; bij rapporteren niet. Opties: het veld leeg/weglaten, of het schema licht aanpassen zodat een kennisitem ook "alleen rapportage" kan zijn. Mijn voorstel: voor nu leeglaten en in de code afvangen.
2. **Twee rubrieken in plaats van één.** Het schema kent nu één `rubric`-lijst. We hebben er twee (techniek 70% en SOEP 30%). Opties: het schema uitbreiden met een gewicht of een tweede lijst, of de techniek-criteria in de serverprompt zetten en alleen de SOEP-rubriek in `soep.json`. Mijn voorstel: SOEP-rubriek in `soep.json`, techniek-criteria in de feedbackprompt, met het 70/30-gewicht expliciet benoemd in die prompt.
3. **Casusafhankelijke ijkpunten.** Sommige feedback (bijvoorbeeld of een meting klopt) hangt aan de casus. Dat regelen we via de casusbank, niet via deze rubric. Zie `casusbank.md` (volgende stap).
