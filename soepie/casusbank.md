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
| `casustekst` | de situatiebeschrijving | ja |
| `soepIjkpunten` | wat idealiter onder S, O, E, P hoort | nee (feedback) |
| `valkuil` | de meest waarschijnlijke fout bij deze casus | nee (feedback) |

De student spreekt de rapportage in op basis van de `casustekst`. De feedbackmotor vergelijkt met `soepIjkpunten` en let extra op de `valkuil`.

---

## Casus 1 - Mevrouw Van Dam

- **Setting:** thuiszorg
- **Niveau:** 2 tot 4

**Casustekst:**
Mevrouw Van Dam, 78 jaar, thuiszorg. Klaagt over pijn in haar linkerbeen bij het lopen. Bij inspectie zie je een rode plek ter grootte van een twee-euromunt op het linkerscheenbeen. De huid voelt warm aan. Ze heeft gisterenochtend haar steunkousen niet aangehad omdat ze "te strak zaten".

**SOEP-ijkpunten:**
- **S:** mevrouw geeft aan pijn te hebben in haar linkerbeen bij het lopen; zegt dat de steunkousen te strak zaten.
- **O:** rode plek ter grootte van een twee-euromunt op het linkerscheenbeen; de huid voelt warm aan; mevrouw heeft gisterochtend de steunkousen niet gedragen.
- **E:** mogelijk een beginnende huidirritatie of ontsteking, mogelijk samenhangend met het niet dragen van de steunkousen.
- **P:** doorgeven aan de verpleegkundige; de huid later opnieuw controleren; het dragen van de steunkousen met mevrouw bespreken.

**Valkuil:** "rood en warm" zijn waarnemingen (O). "Ontstoken" is een inschatting (E). De student moet die niet door elkaar halen.

---

## Casus 2 - De heer Jansen

- **Setting:** verpleeghuis
- **Niveau:** 2 tot 4

**Casustekst:**
De heer Jansen, 84 jaar, verpleeghuis. Heeft tijdens de lunch slecht gegeten (minder dan een kwart van zijn bord). Herkende zijn dochter niet tijdens bezoek. Is onrustig geweest en heeft meerdere keren gevraagd "wanneer hij naar huis mag". Bloeddruk 145/90, temperatuur normaal.

**SOEP-ijkpunten:**
- **S:** meneer vraagt meermaals wanneer hij naar huis mag.
- **O:** at minder dan een kwart van zijn bord; herkende zijn dochter niet; onrustig gedrag; bloeddruk 145/90; temperatuur normaal.
- **E:** mogelijk toegenomen verwardheid of desoriëntatie; de verminderde voedingsinname is een aandachtspunt.
- **P:** intake en oriëntatie blijven observeren; melden bij de verpleegkundige of arts; mogelijke oorzaak van de verwardheid laten beoordelen.

**Valkuil:** "verward" is een interpretatie (E). De waarneming (O) is concreet: herkende zijn dochter niet en vroeg meermaals wanneer hij naar huis mag.

---

## Casus 3 - Youssef

- **Setting:** gehandicaptenzorg (licht verstandelijke beperking)
- **Niveau:** 2 tot 4

**Casustekst:**
Youssef, 32 jaar, gehandicaptenzorg. Had vanmiddag een conflict met een medebewoner over de televisie. Schreeuwde en gooide een kussen. Is nu rustig op zijn kamer, reageert kort, maakt geen oogcontact. Geeft aan "het niet meer te willen uitleggen".

**SOEP-ijkpunten:**
- **S:** Youssef geeft aan "het niet meer te willen uitleggen".
- **O:** had een conflict met een medebewoner over de televisie; schreeuwde en gooide een kussen; is nu rustig op zijn kamer; reageert kort; maakt geen oogcontact.
- **E:** lijkt teruggetrokken en gespannen na het incident; mogelijk schaamte of frustratie.
- **P:** rust geven en later terugkomen voor een gesprek; het incident melden; afspraken over tv-gebruik bespreken.

