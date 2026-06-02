# Kennisrapport: Spraakgestuurd rapporteren, ambient listening en handelingsverlegenheid

**Onderbouwing voor een SOEP-oefenbot voor mbo-zorgstudenten**

**Brondocument voor ontwerp, onderwijs, implementatie en vervolgonderzoek**

**Opgesteld:** 1 juni 2026  
**Versie:** 1.0

Scope: dit rapport bundelt gecontroleerde informatie uit Nederlandse praktijkbronnen, onderwijs- en simulatieonderzoek, peer-reviewed studies over AI-spraakherkenning en ambient AI-scribes, en relevante bronnen over privacy, verantwoordelijkheid en AI-geletterdheid. Het rapport is bedoeld als kennisbasis; het is geen juridisch advies, medisch protocol of validatiestudie van een specifieke tool.

# Leeswijzer

Het rapport is geschreven voor ontwikkelaars, docenten, practoraten, zorgorganisaties en onderzoekers die een oefenbot willen inzetten om mbo-studenten te laten oefenen met spraakgestuurd rapporteren volgens SOEP. De nadruk ligt op wat al redelijk onderbouwd is, wat nog onzeker is en hoe je deze kennis kunt vertalen naar didactisch ontwerp.

Bronverwijzingen staan in de tekst als [nummer]. De volledige bronnenlijst staat achterin. Aan het einde staat een factcheckmatrix met de belangrijkste claims, bewijsstatus en beperkingen.

# Inhoudsopgave

- 1. Managementsamenvatting
- 2. Vraagstelling en afbakening

- 3. Begrippenkader: SOEP, dicteren, spraakgestuurd rapporteren en ambient listening
- 4. Stand van kennis: wat werkt, wat werkt beperkt en wat is nog onzeker?

- 5. Handelingsverlegenheid bij studenten en professionals
- 6. Didactische vertaling naar een SOEP-oefenbot

- 7. Good practices voor ontwerp, onderwijs en implementatie
- 8. Evaluatie- en onderzoeksopzet

- 9. Kennisbankmodel
- 10. Juridische, ethische en organisatorische randvoorwaarden

- 11. Conclusies en aanbevelingen
- 12. Factcheckmatrix

- 13. Bronnenlijst

# 1. Managementsamenvatting

De hoofdconclusie van dit kennisrapport is dat spraakgestuurd rapporteren en ambient listening veelbelovend zijn voor het verminderen van administratieve belasting en het verbeteren van aandacht voor de cliënt, maar dat de kwaliteit en veiligheid sterk afhangen van context, training, controle en workflow-integratie. Voor een oefenbot in het mbo-zorgonderwijs betekent dit: ontwerp de bot niet als rapportagegenerator, maar als oefenomgeving voor professioneel denken, spreken, controleren en verantwoorden.

SOEP is een bruikbare methodische kapstok, omdat het onderscheid maakt tussen wat de cliënt zegt of ervaart, wat de professional waarneemt of meet, welke evaluatie of inschatting daaruit volgt, en welk plan of vervolg wordt afgesproken. Het NHG beschrijft SOEP als hulpmiddel voor een duidelijk verslag van een deelcontact, met de onderdelen Subjectief, Objectief, Evaluatie en Plan [1].

De AI Zorg Academy-e-learning over spraakgestuurd rapporteren sluit inhoudelijk sterk aan op dit project. De leerroute is tool-onafhankelijk en behandelt onder meer het verschil met dicteren, de werking van spraakherkenning en taalmodel, methodisch inspreken, controleren, verantwoordelijkheid, AVG en WGBO [2]. De e-learning kan daarom goed dienen als voorkennislaag naast de oefenbot.

De stand van onderzoek laat een gemengd beeld zien. Nederlandse praktijkbronnen van Vilans en partners beschrijven dat spraakgestuurd rapporteren administratieve druk kan verminderen, direct rapporteren na het zorgmoment kan ondersteunen en cliënten meer kan betrekken [3]. Tegelijk benoemt Vilans zachte kosten: het aanleren van een nieuwe werkwijze, ongemak om hardop bij de cliënt te rapporteren, privacyvragen en correctietijd bij langere rapportages [3].

Internationaal onderzoek naar AI-spraakherkenning toont grote variatie in nauwkeurigheid. Een systematische review vond woordfoutpercentages van 0,087 in gecontroleerde dicteersettings tot meer dan 50 procent in conversationele of multi-speaker situaties; de review benoemt ook editing burden, fouten met specialistische termen of accented speech en de noodzaak van menselijke review bij LLM-samenvattingen [7].

Voor ambient AI-scribes zijn er positieve signalen. Een JAMA Network Open-studie bij 263 ambulante clinici in zes zorgsystemen vond na 30 dagen gebruik een daling van zelfgerapporteerde burnout van 51,9 procent naar 38,8 procent en verbeteringen in cognitieve taakbelasting, after-hours documentatie en aandacht voor patiënten [9]. Maar dit was een kwaliteitsverbeterstudie, geen gerandomiseerde effectstudie, en de generaliseerbaarheid naar mbo-onderwijs, VVT, gehandicaptenzorg, GGZ of drukke intramurale settings is beperkt.

Handelingsverlegenheid blijkt een centraal thema. Het woord wordt in onderzoek naar spraakgestuurd rapporteren niet altijd letterlijk gebruikt, maar de onderliggende verschijnselen zijn herkenbaar: moeite met hardop formuleren, onzekerheid over methode, ongemak door meeluisteren, zorgen over privacy, lage technologie-self-efficacy, correctielast en onduidelijkheid over verantwoordelijkheid. Bij professionals is dit zichtbaar in praktijkbronnen over leren werken met spraakgestuurd rapporteren. Bij studenten is het vooral indirect onderbouwd via onderzoek naar EHR/ECD-documentatie, simulatie, docentbegeleiding en feedback [11-13].

Voor mbo-studenten is de belangrijkste ontwerpkeuze: maak oefenen klein, veilig en stapsgewijs. Laat studenten eerst informatie ordenen, dan per SOEP-onderdeel inspreken, daarna een volledige rapportage maken, vervolgens AI-fouten herkennen en corrigeren, en pas daarna oefenen met complexere contexten zoals ruis, gevoelige informatie of aanwezigheid van cliënt/familie.

Een cruciaal principe is dat de student eigenaar blijft van de rapportage. WHO en IGJ waarschuwen dat generatieve AI foutieve, incomplete of overtuigend klinkende maar onjuiste informatie kan produceren; controle, validatie en risicobeoordeling zijn noodzakelijk [14,15]. De AI Act vraagt bovendien om voldoende AI-geletterdheid bij personen die met AI-systemen werken [16].

## Kernboodschap in één zin

Een goede SOEP-oefenbot moet niet primair leren hoe je sneller tekst produceert, maar hoe je als zorgprofessional hardop methodisch denkt, zorgvuldig formuleert, privacybewust handelt en AI-output kritisch controleert.

# 2. Vraagstelling en afbakening

## 2.1 Centrale vraag

De centrale vraag voor dit brondocument luidt: wat is bekend over good practices, belemmeringen en leerstrategieën rond spraakgestuurd rapporteren en ambient listening, en hoe kan die kennis worden vertaald naar een oefenbot waarmee mbo-zorgstudenten leren rapporteren volgens de SOEP-methode?

## 2.2 Deelvragen

1. Wat betekenen SOEP, dicteren, spraakgestuurd rapporteren en ambient listening in deze context?
2. Wat laat onderzoek en praktijkkennis zien over voordelen, risico’s en randvoorwaarden?

3. Klopt de observatie dat er handelingsverlegenheid bestaat bij studenten en professionals?
4. Welke didactische principes zijn geschikt voor mbo-studenten?

