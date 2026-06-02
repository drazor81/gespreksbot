# Casusbank SOEP-oefentool

> Bron van waarheid voor de **casussen**. Elke casus heeft een casustekst (die de student ziet) plus SOEP-ijkpunten en een valkuil (die de feedbackmotor gebruikt, maar die de student niet vooraf ziet). Zie [[CONTEXT]] en [[soep-rubric]].
>
> **Te bevestigen:** de modeluitwerkingen (ijkpunten) zijn een eerste, redelijke invulling op basis van de casustekst. Loop ze inhoudelijk na: klopt de zorginhoud, en zijn de ijkpunten realistisch voor MBO-niveau 2 tot 4?

## Hoe een casus is opgebouwd (mapt later op een JSON-array)

| Veld | Betekenis | Zichtbaar voor student? |
|------|-----------|--------------------------|
| `id` | volgnummer | nee |
| `naam` | cliëntnaam | ja |
| `setting` | werkveld (thuiszorg, verpleeghuis...) | ja |
| `niveau` | indicatie MBO-niveau | nee |
| `moeilijkheid` | makkelijk / gemiddeld / lastig, op basis van hoe verweven feit en mening zijn | nee |
| `casustekst` | de situatiebeschrijving | ja |
| `soepIjkpunten` | wat idealiter onder S, O, E, P hoort | nee (feedback) |
| `valkuil` | de meest waarschijnlijke fout bij deze casus | nee (feedback) |
| `foutConcept` | een AI-concept mét bewust ingebouwde fouten, voor oefenstap 5 | gedeeltelijk (de tekst wel, de foutenlijst niet) |
| `contextvariant` | optionele aankleding voor oefenstap 6 (ruis, cliënt erbij, privacydilemma) | ja, indien gebruikt |

De student spreekt de rapportage in op basis van de `casustekst`. De feedbackmotor vergelijkt met `soepIjkpunten` en let extra op de `valkuil`. Bij **oefenstap 5 (AI-output corrigeren)** toont de bot het `foutConcept` en moet de student de ingebouwde fouten opsporen; de verborgen foutenlijst stuurt de feedback. Bij **oefenstap 6 (contextscenario)** wordt de casus aangekleed met een `contextvariant`. Zie [[CONTEXT]] (oefenladder) en [[soep-rubric]] (Rubriek 3 en 4).

---

## Casus 1 - Mevrouw Van Dam

- **Setting:** thuiszorg
- **Niveau:** 2 tot 4
- **Moeilijkheid:** makkelijk (feit en mening zijn redelijk te scheiden)

**Casustekst:**
Mevrouw Van Dam, 78 jaar, thuiszorg. Klaagt over pijn in haar linkerbeen bij het lopen. Bij inspectie zie je een rode plek ter grootte van een twee-euromunt op het linkerscheenbeen. De huid voelt warm aan. Ze heeft gisterenochtend haar steunkousen niet aangehad omdat ze "te strak zaten".

**SOEP-ijkpunten:**
- **S:** mevrouw geeft aan pijn te hebben in haar linkerbeen bij het lopen; zegt dat de steunkousen te strak zaten.
- **O:** rode plek ter grootte van een twee-euromunt op het linkerscheenbeen; de huid voelt warm aan; mevrouw heeft gisterochtend de steunkousen niet gedragen.
- **E:** mogelijk een beginnende huidirritatie of ontsteking, mogelijk samenhangend met het niet dragen van de steunkousen.
- **P:** doorgeven aan de verpleegkundige; de huid later opnieuw controleren; het dragen van de steunkousen met mevrouw bespreken.

**Valkuil:** "rood en warm" zijn waarnemingen (O). "Ontstoken" is een inschatting (E). De student moet die niet door elkaar halen.