**Valkuil:** "boos" of "gefrustreerd" is een inschatting (E). Onder O hoort het waarneembare gedrag: schreeuwen, kussen gooien, kort reageren, geen oogcontact.

---

## Casus 4 - Mevrouw Okeke

- **Setting:** wijkverpleging
- **Niveau:** 2 tot 4

**Casustekst:**
Mevrouw Okeke, 67 jaar, wijkverpleging. Wond aan het linker onderbeen na een operatie 12 dagen geleden. Het wondvocht is licht toegenomen ten opzichte van gisteren en is gelig van kleur. De omliggende huid is niet rood. Mevrouw geeft aan minder pijn te hebben dan gisteren en slaapt weer beter.

**SOEP-ijkpunten:**
- **S:** mevrouw geeft aan minder pijn te hebben dan gisteren en weer beter te slapen.
- **O:** wond aan het linker onderbeen, 12 dagen na de operatie; wondvocht licht toegenomen ten opzichte van gisteren, gelig van kleur; omliggende huid niet rood.
- **E:** gemengd beeld: pijn en slaap verbeteren, maar het toegenomen, gelige wondvocht vraagt aandacht (mogelijk teken van infectie, al is de huid niet rood).
- **P:** de wond blijven observeren; de toename en kleur van het wondvocht melden aan de verpleegkundige of arts; vervolgcontrole afspreken.

**Valkuil:** de signalen spreken elkaar deels tegen. Subjectief gaat het beter (S), objectief is er een aandachtspunt (O). Alleen "het gaat goed" rapporteren mist de toename van het wondvocht.

---

## Casus 5 - Stefan

- **Setting:** jeugdzorg (gezinshuis)
- **Niveau:** 2 tot 4

**Casustekst:**
Stefan, 16 jaar, jeugdzorg. Is vandaag niet op school geweest zonder melding. Thuisgekomen om 16:30, reageert kort op vragen, maakt geen oogcontact. Trekt zich terug op zijn kamer. Heeft bij het avondeten wel mee gegeten, maar zegt niets.

**SOEP-ijkpunten:**
- **S:** Stefan zegt niets en geeft niets aan. Dat er weinig subjectieve informatie is, is op zich een observatie waard.
- **O:** niet op school geweest zonder melding; thuisgekomen om 16:30; reageert kort; geen oogcontact; trekt zich terug op zijn kamer; heeft wel mee gegeten.
- **E:** mogelijk speelt er iets (bijvoorbeeld op school of qua stemming); het teruggetrokken gedrag is een signaal om serieus te nemen.
- **P:** laagdrempelig contact en beschikbaar zijn; gedrag observeren; overleggen met mentor of gedragswetenschapper; het schoolverzuim navragen.

**Valkuil:** er is weinig S beschikbaar. De student moet niet verzinnen wat Stefan "voelt". Een aanname onder S invullen is hier de fout.

---

## Open punten

1. **Aantal en spreiding.** Vijf casussen over vijf werkvelden (thuiszorg, verpleeghuis, gehandicaptenzorg, wijkverpleging, jeugdzorg). Uitbreidbaar. Willen we per werkveld meer, of juist meer variatie in moeilijkheid?
2. **Moeilijkheidsgradatie.** Nu staan alle casussen op "niveau 2 tot 4". We zouden ze kunnen labelen (makkelijk, gemiddeld, lastig), bijvoorbeeld op basis van hoe verweven feit en mening zijn.
3. **Inhoudelijke check.** De ijkpunten zijn door mij afgeleid uit de casustekst. Iemand met zorgkennis (jij) zou ze moeten nalopen op juistheid en toon.
4. **Porten naar code.** Later wordt dit een JSON-array (bijvoorbeeld `src/knowledge/soep-casussen.json` of een scenariobron), met de velden uit de tabel bovenaan.