5. Welke good practices horen bij ontwerp en implementatie van een oefenbot?
6. Hoe kan de effectiviteit van de oefenbot worden onderzocht?

7. Welke claims zijn voldoende onderbouwd en welke blijven onzeker?

## 2.3 Afbakening

Dit rapport richt zich op rapporteren in zorg- en welzijnscontexten, met bijzondere aandacht voor mbo-zorgstudenten, VVT, gehandicaptenzorg, GGZ en eerstelijns- of ambulante settings. Het rapport is niet bedoeld als vergelijking tussen specifieke commerciële leveranciers. Waar voorbeelden van tools of sectoren voorkomen, dienen ze als context voor ontwerpkeuzes en niet als aanbeveling voor aankoop.

Ambient listening wordt hier gebruikt als verzamelterm voor systemen die een zorggesprek opnemen of meeluisteren, transcriptie en/of samenvatting maken, en een conceptverslag genereren. Dit is inhoudelijk anders dan actief inspreken van een rapportage na het zorgmoment.

## 2.4 Betrouwbaarheidsaanpak

De bronnen zijn ingedeeld naar bewijskracht: peer-reviewed reviews en empirische studies, Nederlandse praktijkonderzoeken en implementatiebronnen, onderwijs- en simulatieonderzoek, en toezicht-/juridische bronnen. Claims die niet rechtstreeks uit een bron komen, zijn als interpretatie of ontwerpimplicatie geformuleerd. In de factcheckmatrix is expliciet aangegeven waar direct bewijs ontbreekt.

# 3. Begrippenkader

## 3.1 SOEP als methodische structuur

SOEP staat voor Subjectief, Objectief, Evaluatie en Plan. Volgens het NHG HIS-Referentiemodel is SOEP een hulpmiddel om een duidelijk verslag van een deelcontact te maken. De S-regel bevat subjectieve informatie zoals klacht, hulpvraag en anamnestische gegevens; de O-regel bevat objectieve bevindingen; de E-regel bevat evaluatie of werkhypothese; en de P-regel bevat het diagnostisch of behandelplan en afspraken [1].

Voor het mbo-onderwijs is SOEP niet alleen een format voor verslaglegging, maar ook een denkmodel. De student leert onderscheid maken tussen wat de cliënt zegt, wat de student ziet of meet, welke professionele inschatting passend is en welke vervolgactie afgesproken wordt.

| **SOEP-onderdeel** | **Vraag aan student**                                    | **Veelvoorkomende fout**                                        | **Feedbackrichting**                                                                           |
|--------------------|----------------------------------------------------------|-----------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| S - Subjectief     | Wat zegt of ervaart de cliënt?                           | Interpretatie opschrijven alsof het een feit is.                | Gebruik formuleringen als: cliënt geeft aan..., cliënt vertelt..., cliënt ervaart...           |
| O - Objectief      | Wat zie, hoor, meet of observeer jij?                    | Vage observatie of oordeel, bijvoorbeeld: cliënt doet moeilijk. | Maak het waarneembaar: cliënt weigert ontbijt en draait hoofd weg.                             |
| E - Evaluatie      | Wat is je professionele inschatting op basis van S en O? | Te grote diagnose of conclusie buiten bevoegdheid.              | Formuleer voorzichtig en onderbouwd: mogelijk sprake van..., aandachtspunt is...               |
| P - Plan           | Wat wordt afgesproken en wie doet wat wanneer?           | Plan ontbreekt of blijft te algemeen.                           | Maak het concreet: opnieuw meten om 14.00 uur, overleg met verpleegkundige, cliënt informeren. |

## 3.2 Dicteren, spraakgestuurd rapporteren en ambient listening

De AI Zorg Academy maakt een relevant onderscheid tussen dicteren en spraakgestuurd rapporteren. Bij dicteren wordt de stem letterlijk omgezet in tekst. Bij spraakgestuurd rapporteren spreekt de zorgprofessional vrijer in en maakt een taalmodel van het verhaal een gestructureerde rapportage, bijvoorbeeld volgens SOEP of zorgplangericht rapporteren [2].

Vilans beschrijft spraakgestuurd rapporteren als een werkwijze waarbij gesproken informatie automatisch wordt omgezet in tekst en direct in het ECD kan worden vastgelegd [3]. Bij ambient listening of een ambient AI-scribe luistert het systeem tijdens het cliëntcontact mee en genereert het daarna een conceptnotitie of samenvatting. De professional controleert en corrigeert voor opslag in het dossier.

| **Variant**                   | **Beschrijving**                                             | **Didactische betekenis**                                              | **Belangrijk risico**                                         |
|-------------------------------|--------------------------------------------------------------|------------------------------------------------------------------------|---------------------------------------------------------------|
| Dicteren                      | Letterlijk inspreken: wat je zegt wordt tekst.               | Student leert duidelijk formuleren en corrigeren.                      | Slechte formulering wordt letterlijk vastgelegd.              |
| Spraak-naar-tekst             | Techniek zet audio om naar transcript.                       | Student ziet wat systeem verstaat.                                     | Transcriptiefouten, namen, cijfers, ontkenningen.             |
| Spraakgestuurd rapporteren    | Spraakherkenning plus taalmodel ordent tekst tot rapportage. | Student leert methodisch inspreken en AI-output controleren.           | Taalmodel kan informatie verkeerd structureren of toevoegen.  |
| Ambient listening / AI-scribe | Systeem luistert mee met gesprek en maakt conceptverslag.    | Student leert toestemming, context, controle en samenvatten begrijpen. | Privacy, meerdere sprekers, ruis, bronverwarring, note bloat. |

## 3.3 Waarom dit onderscheid belangrijk is

Een oefenbot die studenten laat inspreken volgens SOEP traint een andere vaardigheid dan een ambient systeem dat een gesprek samenvat. Bij actief inspreken moet de student zelf selecteren en ordenen. Bij ambient listening moet de student vooral leren beoordelen of de samenvatting klopt, of nuance behouden blijft, of toestemming en privacy goed zijn geregeld, en of het verslag professioneel verantwoord is.

# 4. Stand van kennis: wat werkt, wat werkt beperkt en wat is onzeker?

## 4.1 Potentiële voordelen

De belangrijkste potentiële voordelen van spraakgestuurd rapporteren zijn tijdsbesparing, minder typbelasting, directer rapporteren na het zorgmoment, betere leesbaarheid en meer aandacht voor cliëntcontact. Vilans benoemt onder meer vermindering van administratieve last, minder spelfouten, direct rapporteren na het zorgmoment, toegankelijkheid voor medewerkers die moeite hebben met typen en mogelijke cliëntbetrokkenheid doordat rapportage in aanwezigheid van de cliënt kan plaatsvinden [3].

Recente Nederlandse praktijkbronnen laten zien dat spraakgestuurd rapporteren in gecontroleerde situaties sneller kan zijn dan typen. Vilans Magazine berichtte in 2025 dat recent onderzoek laat zien dat spraakgestuurd rapporteren 2 tot 3 keer sneller kan zijn dan typen, maar ook dat het een andere manier van werken vraagt [5]. De formulering "kan zijn" is belangrijk: snelheid in een lab- of pilotsituatie is niet hetzelfde als structurele tijdwinst in elke werkcontext.

Bij ambient AI-scribes is er positief onderzoek naar ervaren administratieve belasting en aandacht voor patiënten. In een JAMA Network Open-studie werd na 30 dagen ambient AI-scribe-gebruik bij ambulante clinici een significante daling van zelfgerapporteerde burnout en cognitieve taakbelasting gevonden, naast minder documentatie na werktijd en meer onverdeelde aandacht voor patiënten [9]. Dit ondersteunt de belofte, maar bewijst niet automatisch effectiviteit in alle zorgsettings of in onderwijs.

