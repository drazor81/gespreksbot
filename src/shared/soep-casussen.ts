import type { PublicSoepCasus, SoepCategorie } from './soep-contract';

// SERVER-ONLY bron van waarheid voor de SOEP-casussen.
// Bevat verborgen velden (soepIjkpunten, valkuil, foutConcept, ordenItems[].juist)
// die NOOIT naar de browser mogen. De frontend importeert dit bestand niet;
// publieke velden gaan via toPublicCasus() en GET /api/soep-casussen.
// Inhoud overgenomen uit soepie/casusbank.md (eerste versie — inhoudelijk na te lopen).

export interface SoepOrdenItem {
  id: string;
  tekst: string;
  juist: SoepCategorie;
}

export interface SoepIjkpunten {
  s: string;
  o: string;
  e: string;
  p: string;
}

export interface SoepFoutConcept {
  s: string;
  o: string;
  e: string;
  p: string;
  ingebouwdeFouten: string[];
}

export interface SoepCasus {
  id: string;
  naam: string;
  setting: string;
  niveau: string;
  moeilijkheid: 'makkelijk' | 'gemiddeld' | 'lastig';
  casustekst: string;
  ordenItems: SoepOrdenItem[];
  soepIjkpunten: SoepIjkpunten;
  valkuil: string;
  foutConcept: SoepFoutConcept;
  contextvariant?: string;
}