**Foutconcept (oefenstap 5):**
> S: Mevrouw Van Dam geeft aan pijn te hebben in haar rechterbeen bij het lopen.
> O: Rode plek op het scheenbeen; de huid is ontstoken.
> E: Beginnende ontsteking doordat ze haar steunkousen heeft gedragen.
> P: Doorgegeven aan de verpleegkundige; de huid later opnieuw controleren.

*Ingebouwde fouten (verborgen):* (1) "rechterbeen" moet linkerbeen zijn — zijde-/transcriptiefout; (2) "is ontstoken" is een inschatting en hoort onder E, niet onder O; (3) omgedraaide oorzaak — ze heeft de steunkousen juist *niet* gedragen.

**Contextvariant (oefenstap 6):** je staat bij mevrouw in de woonkamer terwijl haar dochter op bezoek is. Spreek je hier hardop in, of kies je een ander moment of een andere werkwijze?

---

## Casus 2 - De heer Jansen

- **Setting:** verpleeghuis
- **Niveau:** 2 tot 4
- **Moeilijkheid:** gemiddeld (verwardheid verleidt tot interpretatie onder O)

**Casustekst:**
De heer Jansen, 84 jaar, verpleeghuis. Heeft tijdens de lunch slecht gegeten (minder dan een kwart van zijn bord). Herkende zijn dochter niet tijdens bezoek. Is onrustig geweest en heeft meerdere keren gevraagd "wanneer hij naar huis mag". Bloeddruk 145/90, temperatuur normaal.

**SOEP-ijkpunten:**
- **S:** meneer vraagt meermaals wanneer hij naar huis mag.
- **O:** at minder dan een kwart van zijn bord; herkende zijn dochter niet; onrustig gedrag; bloeddruk 145/90; temperatuur normaal.
- **E:** mogelijk toegenomen verwardheid of desoriëntatie; de verminderde voedingsinname is een aandachtspunt.
- **P:** intake en oriëntatie blijven observeren; melden bij de verpleegkundige of arts; mogelijke oorzaak van de verwardheid laten beoordelen.

**Valkuil:** "verward" is een interpretatie (E). De waarneming (O) is concreet: herkende zijn dochter niet en vroeg meermaals wanneer hij naar huis mag.

**Foutconcept (oefenstap 5):**
> S: Meneer Jansen vraagt meermaals wanneer hij naar huis mag.
> O: At minder dan een kwart van zijn bord; herkende zijn dochter; bloeddruk 154/90; temperatuur normaal.
> E: Mogelijk toegenomen verwardheid; de verminderde inname is een aandachtspunt.
> P: Intake en oriëntatie blijven observeren; melden bij de verpleegkundige of arts.

*Ingebouwde fouten (verborgen):* (1) "herkende zijn dochter" — omgedraaide ontkenning, moet "herkende zijn dochter niet"; (2) bloeddruk 154/90 moet 145/90 zijn — getalfout; (3) "verward" mag niet als losse term onder O sluipen, dat is een inschatting (E).

**Contextvariant (oefenstap 6):** het is druk in de huiskamer en andere bewoners en bezoek zitten dichtbij. Hardop rapporteren hier, of niet?

---

## Casus 3 - Youssef

- **Setting:** gehandicaptenzorg (licht verstandelijke beperking)
- **Niveau:** 2 tot 4
- **Moeilijkheid:** gemiddeld (emotie verleidt tot oordeel onder O)

**Casustekst:**
Youssef, 32 jaar, gehandicaptenzorg. Had vanmiddag een conflict met een medebewoner over de televisie. Schreeuwde en gooide een kussen. Is nu rustig op zijn kamer, reageert kort, maakt geen oogcontact. Geeft aan "het niet meer te willen uitleggen".