## 4.2 Beperkingen en risico’s

De nauwkeurigheid van AI-spraakherkenning verschilt sterk per situatie. De systematische review in BMC Medical Informatics and Decision Making vond lage foutpercentages in gecontroleerde dicteersettings, maar foutpercentages boven 50 procent in conversationele of multi-speaker scenario’s. Ook benoemt de review extra correctielast, inconsistente kosteneffectiviteit en fouten bij specialistische terminologie of accented speech [7].

Ambient AI-scribes zijn vooral onderzocht in relatief rustige, ambulante settings. Een npj Digital Medicine-perspective uit 2026 waarschuwt dat opschaling naar diverse zorgomgevingen nieuwe uitdagingen geeft: lawaai, onderbrekingen, meerdere sprekers, lokale jargon, note bloat, beperkte interoperabiliteit, privacy en gebrek aan bewijs voor harde klinische uitkomsten [10].

De AI Zorg Academy benoemt specifiek dat namen, doseringen, ontkenningen en toegevoegde details anders uit software kunnen komen dan ingesproken. Daarom zijn methodisch inspreken, goed controleren en veilig gebruik essentieel; de gebruiker blijft eindverantwoordelijk voor wat in het dossier komt [2].

| **Thema**           | **Wat lijkt te werken**                                         | **Waar gaat het mis?**                                                     | **Ontwerpimplicatie voor oefenbot**                                            |
|---------------------|-----------------------------------------------------------------|----------------------------------------------------------------------------|--------------------------------------------------------------------------------|
| Tijd en werkdruk    | Korte, duidelijke rapportages kunnen sneller worden vastgelegd. | Leerfase kan tijdelijk extra tijd kosten; correctie kan winst verminderen. | Meet niet alleen snelheid maar ook kwaliteit, correctielast en zelfvertrouwen. |
| Rapportagekwaliteit | Structuur en minder spelfouten kunnen verbeteren.               | AI kan details toevoegen of verkeerd interpreteren.                        | Laat studenten fouten in AI-output opsporen.                                   |
| Cliëntcontact       | Minder schermtijd kan aandacht voor cliënt verbeteren.          | Meeluisteren of opnemen kan cliënt of student remmen.                      | Oefen toestemming, transparantie en keuze voor passende locatie.               |
| Context             | Rustige één-op-één situaties zijn kansrijker.                   | Ruis, groepsgesprekken en meerdere sprekers geven risico.                  | Maak contextbewust kiezen een leerdoel.                                        |
| Adoptie             | Training, begeleiding en champions helpen.                      | Onwennigheid, lage self-efficacy en privacytwijfel remmen gebruik.         | Bouw de bot als veilige oefenruimte met herhaling en feedback.                 |

## 4.3 Bewijsstatus in het kort

Er is redelijk bewijs dat spraakgestuurd rapporteren en ambient AI-scribes administratieve belasting kunnen verminderen in bepaalde settings. Er is ook sterk bewijs dat fouten, correctielast en contextfactoren relevant blijven. Er is beperkt direct bewijs voor mbo-studenten die spraakgestuurd SOEP-rapporteren oefenen met een bot. De beste basis voor jouw project is daarom een combinatie van praktijkonderzoek, onderwijs- en simulatieonderzoek, AI-safetyprincipes en eigen evaluatie.

# 5. Handelingsverlegenheid bij studenten en professionals

## 5.1 Klopt de observatie?

Ja, de observatie klopt inhoudelijk, maar het verschijnsel wordt in onderzoek niet altijd letterlijk "handelingsverlegenheid" genoemd. In bronnen komen verwante begrippen en verschijnselen terug: moeite met formuleren, onzekerheid, lage self-efficacy, technologieacceptatie, computer anxiety, workflowfrictie, privacy-ongemak, correctielast, beperkte feedback en onduidelijkheid over verantwoordelijkheid.

Bij professionals blijkt handelingsverlegenheid vooral uit praktijkknelpunten: een nieuwe werkwijze moeten aanleren, ongemak bij hardop rapporteren in aanwezigheid van cliënt of collega, privacyvragen, en correctietijd bij langere rapportages. Vilans noemt deze punten expliciet als zachte kosten of aandachtspunten bij spraakgestuurd rapporteren [3].

Bij studenten is het bewijs indirecter. BMC Nursing laat zien dat verpleegkundestudenten bij elektronische dossierdocumentatie behoefte hebben aan voldoende docentbegeleiding, peer learning, mentoring tijdens stage en feedback. Studenten voelden zich soms "on your own" en maakten zich zorgen over patiëntveiligheid [11]. Dat is geen studie naar spraakgestuurd SOEP-rapporteren, maar de onderliggende leerproblemen zijn relevant: documentatie is professioneel risicovol en studenten hebben begeleiding en feedback nodig.

## 5.2 Vijf vormen van handelingsverlegenheid

| **Vorm**                        | **Herkenbare uiting**                                                | **Waarschijnlijke oorzaak**                                                              | **Oplossing in bot/onderwijs**                                      |
|---------------------------------|----------------------------------------------------------------------|------------------------------------------------------------------------------------------|---------------------------------------------------------------------|
| Spreekverlegenheid              | Student vindt het raar om tegen een systeem te praten.               | Rapporteren is normaal schriftelijk; hardop professioneel formuleren voelt onnatuurlijk. | Korte oefenstappen, voorbeeldzinnen, oefenstand zonder beoordeling. |
| Methodische verlegenheid        | Student weet niet wat bij S, O, E of P hoort.                        | Onzekerheid over rapportagestructuur en klinisch redeneren.                              | SOEP-kaarten, drag-and-drop ordenen, per onderdeel inspreken.       |
| Sociale verlegenheid            | Student/professional schaamt zich als cliënt of collega meeluistert. | Normen rond privacy, professionaliteit en rolgedrag zijn onduidelijk.                    | Contextscenario’s: wanneer wel/niet hardop rapporteren.             |
| Technologische verlegenheid     | Gebruiker vertrouwt transcript of AI-samenvatting niet.              | Weinig ervaring, eerdere fouten, lage digitale self-efficacy.                            | Laat transcript, concept en correctiestappen zichtbaar zien.        |
| Ethisch-juridische verlegenheid | Onzekerheid over toestemming, dossierplicht en verantwoordelijkheid. | AVG/WGBO en AI-verantwoordelijkheid zijn abstract.                                       | Concrete regels, casussen, beslisboom en feedback op privacy.       |

## 5.3 Waarom handelingsverlegenheid logisch is

Spraakgestuurd rapporteren verandert niet alleen de techniek, maar ook het gedrag. De zorgprofessional moet in real time of kort na het zorgmoment professioneel formuleren. Waar typen ruimte geeft om te zoeken naar woorden, vraagt inspreken meer directe verbale ordening. Dat is voor ervaren professionals al wennen en voor studenten extra kwetsbaar omdat zij tegelijk de zorginhoud, beroepsrol, rapportagetaal en technologie leren.

Ambient listening voegt nog een laag toe. De vraag verschuift van "durf ik mijn rapportage in te spreken?" naar "durf ik een systeem te laten meeluisteren met een zorggesprek?" Daarbij spelen toestemming, privacy, gespreksveiligheid, cliëntvertrouwen, bronherkenning en controle op samenvatting een grotere rol.

## 5.4 Oplossingsrichting

De oplossing is niet alleen meer instructie, maar vooral meer begeleide oefening. Onderwijsbronnen over EHR-documentatie en simulatie wijzen op het belang van docentbegeleiding, peer learning, mentoring, feedback en gesimuleerde EHR-omgevingen [11,12]. Voor de oefenbot betekent dit: gebruik scaffolding, herhaling, veilige fouten, feedbackrubrics en reflectie.