// Didactische volgorde: makkelijk eerst, lastig achteraan (zachte ordening).
const SOEP_CASUSSEN: SoepCasus[] = [
  {
    id: 'van-dam',
    naam: 'Mevrouw Van Dam',
    setting: 'thuiszorg',
    niveau: '2 tot 4',
    moeilijkheid: 'makkelijk',
    casustekst:
      'Mevrouw Van Dam, 78 jaar, thuiszorg. Klaagt over pijn in haar linkerbeen bij het lopen. Bij inspectie zie je een rode plek ter grootte van een twee-euromunt op het linkerscheenbeen. De huid voelt warm aan. Ze heeft gisterenochtend haar steunkousen niet aangehad omdat ze "te strak zaten".',
    ordenItems: [
      { id: 'van-dam-1', tekst: 'Mevrouw geeft aan pijn te hebben in haar linkerbeen bij het lopen.', juist: 'S' },
      { id: 'van-dam-2', tekst: 'Mevrouw zegt dat haar steunkousen te strak zaten.', juist: 'S' },
      {
        id: 'van-dam-3',
        tekst: 'Er is een rode plek ter grootte van een twee-euromunt op het linkerscheenbeen.',
        juist: 'O'
      },
      { id: 'van-dam-4', tekst: 'De huid voelt warm aan.', juist: 'O' },
      { id: 'van-dam-5', tekst: 'Mevrouw heeft gisterochtend haar steunkousen niet gedragen.', juist: 'O' },
      {
        id: 'van-dam-6',
        tekst:
          'Mogelijk een beginnende huidirritatie of ontsteking, samenhangend met het niet dragen van de steunkousen.',
        juist: 'E'
      },
      { id: 'van-dam-7', tekst: 'Doorgeven aan de verpleegkundige en de huid later opnieuw controleren.', juist: 'P' }
    ],
    soepIjkpunten: {
      s: 'Mevrouw geeft aan pijn te hebben in haar linkerbeen bij het lopen; zegt dat de steunkousen te strak zaten.',
      o: 'Rode plek ter grootte van een twee-euromunt op het linkerscheenbeen; de huid voelt warm aan; mevrouw heeft gisterochtend de steunkousen niet gedragen.',
      e: 'Mogelijk een beginnende huidirritatie of ontsteking, mogelijk samenhangend met het niet dragen van de steunkousen.',
      p: 'Doorgeven aan de verpleegkundige; de huid later opnieuw controleren; het dragen van de steunkousen met mevrouw bespreken.'
    },
    valkuil:
      '"rood en warm" zijn waarnemingen (O). "Ontstoken" is een inschatting (E). De student moet die niet door elkaar halen.',
    foutConcept: {
      s: 'Mevrouw Van Dam geeft aan pijn te hebben in haar rechterbeen bij het lopen.',
      o: 'Rode plek op het scheenbeen; de huid is ontstoken.',
      e: 'Beginnende ontsteking doordat ze haar steunkousen heeft gedragen.',
      p: 'Doorgegeven aan de verpleegkundige; de huid later opnieuw controleren.',
      ingebouwdeFouten: [
        '"rechterbeen" moet linkerbeen zijn — zijde-/transcriptiefout',
        '"is ontstoken" is een inschatting en hoort onder E, niet onder O',
        'omgedraaide oorzaak — ze heeft de steunkousen juist niet gedragen'
      ]
    },
    contextvariant:
      'Je staat bij mevrouw in de woonkamer terwijl haar dochter op bezoek is. Spreek je hier hardop in, of kies je een ander moment of een andere werkwijze?'
  },
  {
    id: 'jansen',
    naam: 'De heer Jansen',
    setting: 'verpleeghuis',
    niveau: '2 tot 4',
    moeilijkheid: 'gemiddeld',
    casustekst:
      'De heer Jansen, 84 jaar, verpleeghuis. Heeft tijdens de lunch slecht gegeten (minder dan een kwart van zijn bord). Herkende zijn dochter niet tijdens bezoek. Is onrustig geweest en heeft meerdere keren gevraagd "wanneer hij naar huis mag". Bloeddruk 145/90, temperatuur normaal.',
    ordenItems: [
      { id: 'jansen-1', tekst: 'Meneer vraagt meermaals wanneer hij naar huis mag.', juist: 'S' },
      { id: 'jansen-2', tekst: 'Meneer at tijdens de lunch minder dan een kwart van zijn bord.', juist: 'O' },
      { id: 'jansen-3', tekst: 'Meneer herkende zijn dochter niet tijdens het bezoek.', juist: 'O' },
      { id: 'jansen-4', tekst: 'Meneer is onrustig geweest.', juist: 'O' },
      { id: 'jansen-5', tekst: 'Bloeddruk 145/90, temperatuur normaal.', juist: 'O' },
      {
        id: 'jansen-6',
        tekst: 'Mogelijk toegenomen verwardheid of desoriëntatie; de verminderde voedingsinname is een aandachtspunt.',
        juist: 'E'
      },
      {
        id: 'jansen-7',
        tekst: 'Melden bij de verpleegkundige of arts en de oriëntatie blijven observeren.',
        juist: 'P'
      }
    ],
    soepIjkpunten: {
      s: 'Meneer vraagt meermaals wanneer hij naar huis mag.',
      o: 'At minder dan een kwart van zijn bord; herkende zijn dochter niet; onrustig gedrag; bloeddruk 145/90; temperatuur normaal.',
      e: 'Mogelijk toegenomen verwardheid of desoriëntatie; de verminderde voedingsinname is een aandachtspunt.',
      p: 'Intake en oriëntatie blijven observeren; melden bij de verpleegkundige of arts; mogelijke oorzaak van de verwardheid laten beoordelen.'
    },
    valkuil:
      '"verward" is een interpretatie (E). De waarneming (O) is concreet: herkende zijn dochter niet en vroeg meermaals wanneer hij naar huis mag.',
    foutConcept: {
      s: 'Meneer Jansen vraagt meermaals wanneer hij naar huis mag.',
      o: 'At minder dan een kwart van zijn bord; herkende zijn dochter; bloeddruk 154/90; temperatuur normaal.',
      e: 'Mogelijk toegenomen verwardheid; de verminderde inname is een aandachtspunt.',
      p: 'Intake en oriëntatie blijven observeren; melden bij de verpleegkundige of arts.',
      ingebouwdeFouten: [
        '"herkende zijn dochter" — omgedraaide ontkenning, moet "herkende zijn dochter niet"',
        'bloeddruk 154/90 moet 145/90 zijn — getalfout',
        '"verward" mag niet als losse term onder O sluipen, dat is een inschatting (E)'
      ]
    },
    contextvariant:
      'Het is druk in de huiskamer en andere bewoners en bezoek zitten dichtbij. Hardop rapporteren hier, of niet?'
  },
  {
    id: 'youssef',
    naam: 'Youssef',
    setting: 'gehandicaptenzorg',
    niveau: '2 tot 4',
    moeilijkheid: 'gemiddeld',
    casustekst:
      'Youssef, 32 jaar, gehandicaptenzorg. Had vanmiddag een conflict met een medebewoner over de televisie. Schreeuwde en gooide een kussen. Is nu rustig op zijn kamer, reageert kort, maakt geen oogcontact. Geeft aan "het niet meer te willen uitleggen".',
    ordenItems: [
      { id: 'youssef-1', tekst: 'Youssef geeft aan het niet meer te willen uitleggen.', juist: 'S' },
      {
        id: 'youssef-2',
        tekst: 'Youssef had vanmiddag een conflict met een medebewoner over de televisie.',
        juist: 'O'
      },
      { id: 'youssef-3', tekst: 'Youssef schreeuwde en gooide een kussen.', juist: 'O' },
      {
        id: 'youssef-4',
        tekst: 'Youssef is nu rustig op zijn kamer, reageert kort en maakt geen oogcontact.',
        juist: 'O'
      },
      {
        id: 'youssef-5',
        tekst: 'Youssef lijkt teruggetrokken en gespannen na het incident; mogelijk schaamte of frustratie.',
        juist: 'E'
      },
      { id: 'youssef-6', tekst: 'Rust geven en later terugkomen voor een gesprek; het incident melden.', juist: 'P' }
    ],
    soepIjkpunten: {
      s: 'Youssef geeft aan "het niet meer te willen uitleggen".',
      o: 'Had een conflict met een medebewoner over de televisie; schreeuwde en gooide een kussen; is nu rustig op zijn kamer; reageert kort; maakt geen oogcontact.',
      e: 'Lijkt teruggetrokken en gespannen na het incident; mogelijk schaamte of frustratie.',
      p: 'Rust geven en later terugkomen voor een gesprek; het incident melden; afspraken over tv-gebruik bespreken.'
    },
    valkuil:
      '"boos" of "gefrustreerd" is een inschatting (E). Onder O hoort het waarneembare gedrag: schreeuwen, kussen gooien, kort reageren, geen oogcontact.',
    foutConcept: {
      s: 'Youssef geeft aan het niet meer te willen uitleggen.',
      o: 'Had een conflict over de televisie; was erg boos en agressief; is nu rustig op zijn kamer; reageert kort.',
      e: 'Lijkt teruggetrokken na het incident; mogelijk schaamte of frustratie.',
      p: 'Rust geven en later terugkomen; het incident melden; medicatie aanpassen.',
      ingebouwdeFouten: [
        '"erg boos en agressief" is een oordeel onder O; de waarneming is: schreeuwde en gooide een kussen',
        '"medicatie aanpassen" is een toegevoegd, niet-ingesproken detail dat buiten de bevoegdheid valt'
      ]
    },
    contextvariant:
      'Een medebewoner loopt mee de gang op terwijl je over het incident wilt rapporteren. Hoe ga je daarmee om?'
  },
  {
    id: 'okeke',
    naam: 'Mevrouw Okeke',
    setting: 'wijkverpleging',
    niveau: '2 tot 4',
    moeilijkheid: 'lastig',
    casustekst:
      'Mevrouw Okeke, 67 jaar, wijkverpleging. Wond aan het linker onderbeen na een operatie 12 dagen geleden. Het wondvocht is licht toegenomen ten opzichte van gisteren en is gelig van kleur. De omliggende huid is niet rood. Mevrouw geeft aan minder pijn te hebben dan gisteren en slaapt weer beter.',
    ordenItems: [
      {
        id: 'okeke-1',
        tekst: 'Mevrouw geeft aan minder pijn te hebben dan gisteren en weer beter te slapen.',
        juist: 'S'
      },
      { id: 'okeke-2', tekst: 'Wond aan het linker onderbeen, 12 dagen na de operatie.', juist: 'O' },
      {
        id: 'okeke-3',
        tekst: 'Het wondvocht is licht toegenomen ten opzichte van gisteren en is gelig van kleur.',
        juist: 'O'
      },
      { id: 'okeke-4', tekst: 'De omliggende huid is niet rood.', juist: 'O' },
      {
        id: 'okeke-5',
        tekst: 'Gemengd beeld: pijn en slaap verbeteren, maar het toegenomen, gelige wondvocht vraagt aandacht.',
        juist: 'E'
      },
      {
        id: 'okeke-6',
        tekst:
          'De toename en kleur van het wondvocht melden aan de verpleegkundige of arts en de wond blijven observeren.',
        juist: 'P'
      }
    ],
    soepIjkpunten: {
      s: 'Mevrouw geeft aan minder pijn te hebben dan gisteren en weer beter te slapen.',
      o: 'Wond aan het linker onderbeen, 12 dagen na de operatie; wondvocht licht toegenomen ten opzichte van gisteren, gelig van kleur; omliggende huid niet rood.',
      e: 'Gemengd beeld: pijn en slaap verbeteren, maar het toegenomen, gelige wondvocht vraagt aandacht (mogelijk teken van infectie, al is de huid niet rood).',
      p: 'De wond blijven observeren; de toename en kleur van het wondvocht melden aan de verpleegkundige of arts; vervolgcontrole afspreken.'
    },
    valkuil:
      'De signalen spreken elkaar deels tegen. Subjectief gaat het beter (S), objectief is er een aandachtspunt (O). Alleen "het gaat goed" rapporteren mist de toename van het wondvocht.',
    foutConcept: {
      s: 'Mevrouw Okeke geeft aan minder pijn te hebben en weer beter te slapen.',
      o: 'Wond aan het linker onderbeen; wondvocht gelig; de omliggende huid is rood.',
      e: 'Het gaat de goede kant op.',
      p: 'De wond blijven observeren.',
      ingebouwdeFouten: [
        '"huid is rood" — omgedraaide waarneming, de huid is juist niet rood',
        'weggelaten kritisch gegeven: het wondvocht is toegenomen ten opzichte van gisteren',
        'de evaluatie "het gaat de goede kant op" is te geruststellend en mist het aandachtspunt'
      ]
    },
    contextvariant:
      'Je loopt achter op je route en hebt nog drie cliënten te gaan. Verleidt die tijdsdruk je tot te kort of te snel rapporteren?'
  },
  {
    id: 'stefan',
    naam: 'Stefan',
    setting: 'jeugdzorg',
    niveau: '2 tot 4',
    moeilijkheid: 'lastig',
    casustekst:
      'Stefan, 16 jaar, jeugdzorg. Is vandaag niet op school geweest zonder melding. Thuisgekomen om 16:30, reageert kort op vragen, maakt geen oogcontact. Trekt zich terug op zijn kamer. Heeft bij het avondeten wel mee gegeten, maar zegt niets.',
    ordenItems: [
      { id: 'stefan-1', tekst: 'Stefan zegt zelf niets en geeft niets aan over hoe het met hem gaat.', juist: 'S' },
      { id: 'stefan-2', tekst: 'Stefan is vandaag zonder melding niet op school geweest.', juist: 'O' },
      { id: 'stefan-3', tekst: 'Stefan kwam thuis om 16:30, reageert kort en maakt geen oogcontact.', juist: 'O' },
      { id: 'stefan-4', tekst: 'Stefan trekt zich terug op zijn kamer.', juist: 'O' },
      { id: 'stefan-5', tekst: 'Stefan heeft bij het avondeten wel mee gegeten.', juist: 'O' },
      {
        id: 'stefan-6',
        tekst: 'Mogelijk speelt er iets; het teruggetrokken gedrag is een signaal om serieus te nemen.',
        juist: 'E'
      },
      {
        id: 'stefan-7',
        tekst: 'Laagdrempelig contact houden, gedrag observeren en overleggen met de mentor of gedragswetenschapper.',
        juist: 'P'
      }
    ],
    soepIjkpunten: {
      s: 'Stefan zegt niets en geeft niets aan. Dat er weinig subjectieve informatie is, is op zich een observatie waard.',
      o: 'Niet op school geweest zonder melding; thuisgekomen om 16:30; reageert kort; geen oogcontact; trekt zich terug op zijn kamer; heeft wel mee gegeten.',
      e: 'Mogelijk speelt er iets (bijvoorbeeld op school of qua stemming); het teruggetrokken gedrag is een signaal om serieus te nemen.',
      p: 'Laagdrempelig contact en beschikbaar zijn; gedrag observeren; overleggen met mentor of gedragswetenschapper; het schoolverzuim navragen.'
    },
    valkuil:
      'Er is weinig S beschikbaar. De student moet niet verzinnen wat Stefan "voelt". Een aanname onder S invullen is hier de fout.',
    foutConcept: {
      s: 'Stefan vertelt dat hij ruzie had op school en zich somber voelt.',
      o: 'Niet op school geweest zonder melding; thuisgekomen om 16:30; reageert kort; geen oogcontact; heeft wel mee gegeten.',
      e: 'Mogelijk speelt er iets; het teruggetrokken gedrag is serieus te nemen.',
      p: 'Laagdrempelig contact houden; gedrag observeren; overleggen met de mentor.',
      ingebouwdeFouten: [
        'de volledige S is verzonnen — Stefan heeft niets verteld; juist hier hoort: "Stefan geeft niets aan"'
      ]
    },
    contextvariant:
      'De mentor vraagt in de groepsapp van het team wat er met Stefan aan de hand is. Wat deel je daar wel en niet, en waarom?'
  }
];

const SOEP_CASUS_INDEX: ReadonlyMap<string, SoepCasus> = new Map(SOEP_CASUSSEN.map((casus) => [casus.id, casus]));

/** Zoekt een volledige casus (incl. verborgen velden) op id. Server-only. */
export function getSoepCasusById(id: string): SoepCasus | undefined {
  return SOEP_CASUS_INDEX.get(id);
}

/** Maakt een student-veilige projectie zonder verborgen velden. */
export function toPublicCasus(casus: SoepCasus): PublicSoepCasus {
  return {
    id: casus.id,
    naam: casus.naam,
    setting: casus.setting,
    casustekst: casus.casustekst,
    ordenItems: casus.ordenItems.map((item) => ({ id: item.id, tekst: item.tekst })),
    ...(casus.contextvariant ? { contextvariant: casus.contextvariant } : {})
  };
}

/** Alle casussen als publieke projectie, in didactische volgorde (makkelijk eerst). */
export function getPublicSoepCasussen(): PublicSoepCasus[] {
  return SOEP_CASUSSEN.map(toPublicCasus);
}