**SOEP-ijkpunten:**
- **S:** Youssef geeft aan "het niet meer te willen uitleggen".
- **O:** had een conflict met een medebewoner over de televisie; schreeuwde en gooide een kussen; is nu rustig op zijn kamer; reageert kort; maakt geen oogcontact.
- **E:** lijkt teruggetrokken en gespannen na het incident; mogelijk schaamte of frustratie.
- **P:** rust geven en later terugkomen voor een gesprek; het incident melden; afspraken over tv-gebruik bespreken.

**Valkuil:** "boos" of "gefrustreerd" is een inschatting (E). Onder O hoort het waarneembare gedrag: schreeuwen, kussen gooien, kort reageren, geen oogcontact.

**Foutconcept (oefenstap 5):**
> S: Youssef geeft aan het niet meer te willen uitleggen.
> O: Had een conflict over de televisie; was erg boos en agressief; is nu rustig op zijn kamer; reageert kort.
> E: Lijkt teruggetrokken na het incident; mogelijk schaamte of frustratie.
> P: Rust geven en later terugkomen; het incident melden; medicatie aanpassen.

*Ingebouwde fouten (verborgen):* (1) "erg boos en agressief" is een oordeel onder O; de waarneming is: schreeuwde en gooide een kussen; (2) "medicatie aanpassen" is een toegevoegd, niet-ingesproken detail dat bovendien buiten de bevoegdheid valt.

**Contextvariant (oefenstap 6):** een medebewoner loopt mee de gang op terwijl je over het incident wilt rapporteren. Hoe ga je daarmee om?

---

## Casus 4 - Mevrouw Okeke

- **Setting:** wijkverpleging
- **Niveau:** 2 tot 4
- **Moeilijkheid:** lastig (subjectief en objectief spreken elkaar tegen)

**Casustekst:**
Mevrouw Okeke, 67 jaar, wijkverpleging. Wond aan het linker onderbeen na een operatie 12 dagen geleden. Het wondvocht is licht toegenomen ten opzichte van gisteren en is gelig van kleur. De omliggende huid is niet rood. Mevrouw geeft aan minder pijn te hebben dan gisteren en slaapt weer beter.

**SOEP-ijkpunten:**
- **S:** mevrouw geeft aan minder pijn te hebben dan gisteren en weer beter te slapen.
- **O:** wond aan het linker onderbeen, 12 dagen na de operatie; wondvocht licht toegenomen ten opzichte van gisteren, gelig van kleur; omliggende huid niet rood.
- **E:** gemengd beeld: pijn en slaap verbeteren, maar het toegenomen, gelige wondvocht vraagt aandacht (mogelijk teken van infectie, al is de huid niet rood).
- **P:** de wond blijven observeren; de toename en kleur van het wondvocht melden aan de verpleegkundige of arts; vervolgcontrole afspreken.

**Valkuil:** de signalen spreken elkaar deels tegen. Subjectief gaat het beter (S), objectief is er een aandachtspunt (O). Alleen "het gaat goed" rapporteren mist de toename van het wondvocht.

**Foutconcept (oefenstap 5):**
> S: Mevrouw Okeke geeft aan minder pijn te hebben en weer beter te slapen.
> O: Wond aan het linker onderbeen; wondvocht gelig; de omliggende huid is rood.
> E: Het gaat de goede kant op.
> P: De wond blijven observeren.

*Ingebouwde fouten (verborgen):* (1) "huid is rood" — omgedraaide waarneming, de huid is juist *niet* rood; (2) weggelaten kritisch gegeven: het wondvocht is *toegenomen* ten opzichte van gisteren; (3) de evaluatie "het gaat de goede kant op" is te geruststellend en mist het aandachtspunt.

**Contextvariant (oefenstap 6):** je loopt achter op je route en hebt nog drie cliënten te gaan. Verleidt die tijdsdruk je tot te kort of te snel rapporteren?

---

## Casus 5 - Stefan

- **Setting:** jeugdzorg (gezinshuis)
- **Niveau:** 2 tot 4
- **Moeilijkheid:** lastig (weinig S; verleidt tot invullen/verzinnen)