# 6. Didactische vertaling naar een SOEP-oefenbot

## 6.1 Ontwerpuitgangspunt

De bot moet worden ontworpen als leeromgeving voor vier gecombineerde vaardigheden: methodisch denken, professioneel spreken, AI-output controleren en verantwoord handelen. De bot is dus niet alleen een spraakherkenner en ook niet alleen een tekstgenerator.

## 6.2 Leerdoelen

- De student kan informatie uit een casus ordenen volgens S, O, E en P.
- De student kan een korte professionele rapportage hardop inspreken in begrijpelijke, objectieve en respectvolle taal.

- De student kan onderscheiden tussen observatie, interpretatie en plan.
- De student kan fouten herkennen in transcriptie en AI-gegeneerde SOEP-rapportages.

- De student kan benoemen wanneer spraakgestuurd rapporteren passend is en wanneer niet.
- De student begrijpt dat de professional verantwoordelijk blijft voor de inhoud van het dossier.

- De student kan privacybewust oefenen met fictieve cliëntgegevens.

## 6.3 Oefenladder

| **Niveau**                  | **Oefenvorm**                                  | **Doel**                                 | **Feedback**                                                        |
|-----------------------------|------------------------------------------------|------------------------------------------|---------------------------------------------------------------------|
| 1. Ordenen zonder spreken  | Casusinformatie sorteren naar S/O/E/P.         | Drempel verlagen; structuur begrijpen.   | Feedback op indeling en redenering.                                 |
| 2. Eén zin per onderdeel   | Student spreekt alleen S, daarna O, E en P.    | Spreekdrempel en methodische focus.      | Feedback op formulering per onderdeel.                              |
| 3. Voorbeeldtaal aanpassen | Bot geeft voorbeeldzin, student past aan.      | Professionele taal aanleren.             | Feedback op objectiviteit en relevantie.                            |
| 4. Volledige inspraak      | Student spreekt complete SOEP in.              | Integratie van denken en spreken.        | Rubric op SOEP, taal, volledigheid en privacy.                      |
| 5. AI-output corrigeren    | Bot toont concept met fouten.                  | Controlevaardigheid en AI-geletterdheid. | Feedback op gevonden en gemiste fouten.                             |
| 6. Contextscenario         | Ruis, cliënt erbij, privacydilemma, tijdsdruk. | Transfer naar praktijk.                  | Feedback op keuze: spreken, typen, later rapporteren of overleggen. |

## 6.4 Feedbackrubric

De feedback van de bot moet concreet, kort en handelingsgericht zijn. Vermijd alleen globale scores. Geef eerst wat goed ging, daarna maximaal twee verbeterpunten, daarna een herformulering of oefenvraag.

| **Criterium**      | **Score 1 - onvoldoende**                  | **Score 2 - basis**                                        | **Score 3 - goed**                                        |
|--------------------|--------------------------------------------|------------------------------------------------------------|-----------------------------------------------------------|
| SOEP-structuur     | Onderdelen ontbreken of lopen door elkaar. | Meeste onderdelen aanwezig, maar deels verkeerd geplaatst. | Alle onderdelen logisch en duidelijk gescheiden.          |
| Objectiviteit      | Oordelen of aannames zonder basis.         | Grotendeels feitelijk, enkele vage termen.                 | Waarneembaar, meetbaar en neutraal geformuleerd.          |
| Relevantie         | Veel irrelevante details.                  | Enkele overbodige details.                                 | Bondig en zorgrelevant.                                   |
| Evaluatie          | Conclusie ontbreekt of is te stellig.      | Voorzichtige inschatting, beperkt onderbouwd.              | Inschatting passend bij S en O en binnen rol/bevoegdheid. |
| Plan               | Geen vervolgactie.                         | Vervolgactie aanwezig maar niet concreet.                  | Wie/wat/wanneer helder afgesproken.                       |
| Privacy            | Onnodige persoonsgegevens of context.      | Geen ernstige privacyfout, maar nog te veel details.       | Alleen noodzakelijke informatie, veilige context benoemd. |
| Controle AI-output | Fouten niet opgemerkt.                     | Enkele fouten gecorrigeerd.                                | Transcriptie-, structuur- en inhoudsfouten herkend.       |

## 6.5 Voorbeeld van een botinteractie

Casus: Mevrouw De Vries zegt dat zij sinds vanochtend duizelig is. Je meet een bloeddruk van 98/62 en ziet dat mevrouw onzeker loopt. Ze heeft weinig gedronken. Je overlegt met de verpleegkundige en spreekt af dat mevrouw extra drinken krijgt en dat de bloeddruk over twee uur opnieuw wordt gemeten.

Botstap 1: "Welke informatie hoort bij Subjectief?" Student: "Mevrouw zegt dat zij sinds vanochtend duizelig is."

Botfeedback: "Goed: je gebruikt wat mevrouw zelf zegt. Voeg eventueel toe dat het sinds vanochtend is begonnen. Vermijd hier nog een conclusie zoals uitdroging; dat hoort eerder bij E."

Botstap 2: student spreekt volledige SOEP in. Bot toont transcript en concept. Daarna vraagt de bot: "Controleer: klopt elke naam, tijd, meting en afspraak? Staat er iets in dat jij niet hebt gezegd?"

# 7. Good practices voor ontwerp, onderwijs en implementatie

## 7.1 Good practices voor de oefenbot

1. Gebruik uitsluitend fictieve casussen en fictieve cliëntgegevens in onderwijs en prototypefase.
2. Toon altijd zowel transcript als gestructureerde SOEP-concepttekst, zodat studenten leren controleren.

3. Laat de bot expliciet waarschuwen voor namen, doseringen, tijdstippen, ontkenningen en toegevoegde details, omdat dit bekende risicocategorieën zijn [2,7].
4. Geef feedback op denken en formuleren, niet alleen op grammatica.

5. Gebruik een oefenstand waarin fouten veilig zijn en een toetsstand waarin competenties worden gemeten.
6. Laat studenten oefenen met de keuze om niet te spreken: soms is typen, later rapporteren of een rustige plek zoeken professioneler.

7. Leg vast dat de bot geen medisch advies geeft en geen dossierinformatie definitief opslaat.
8. Ontwerp feedback op taalniveau mbo: korte zinnen, concrete voorbeelden, geen onnodig jargon.

9. Gebruik casussen met toenemende complexiteit: eenvoudige dagelijkse zorg, bijzonderheid, incident, privacydilemma, ruis, cliënt/familie aanwezig.
10. Maak reflectie verplicht: wat heb je aangepast en waarom?

## 7.2 Good practices voor onderwijs

Onderwijs moet de bot niet los aanbieden, maar inbedden in lessen over rapporteren, klinisch redeneren, privacy, professioneel taalgebruik en digitale zorgtechnologie. De e-learning van AI Zorg Academy kan dienen als voorbereidende module; de bot als vaardigheidstraining; klassikale nabespreking als reflectie- en transfermoment [2].

- Start met docentmodellering: de docent denkt hardop voor en spreekt een SOEP-voorbeeld in.
- Laat studenten in duo’s eerst samen de casus ordenen voordat zij individueel inspreken.

- Gebruik peer feedback met dezelfde rubric als de bot.
- Laat studenten bewust slechte rapportages verbeteren.

- Benoem dat ongemak normaal is en onderdeel van de leerfase.
- Koppel aan stage: wanneer zou je dit op stage wel of niet gebruiken?

## 7.3 Good practices voor professionals en teams

Voor professionals is implementatie vooral een veranderkundig vraagstuk. De implementatietoolkit van Waardigheid en trots/Vilans is gemaakt omdat veel organisaties testen en gebruiken, maar borging en opschaling nog in ontwikkeling zijn; de toolkit vertaalt praktijklessen naar stappen, tips en ervaringen [6].

- Begin met geschikte rapportagetypen: korte dagelijkse rapportages en bijzonderheden, niet meteen complexe intakes of groepsgesprekken.
- Maak teamafspraken over waar en wanneer hardop rapporteren passend is.

- Gebruik superusers, digicoaches of aandachtsvelders voor begeleiding.
- Plan oefentijd in; verwacht niet dat tijdswinst direct in de eerste week zichtbaar is.

- Meet naast tijd ook correctielast, ervaren kwaliteit, werkplezier en privacy-incidenten.
- Zorg dat leidinggevenden de leerfase legitimeren en niet framen als weerstand.

## 7.4 Good practices voor ambient listening

Ambient listening vraagt strengere randvoorwaarden dan actief inspreken. Het systeem komt dichter bij het cliëntgesprek, waardoor toestemming/transparantie, dataminimalisatie, bronherkenning en controle extra belangrijk zijn. In diverse settings zijn problemen met lawaai, onderbrekingen en meerdere sprekers te verwachten [10].

- Gebruik ambient listening eerst in rustige één-op-één gesprekken en niet in groepssituaties.
- Informeer de cliënt duidelijk en respecteer bezwaar of weigering volgens het lokale beleid.

- Sla geen AI-concept automatisch op zonder menselijke controle.
- Controleer of de samenvatting onderscheid maakt tussen cliënt, professional en derden.

- Maak afspraken over bewaartermijnen van audio, transcript en concepten.
- Voorkom note bloat: verslag moet relevant, bondig en bruikbaar blijven.

- Evalueer effecten op cliëntvertrouwen en gespreksveiligheid, niet alleen op tijd.

# 8. Evaluatie- en onderzoeksopzet

## 8.1 Onderzoeksvragen voor jouw project

1. In hoeverre vermindert oefenen met de bot de handelingsverlegenheid van mbo-studenten bij hardop rapporteren?
2. Verbetert de kwaliteit van SOEP-rapportages na gebruik van de bot?

3. Welke vormen van feedback dragen het meest bij aan verbetering: structuurfeedback, voorbeeldzinnen, foutdetectie of reflectievragen?
4. Kunnen studenten na oefening beter fouten herkennen in AI-gegeneerde concept-SOEP-rapportages?

5. Kunnen studenten beter inschatten wanneer spraakgestuurd rapporteren passend of niet passend is?
6. Hoe ervaren docenten de bruikbaarheid van de bot voor begeleiding en beoordeling?

## 8.2 Meetmodel

| **Construct**        | **Voorbeeldindicator**                              | **Meetmethode**                       | **Moment**                    |
|----------------------|-----------------------------------------------------|---------------------------------------|-------------------------------|
| Spreekzelfvertrouwen | Ik durf een rapportage hardop in te spreken.        | Vragenlijst 1-5 Likert.               | Voor en na.                   |
| SOEP-kennis          | Student plaatst casusinformatie correct in S/O/E/P. | Korte kennistoets of sorteeropdracht. | Voor en na.                   |
| Rapportagekwaliteit  | Objectief, relevant, volledig en concreet plan.     | Rubric door docent en/of bot.         | Voor, tijdens, na.            |
| Controlevaardigheid  | Student vindt fouten in concept-output.             | Foutdetectietaak.                     | Na instructie en na oefening. |
| Privacybewustzijn    | Student kiest veilige context en minimale gegevens. | Scenario-vragen.                      | Voor en na.                   |
| Gebruikerservaring   | Gebruiksgemak, ongemak, correctielast, vertrouwen.  | Vragenlijst plus korte interviews.    | Na gebruik.                   |
| Transfer naar stage  | Student kan toepassing in praktijk benoemen.        | Reflectieverslag of focusgroep.       | Na module/stage.              |

## 8.3 Mogelijk onderzoeksdesign

Een haalbaar praktijkgericht design is een pre-post pilot met controlegroep of vergelijkingsconditie. Groep A krijgt de e-learning plus oefenbot; groep B krijgt alleen reguliere instructie of e-learning. Beide groepen maken vooraf en achteraf een SOEP-rapportage en een foutdetectietaak. Aanvullend worden korte interviews met studenten en docenten afgenomen.

Bij kleine aantallen is het realistischer om te spreken van een verkennende effectevaluatie dan van hard bewijs. Gebruik dan mixed methods: rubricscores, vragenlijsten en kwalitatieve reflecties. De kwalitatieve data zijn juist waardevol om te begrijpen welke vorm van handelingsverlegenheid afneemt of blijft bestaan.

## 8.4 Voorbeeldvragenlijst handelingsverlegenheid

| **Domein**           | **Item**                                                                | **Schaal**                          |
|----------------------|-------------------------------------------------------------------------|-------------------------------------|
| Spreken              | Ik vind het ongemakkelijk om tegen een digitaal systeem te rapporteren. | 1 helemaal oneens - 5 helemaal eens |
| Structuur            | Ik weet wat ik bij S, O, E en P moet zeggen.                            | 1-5                                 |
| Taal                 | Ik kan een zorgsituatie kort en professioneel hardop formuleren.        | 1-5                                 |
| Controle             | Ik kan fouten herkennen in een door AI gemaakte rapportage.             | 1-5                                 |
| Privacy              | Ik weet wanneer spraakgestuurd rapporteren niet passend is.             | 1-5                                 |
| Verantwoordelijkheid | Ik begrijp dat ik eindverantwoordelijk blijf voor de rapportage.        | 1-5                                 |
| Transfer             | Ik verwacht deze vaardigheid op stage te kunnen toepassen.              | 1-5                                 |

## 8.5 Minimale dataveiligheid voor onderzoek

- Gebruik fictieve casussen en laat studenten geen echte cliëntinformatie inspreken.
- Informeer studenten vooraf over welke data worden opgeslagen: audio, transcript, score, feedback en/of reflectie.

- Maak deelname aan onderzoek gescheiden van beoordeling waar dat kan.
- Anonimiseer of pseudonimiseer onderzoeksdata.

- Leg vast wie toegang heeft tot ruwe audio en hoe lang die wordt bewaard.
- Vraag ethische toetsing of interne privacycheck wanneer data worden gebruikt voor publicatie of externe analyse.

# 9. Kennisbankmodel

De kennisbank kan het beste worden ingericht als evidence map: korte kenniskaarten met vaste velden. Zo kun je wetenschappelijke bronnen, praktijkrapporten, e-learningmateriaal, implementatietools en eigen onderzoeksresultaten naast elkaar zetten zonder de bewijskracht te verwarren.

## 9.1 Metadata per kenniskaart

| **Veld**            | **Toelichting**                                                                              |
|---------------------|----------------------------------------------------------------------------------------------|
| Titel               | Naam van bron, studie, tool of praktijkvoorbeeld.                                            |
| Type bron           | Review, empirische studie, praktijkrapport, e-learning, richtlijn, toezichtbron, eigen data. |
| Setting             | Mbo-onderwijs, VVT, GGZ, huisartsenzorg, ziekenhuis, gehandicaptenzorg.                      |
| Technologie         | Dicteren, speech-to-text, spraakgestuurd rapporteren, ambient listening, AI-scribe.          |
| Doelgroep           | Student, docent, zorgprofessional, cliënt, management.                                       |
| Belangrijk inzicht  | Korte kernboodschap in gewone taal.                                                          |
| Wat werkt           | Concrete werkzame elementen.                                                                 |
| Wat werkt niet      | Knelpunten en contra-indicaties.                                                             |
| Implicatie voor bot | Ontwerp- of didactische vertaling.                                                           |
| Bewijskracht        | Hoog, middel, laag; met korte onderbouwing.                                                  |
| Bronverwijzing      | Volledige referentie en link.                                                                |
| Open vraag          | Wat moet nog onderzocht worden?                                                              |