**Casustekst:**
Stefan, 16 jaar, jeugdzorg. Is vandaag niet op school geweest zonder melding. Thuisgekomen om 16:30, reageert kort op vragen, maakt geen oogcontact. Trekt zich terug op zijn kamer. Heeft bij het avondeten wel mee gegeten, maar zegt niets.

**SOEP-ijkpunten:**
- **S:** Stefan zegt niets en geeft niets aan. Dat er weinig subjectieve informatie is, is op zich een observatie waard.
- **O:** niet op school geweest zonder melding; thuisgekomen om 16:30; reageert kort; geen oogcontact; trekt zich terug op zijn kamer; heeft wel mee gegeten.
- **E:** mogelijk speelt er iets (bijvoorbeeld op school of qua stemming); het teruggetrokken gedrag is een signaal om serieus te nemen.
- **P:** laagdrempelig contact en beschikbaar zijn; gedrag observeren; overleggen met mentor of gedragswetenschapper; het schoolverzuim navragen.

**Valkuil:** er is weinig S beschikbaar. De student moet niet verzinnen wat Stefan "voelt". Een aanname onder S invullen is hier de fout.

**Foutconcept (oefenstap 5):**
> S: Stefan vertelt dat hij ruzie had op school en zich somber voelt.
> O: Niet op school geweest zonder melding; thuisgekomen om 16:30; reageert kort; geen oogcontact; heeft wel mee gegeten.
> E: Mogelijk speelt er iets; het teruggetrokken gedrag is serieus te nemen.
> P: Laagdrempelig contact houden; gedrag observeren; overleggen met de mentor.

*Ingebouwde fouten (verborgen):* (1) de volledige S is verzonnen — Stefan heeft niets verteld. Dit is een AI-hallucinatie die de student niet mag overnemen; juist hier hoort: "Stefan geeft niets aan."

**Contextvariant (oefenstap 6):** de mentor vraagt in de groepsapp van het team wat er met Stefan aan de hand is. Wat deel je daar wel en niet, en waarom?

---

## Open punten

1. **Aantal en spreiding.** Vijf casussen over vijf werkvelden (thuiszorg, verpleeghuis, gehandicaptenzorg, wijkverpleging, jeugdzorg). Uitbreidbaar. Willen we per werkveld meer, of juist meer variatie in moeilijkheid?
2. **Moeilijkheidsgradatie.** Toegevoegd op basis van het kennisrapport: elke casus heeft nu een label (makkelijk/gemiddeld/lastig) afhankelijk van hoe verweven feit en mening zijn. Te bevestigen: kloppen de labels, en willen we de oefenladder hieraan koppelen (eerst makkelijk, dan lastig)?
3. **Inhoudelijke check.** De ijkpunten én de foutconcepten zijn door mij afgeleid uit de casustekst. Iemand met zorgkennis (jij) zou ze moeten nalopen op juistheid en toon — vooral of de ingebouwde fouten realistisch en eenduidig zijn.
4. **Foutconcepten (oefenstap 5).** Elke casus heeft nu één `foutConcept` met 1 tot 3 ingebouwde fouten. Te bevestigen: willen we meer varianten per casus, een vaste set fouttypen (zijde, getal, ontkenning, mening-onder-O, hallucinatie, weglaten), en biedt de bot ze vast of willekeurig aan? Zie ook open punt 4 in [[soep-rubric]].
5. **Contextvarianten (oefenstap 6).** Elke casus heeft een eerste `contextvariant`. Te bevestigen: dekken ze samen de relevante dilemma's (meeluisteren, tijdsdruk, privacy/delen) voldoende af?
6. **Porten naar code.** Later wordt dit een JSON-array (bijvoorbeeld `src/knowledge/soep-casussen.json` of een scenariobron), met de velden uit de tabel bovenaan, inclusief `moeilijkheid`, `foutConcept` en `contextvariant`.