## 9.2 Thema-indeling

- Technologievarianten: dicteren, speech-to-text, speech-to-summary, ambient listening.
- SOEP en rapportagekwaliteit: objectiviteit, relevantie, volledigheid, planmatigheid.

- Handelingsverlegenheid: spreken, methode, sociaal, technologie, ethiek/privacy.
- Onderwijs en simulatie: scaffolding, feedback, peer learning, docentrol.

- Implementatie: workflow, champions, training, ondersteuning, borging.
- Privacy en verantwoordelijkheid: AVG/WGBO, toestemming/transparantie, dataminimalisatie, controle.

- Evaluatie: meetinstrumenten, rubrics, pre-post data, gebruikerservaring.
- Risico’s: hallucinaties, transcriptiefouten, note bloat, bias, contextproblemen.

## 9.3 Voorbeeld kenniskaart

| **Veld**            | **Voorbeeldinvulling**                                                                                                      |
|---------------------|-----------------------------------------------------------------------------------------------------------------------------|
| Titel               | AI Zorg Academy - Spraakgestuurd rapporteren in de zorg                                                                     |
| Type bron           | E-learning / praktijkgerichte leerroute                                                                                     |
| Belangrijk inzicht  | Spraakgestuurd rapporteren is meer dan dicteren: spraakherkenning plus taalmodel structureert een vrij ingesproken verhaal. |
| Wat werkt           | Methodisch inspreken, oefenen met casussen, controle op fouten, privacyregels concreet maken.                               |
| Wat werkt niet      | Blind vertrouwen op AI-output of gebruik van niet-goedgekeurde privé-apps.                                                  |
| Implicatie voor bot | Laat studenten transcript en concept controleren; maak privacy en verantwoordelijkheid expliciet.                           |
| Bewijskracht        | Praktijkgericht, niet op zichzelf effectbewijs. Wel inhoudelijk bruikbaar voor ontwerp.                                     |
| Bron                | [2]                                                                                                                       |

# 10. Juridische, ethische en organisatorische randvoorwaarden

## 10.1 Dossierplicht en kwaliteit van verslaglegging

De WGBO verplicht hulpverleners om met betrekking tot de behandeling van een patiënt een dossier in te richten. KNMG benadrukt dat een zorgvuldig bijgehouden dossier van belang is voor kwaliteit en continuïteit van zorg [17]. Voor onderwijs betekent dit dat rapporteren niet alleen een administratieve handeling is, maar een kerntaak in professioneel handelen.

## 10.2 AVG, gegevensbescherming en dataminimalisatie

Bij spraakgestuurd rapporteren en ambient listening worden potentieel gevoelige persoonsgegevens verwerkt. In onderwijs moet daarom met fictieve casussen worden gewerkt, tenzij er een expliciete onderzoeks- en privacybasis is. De AI Zorg Academy benadrukt dat veilig gebruik alleen kan met een door de organisatie goedgekeurde tool en dat een eigen app op een privételefoon geen veilige optie is [2].

## 10.3 AI-geletterdheid

Artikel 4 van de EU AI Act vraagt aanbieders en gebruikers van AI-systemen maatregelen te nemen om een voldoende niveau van AI-geletterdheid te waarborgen bij medewerkers en anderen die met AI-systemen werken, rekening houdend met kennis, ervaring, opleiding, gebruikscontext en betrokken personen [16]. Voor dit project betekent dit dat studenten niet alleen moeten leren bedienen, maar ook begrijpen wat AI wel en niet kan, welke fouten kunnen ontstaan en hoe zij verantwoordelijk controleren.

## 10.4 Risico’s van generatieve AI

WHO benoemt dat large multimodal models kunnen worden gebruikt voor administratieve taken zoals documenteren en samenvatten van patiëntbezoeken, en voor medisch en verpleegkundig onderwijs met gesimuleerde patiëntcontacten. Tegelijk waarschuwt WHO voor valse, inaccurate, bevooroordeelde of incomplete output en automation bias [14]. IGJ benoemt vergelijkbare risico’s voor generatieve AI in de zorg, zoals onjuiste of onvolledige informatie die kan leiden tot medicatiefouten of onjuiste beoordeling [15].

## 10.5 Praktische beslisregels voor veilig oefenen

| **Situatie**                                            | **Advies voor oefenbot/onderwijs**                                                     |
|---------------------------------------------------------|----------------------------------------------------------------------------------------|
| Student wil echte stagecasus inspreken.                 | Niet doen in de oefenbot; laat casus anonimiseren of gebruik fictief alternatief.      |
| Student twijfelt of iets privacygevoelig is.            | Bot geeft beslisvraag: is dit noodzakelijk voor zorgcontinuïteit? Zo niet, weglaten.   |
| Bot genereert een detail dat student niet heeft gezegd. | Student moet corrigeren; bot markeert dit als kritieke AI-fout.                        |
| Omgeving is druk of anderen luisteren mee.              | Bot leert: zoek rustige plek, typ later of overleg; spraak is niet altijd beste keuze. |
| Ambient listening in oefening.                          | Gebruik alleen fictieve audio of gesimuleerd gesprek; oefen toestemming/transparantie. |
| Student wil output kopiëren naar echt dossier.          | Niet vanuit onderwijsbot; alleen na lokale toestemming, protocol en goedgekeurde tool. |

# 11. Conclusies en aanbevelingen

## 11.1 Conclusies

1. Spraakgestuurd rapporteren en ambient listening zijn veelbelovend, maar niet foutloos en niet contextonafhankelijk.
2. SOEP is een geschikte didactische structuur omdat het studenten helpt feiten, ervaringen, interpretaties en plannen te onderscheiden.

3. Handelingsverlegenheid is een reëel fenomeen, ook al wordt het in onderzoek vaak met andere termen beschreven.
4. Bij professionals gaat handelingsverlegenheid vooral over nieuwe werkwijze, hardop formuleren, privacy, correctielast en verantwoordelijkheid.

5. Bij studenten is direct bewijs voor spraakgestuurd SOEP-rapporteren schaars; wel is er relevant indirect bewijs uit EHR-documentatie, simulatie en structured note-taking.
6. Een oefenbot moet vooral leren denken, spreken, controleren en verantwoorden; snelheid is secundair.

7. Menselijke controle blijft noodzakelijk, zeker bij namen, cijfers, doseringen, ontkenningen en AI-toevoegingen.
8. AI-geletterdheid en privacybewustzijn zijn geen losse modules maar kernonderdelen van de vaardigheid.

## 11.2 Aanbevelingen voor ontwikkeling

1. Bouw de bot op rond een vaste oefenladder van ordenen naar inspreken naar corrigeren naar contextueel kiezen.
2. Gebruik de AI Zorg Academy-e-learning als voorbereidende kennislaag en de bot als vaardigheidstrainer.

3. Maak een SOEP-rubric die docent, bot en student allemaal gebruiken.
4. Integreer foutdetectie-oefeningen waarin AI-output bewust fouten bevat.

5. Ontwerp expliciete privacy- en contextscenario’s.
6. Start met fictieve, korte en herkenbare mbo-casussen uit VVT, gehandicaptenzorg en GGZ.

7. Meet handelingsverlegenheid vóór en na oefenen met vragenlijst plus interviews.
8. Betrek docenten, studenten en praktijkbegeleiders vroeg bij testen.

9. Documenteer wat de bot wel en niet doet, inclusief beperkingen en verantwoordelijkheid.
10. Gebruik pilotdata om de kennisbank steeds verder te vullen.

## 11.3 Aanbevelingen voor vervolgonderzoek

Er is vooral behoefte aan direct onderzoek naar mbo-studenten, spraakgestuurde SOEP-rapportage en didactische interventies tegen handelingsverlegenheid. Interessante onderzoekslijnen zijn: effect van stapsgewijs oefenen op zelfvertrouwen; effect van foutdetectie-oefeningen op controlevaardigheid; verschil tussen inspreken per SOEP-onderdeel en direct volledig inspreken; en transfer naar stage of simulatiepraktijk.

# 12. Factcheckmatrix

Deze factcheck controleert de belangrijkste uitspraken in het rapport. Statussen: sterk onderbouwd = meerdere betrouwbare of primaire bronnen; redelijk onderbouwd = betrouwbare bron maar contextgebonden; beperkt/indirect = plausibel maar niet direct onderzocht in jouw specifieke doelgroep; onzeker = expliciet nog niet bewezen of niet gevonden in de geraadpleegde bronnen.

| **Claim**                                                                                                    | **Status**                    | **Onderbouwing / beperking**                                                                                                                                                                                      |
|--------------------------------------------------------------------------------------------------------------|-------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| SOEP bestaat uit Subjectief, Objectief, Evaluatie en Plan en is bedoeld voor gestructureerde verslaglegging. | Sterk onderbouwd              | NHG HIS-Referentiemodel beschrijft SOEP en de onderdelen [1].                                                                                                                                                   |
| Spraakgestuurd rapporteren is iets anders dan dicteren.                                                      | Redelijk onderbouwd           | AI Zorg Academy maakt dit onderscheid expliciet; Vilans beschrijft omzetting van gesproken informatie naar tekst [2,3].                                                                                         |
| Spraakgestuurd rapporteren kan tijd besparen.                                                                | Redelijk onderbouwd           | Vilans-bronnen rapporteren tijdwinst in praktijk/labcontext; effect is context- en leerfase-afhankelijk [4,5]. Niet gegarandeerd voor elke medewerker of setting.                                               |
| AI-spraakherkenning is niet foutloos.                                                                        | Sterk onderbouwd              | Systematische review toont brede foutpercentages en problemen in multi-speaker/conversationele situaties [7]. AI Zorg Academy en IGJ waarschuwen eveneens voor fouten [2,15].                                 |
| Menselijke controle blijft noodzakelijk.                                                                     | Sterk onderbouwd              | BMC-review noemt noodzaak van human review bij LLM-samenvattingen; AI Zorg Academy en IGJ benadrukken controle en verantwoordelijkheid [2,7,15].                                                                |
| Ambient AI-scribes kunnen burnout en cognitieve belasting verminderen.                                       | Redelijk onderbouwd           | JAMA kwaliteitsverbeterstudie vond verbetering na 30 dagen in ambulante settings [9]. Geen RCT; generaliseerbaarheid naar mbo/VVT/GGZ is onzeker.                                                               |
| Ambient listening werkt minder goed bij lawaai, onderbrekingen en meerdere sprekers.                         | Redelijk tot sterk onderbouwd | Systematische review en npj-perspective benoemen multi-speaker/conversationele foutpercentages en technische/ethische uitdagingen [7,10].                                                                       |
| Er is handelingsverlegenheid bij professionals rond spraakgestuurd rapporteren.                              | Redelijk onderbouwd           | Niet altijd onder die term, maar bronnen beschrijven ongemak, privacyvragen, correctietijd en leerfase [3,6].                                                                                                   |
| Er is handelingsverlegenheid bij mbo-studenten rond spraakgestuurd SOEP-rapporteren.                         | Beperkt/indirect              | Direct onderzoek naar mbo + spraakgestuurd + SOEP is in de geraadpleegde bronnen niet gevonden. Onderbouwing komt uit EHR-documentatie, simulatie en structured note-taking bij verpleegkundestudenten [11-13]. |
| Simulatie en feedback kunnen documentatievaardigheid en zelfvertrouwen ondersteunen.                         | Redelijk onderbouwd           | BMC Nursing en scoping review over EMR-simulatie ondersteunen docentbegeleiding, feedback en simulatie-effecten [11,12].                                                                                        |
| AI-geletterdheid hoort onderdeel te zijn van de implementatie.                                               | Sterk onderbouwd              | EU AI Act artikel 4 vraagt maatregelen voor voldoende AI-geletterdheid; WHO en IGJ benoemen kennis van risico’s en beperkingen [14-16].                                                                         |
| De oefenbot zal automatisch leiden tot betere rapportages.                                                   | Onzeker/niet bewezen          | Dit moet in jouw eigen pilot worden onderzocht. Het rapport geeft ontwerpprincipes, geen effectbewijs voor de specifieke bot.                                                                                     |

## 12.1 Wat bewust niet als feit is gepresenteerd

- Dat een specifieke commerciële tool veilig of effectief is voor jouw onderwijssetting.
- Dat tijdwinst uit ambulante artsensettings één-op-één geldt voor mbo-studenten of langdurige zorg.

- Dat ambient listening al betrouwbaar is in groepsgesprekken of lawaaiige intramurale situaties.
- Dat studenten na één module handelingsverlegenheid kwijt zijn.

- Dat AI-output zonder menselijke controle geschikt is voor het dossier.
- Dat direct onderzoek naar mbo-studenten, SOEP en spraakgestuurd rapporteren al ruim beschikbaar is.

## 12.2 Belangrijkste kennishiaat

Het grootste kennishiaat is direct onderzoek naar mbo-studenten die spraakgestuurd rapporteren volgens SOEP leren met een oefenbot. Dat betekent niet dat het project onvoldoende basis heeft; het betekent wel dat jouw project juist kan bijdragen aan nieuwe praktijkkennis. Een sterke pilot met voor-/nameting, rubricbeoordeling en kwalitatieve feedback kan de kennisbank aanzienlijk versterken.

# 13. Bronnenlijst

Geraadpleegde kernbronnen. Webbronnen gecontroleerd op of rond 1 juni 2026. De nummers corresponderen met verwijzingen in de tekst.

**[1] NHG HIS-Referentiemodel - SOEP-verslag.** NHG. https://referentiemodel.nhg.org/node/19/. Gebruik in rapport: Definitie en onderdelen van SOEP: Subjectief, Objectief, Evaluatie, Plan.

**[2] Spraakgestuurd rapporteren in de zorg.** AI Zorg Academy / Practoraat Zorg en Technologie. https://aizorgacademy.nl/spraakgestuurd-rapporteren/. Gebruik in rapport: E-learning met modules over werking, goed inspreken, controleren, verantwoordelijkheid en privacy.

**[3] Spraakgestuurd rapporteren.** Vilans. https://www.vilans.nl/kennis/spraakgestuurd-rapporteren. Gebruik in rapport: Kennisdossier over inzet, kansen, zachte kosten en implementatie in ouderenzorg/gehandicaptenzorg.

**[4] Onderzoek naar spraakgestuurd rapporteren.** Vilans. https://www.vilans.nl/onderzoek-spraakgestuurd-rapporteren. Gebruik in rapport: Lopend/actueel onderzoek naar tijdsbesparing, werkplezier, rapportagekwaliteit en cliëntervaringen.

**[5] Spraakgestuurd rapporteren drie keer zo snel.** Vilans Magazine. https://www.vilansmagazine.nl/najaar-2025/inhoud/spraakgestuurd-rapporteren-drie-keer-sneller. Gebruik in rapport: Praktijkbericht over onderzoek waarin spraakgestuurd rapporteren 2 tot 3 keer sneller kan zijn dan typen, met aandacht voor veranderkundige kant.

**[6] Implementatietoolkit Spraakgestuurd rapporteren.** Waardigheid en trots / Vilans / Zorgvernieuwing in Versnelling. https://www.waardigheidentrots.nl/tools-tips/tools/implementatietoolkit-spraakgestuurd-rapporteren. Gebruik in rapport: Praktijkgerichte implementatietoolkit met stappen, voorbeelden, tips en ervaringen.

**[7] Evaluating the performance of artificial intelligence-based speech recognition for clinical documentation: a systematic review.** BMC Medical Informatics and Decision Making. https://link.springer.com/article/10.1186/s12911-025-03061-0. Gebruik in rapport: Systematische review van AI-spraakherkenning voor klinische documentatie; 29 studies, grote variatie in foutpercentages en noodzaak van menselijke review.

**[8] Digital scribes in health care: a systematic review and research agenda.** npj Digital Medicine. https://www.nature.com/articles/s41746-021-00432-5. Gebruik in rapport: Vroeg overzicht van digitale scribes; vooral technische validiteit onderzocht, minder klinische bruikbaarheid en praktijkwaarde.

**[9] Use of Ambient AI Scribes to Reduce Administrative Burden and Professional Burnout.** JAMA Network Open. https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2839542. Gebruik in rapport: Multicenter kwaliteitsverbeterstudie bij 263 ambulante clinici; associatie met minder burnout, lagere cognitieve taakbelasting en minder after-hours documentatie.

**[10] Barriers and opportunities of scaling ambient AI scribes for clinical documentation across diverse healthcare settings.** npj Digital Medicine. https://www.nature.com/articles/s41746-026-02554-0. Gebruik in rapport: Perspective over ambient AI-scribes in diverse settings; aandacht voor lawaai, multi-speaker, privacy, note bloat, interoperabiliteit en ontbrekende uitkomstdata.

**[11] Nursing students' perspectives on learning electronic health record documentation.** BMC Nursing. https://link.springer.com/article/10.1186/s12912-025-03320-5. Gebruik in rapport: Kwalitatieve studie onder verpleegkundestudenten over EHR-documentatie; belang van docentbegeleiding, peer learning, mentoring en feedback.

**[12] Use of electronic medical records in simulated nursing education and its educational outcomes: A scoping review.** Clinical Simulation in Nursing / Ewha repository. https://pure.ewha.ac.kr/en/publications/use-of-electronic-medical-records-in-simulated-nursing-education-. Gebruik in rapport: Scoping review: simulatie met EMR/ECD hangt samen met meer zelfvertrouwen, betere documentatie-accuratesse en informaticavaardigheden.

**[13] Strengthening academic and clinical performance through structured note-taking.** BMC Research Notes. https://link.springer.com/article/10.1186/s13104-025-07500-z. Gebruik in rapport: Actieonderzoek naar gestructureerde formats zoals SOAP en SBAR in verpleegkundeonderwijs.

**[14] WHO releases AI ethics and governance guidance for large multi-modal models.** World Health Organization. https://www.who.int/news/item/18-01-2024-who-releases-ai-ethics-and-governance-guidance-for-large-multi-modal-models. Gebruik in rapport: WHO benoemt toepassingen in EHR-documentatie en onderwijs, plus risico's zoals foutieve, incomplete of bevooroordeelde output en automation bias.

**[15] IGJ roept zorgaanbieders op om zorgvuldig om te gaan met generatieve AI.** Inspectie Gezondheidszorg en Jeugd. https://www.igj.nl/actueel/nieuws/2025/02/10/igj-roept-zorgaanbieders-op-om-zorgvuldig-om-te-gaan-met-generatieve-ai. Gebruik in rapport: Nederlandse toezichtbron over kansen en risico's van generatieve AI, inclusief dossier-samenvattingen en consultverslagen.

**[16] Article 4: AI literacy.** European Commission AI Act Service Desk. https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-4. Gebruik in rapport: AI Act artikel 4: aanbieders en gebruikers moeten zorgen voor voldoende AI-geletterdheid van medewerkers en anderen die met AI-systemen werken.

**[17] Medisch dossier.** KNMG. https://www.knmg.nl/actueel/dossiers/beroepsgeheim/medisch-dossier. Gebruik in rapport: WGBO-dossierplicht en belang van zorgvuldig bijgehouden dossier voor kwaliteit en continuïteit van zorg.

**[18] Gezondheidsgegevens in een dossier.** Autoriteit Persoonsgegevens. https://www.autoriteitpersoonsgegevens.nl/themas/gezondheid/gezondheidsgegevens-in-een-dossier. Gebruik in rapport: Rechten van patiënten rond gezondheidsgegevens en relatie met WGBO, Wabvpz en AVG.

**[19] Good Practice - Spraakgestuurd rapporteren met AI in de huisartsenpraktijk.** Coöperatie VGZ. https://www.cooperatievgz.nl/zorgaanbieders/zorgvernieuwing/ha-spraakgestuurd-rapporteren-met-ai-in-de-huisartsenpraktijk. Gebruik in rapport: Good practice waarin een AI-tool na het gesprek een verslag conform SOEP genereert.

# Bijlage A. Voorbeeldrubric voor beoordeling van een SOEP-rapportage

| **Scoregebied** | **Voldoende indicator**                                   | **Onvoldoende indicator**                                    |
|-----------------|-----------------------------------------------------------|--------------------------------------------------------------|
| S               | Cliëntperspectief staat centraal, duidelijk geformuleerd. | Student mengt eigen oordeel of objectieve observatie door S. |
| O               | Waarneembare of meetbare gegevens zijn concreet.          | Vage taal, oordeel, niet-meetbare claims.                    |
| E               | Inschatting is voorzichtig en onderbouwd.                 | Diagnose of conclusie buiten bevoegdheid.                    |
| P               | Plan is concreet, uitvoerbaar en afgestemd.               | Plan ontbreekt of is vaag.                                   |
| Taal            | Kort, respectvol, professioneel.                          | Te lang, informeel of stigmatiserend.                        |
| AI-controle     | Student controleert en corrigeert fouten.                 | Student neemt output ongewijzigd over.                       |
| Privacy         | Alleen noodzakelijke informatie.                          | Onnodige of herleidbare details.                             |

# Bijlage B. Voorbeeld van kenniscategorieën voor de kennisbank

- Definities en methodieken: SOEP, SBAR, zorgplangericht rapporteren.
- Technologie: spraakherkenning, taalmodellen, ambient AI-scribes, ECD-integratie.

- Leerpsychologie: scaffolding, self-efficacy, feedback, simulatie.
- Adoptie: implementatie, champions, training, workflow, werkdruk.

- Veiligheid: privacy, toestemming/transparantie, dataminimalisatie, menselijke controle.
- Kwaliteit: fouttypen, rapportagekwaliteit, note bloat, bias.

- Evaluatie: meetinstrumenten, rubrics, pilotdata, gebruikerservaring.

# Bijlage C. Mini-protocol voor een eerste pilot

1. Selecteer 2 tot 4 herkenbare fictieve casussen voor mbo-niveau 3/4.
2. Laat studenten vooraf een korte SOEP-rapportage maken zonder bot.

3. Laat studenten de e-learning of korte introductie volgen.
4. Laat studenten oefenen met de bot volgens de oefenladder.

5. Laat studenten na afloop een vergelijkbare rapportage maken.
6. Beoordeel beide rapportages met dezelfde rubric door minimaal twee beoordelaars als dat haalbaar is.

7. Meet handelingsverlegenheid met een korte vragenlijst voor en na.
8. Voer een korte focusgroep met studenten en docenten.

9. Analyseer niet alleen verbetering, maar ook welke fouten blijven terugkomen.
10. Voeg de resultaten toe aan de kennisbank als eigen praktijkbron.
