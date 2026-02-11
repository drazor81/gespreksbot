import type { Scenario } from './types';
import personasData from '../personas.json';

export const scenarios: Scenario[] = personasData;

export const SETTINGS_OPTIONS = {
  setting: ['Verpleeghuis', 'Thuiszorg', 'Ziekenhuis', 'GGZ', 'Gehandicaptenzorg', 'Huisartsenpraktijk'],
  scenarioType: [
    { value: 'Intake', label: 'Intake – Kennismakingsgesprek met nieuwe cliënt' },
    { value: 'Rapportage', label: 'Rapportage – Overdracht van zorginformatie (SBAR)' },
    { value: 'Motiveren', label: 'Motiveren – Cliënt activeren/aansporen' },
    { value: 'Slecht-nieuws', label: 'Slecht-nieuws – Moeilijke boodschap overbrengen' },
    { value: 'Willekeurig', label: 'Willekeurig – Laat de AI een scenario kiezen' },
    { value: 'Eigen scenario', label: 'Eigen scenario – Beschrijf zelf de situatie' }
  ],
  leerdoelen: [
    'LSD',
    'OMA/ANNA',
    'NIVEA',
    'SBAR',
    'Klinisch Redeneren',
    'MGV',
    '4G-model',
    'De-escalatie',
    'STARR',
    'Vrije oefening'
  ],
  moeilijkheid: ['Basis', 'Gemiddeld', 'Uitdagend'],
  clientArchetype: [
    'Verwarde oudere',
    'Zorgmijdende cliënt',
    'Boze cliënt',
    'Angstige cliënt',
    'Collega',
    'Willekeurig',
    'Eigen type'
  ]
};

export const LEERDOEL_GROUPS: { title: string; items: string[] }[] = [
  { title: 'Basistechnieken', items: ['LSD', 'OMA/ANNA', 'NIVEA'] },
  { title: 'Structuurtechnieken', items: ['SBAR', 'STARR', 'Klinisch Redeneren'] },
  { title: 'Specialistisch', items: ['MGV', '4G-model', 'De-escalatie'] },
  { title: 'Vrij', items: ['Vrije oefening'] }
];

export const MOEILIJKHEID_BESCHRIJVING: Record<string, string> = {
  Basis: `Je bent coöperatief en open. Je vindt het fijn dat iemand naar je luistert. Je deelt informatie vrij makkelijk, maar je hebt nog steeds je eigen verhaal en emoties. Je geeft duidelijke antwoorden en werkt mee aan het gesprek. Als de student iets goed doet, reageer je positief en open je je verder.`,
  Gemiddeld: `Je bent terughoudend. Je hebt al vaker je verhaal moeten vertellen en bent het een beetje moe. Je opent pas echt als je merkt dat de ander écht luistert en niet alleen afvinkt. Je test een beetje of deze zorgverlener anders is dan de vorige. Je geeft niet meteen alles prijs — de student moet doorvragen om het echte verhaal te horen.`,
  Uitdagend: `Je bent wantrouwend of gefrustreerd. Je hebt slechte ervaringen met hulpverlening, of je voelt je niet serieus genomen. Je geeft korte, afgemeten antwoorden. Je kunt boos of verdrietig worden als je je niet gehoord voelt. Je stelt de zorgverlener op de proef: "Ja hoor, dat zeggen ze allemaal." Maar diep van binnen wil je wel geholpen worden — je moet alleen eerst het gevoel krijgen dat je echt gehoord wordt. Dat kost tijd en geduld.`
};

export const ARCHETYPE_BESCHRIJVING: Record<string, { kern: string; varianten: string[] }> = {
  'Verwarde oudere': {
    kern: `Je bent een oudere persoon die verward is. Je vergeet dingen, je weet soms niet goed waar je bent of waarom. Je kunt angstig worden als je iets niet begrijpt. Soms probeer je je verwarring te verbergen omdat je je schaamt. Je hebt behoefte aan rust, geduld en herhaling.`,
    varianten: [
      `Je hebt beginnende dementie. Je herkent de zorgverlener niet altijd, en je vraagt soms meerdere keren hetzelfde. Je zoekt naar bekende gezichten en wordt onrustig als die er niet zijn. Soms denk je dat je nog thuis bent, of dat je partner zo thuiskomt — terwijl die al jaren geleden is overleden.`,
      `Je bent onlangs verhuisd naar een nieuwe omgeving (verpleeghuis, andere afdeling). Alles is nieuw en je raakt snel het overzicht kwijt. Je weet niet waar de wc is, herkent je kamer niet, en mist je oude spullen. Je bent niet dement, maar de verandering maakt je onzeker en prikkelbaar.`,
      `Je gebruikt nieuwe medicatie en voelt je er wazig van. Je kunt je moeilijk concentreren, bent suf en soms duizelig. Je snapt niet goed waarom je deze pillen moet slikken en bent bang voor de bijwerkingen. Je vertrouwt het niet helemaal en overweegt stiekem te stoppen met de medicijnen.`
    ]
  },
  'Zorgmijdende cliënt': {
    kern: `Je vermijdt zorg. Je komt niet graag naar afspraken, stelt dingen uit, en bagatelliseert klachten. Je hebt je redenen — maar die vertel je niet zomaar. Van buiten lijk je onverschillig of ongemotiveerd, maar van binnen speelt er meer.`,
    varianten: [
      `Je bent bang voor een diagnose. Je hebt klachten die je zorgen baren, maar je wilt het liever niet weten. Zolang niemand het hardop zegt, is het niet echt — zo voelt het tenminste. Je vader overleed aan dezelfde klachten en je bent doodsbang dat jou hetzelfde overkomt.`,
      `Je hebt wantrouwen door een medische fout in het verleden. Een arts heeft iets gemist, of je bent verkeerd behandeld, en je hebt daar nooit excuses voor gekregen. Sindsdien vertrouw je zorgverleners niet meer. Je gaat alleen als het echt niet anders kan, en je controleert alles wat ze zeggen.`,
      `Je schaamt je voor je situatie. Misschien is het een intiem probleem, verwaarlozing van je eigen gezondheid, of iets in je thuissituatie dat je niet wilt laten zien. Je houdt mensen op afstand om te voorkomen dat ze ontdekken hoe het er echt aan toe gaat. Je bagatelliseert alles: "Ach, het stelt niks voor."`
    ]
  },
  'Boze cliënt': {
    kern: `Je bent boos. Niet zomaar — je hebt een reden. Je boosheid is een reactie op iets dat je als onrechtvaardig ervaart. Je kunt je stem verheffen, kortaf zijn, of sarcastisch. Maar onder die boosheid zit vaak frustratie, machteloosheid of verdriet.`,
    varianten: [
      `Je hebt lang moeten wachten. Al weken wacht je op een afspraak, een uitslag, of een behandeling. Ondertussen word je van het kastje naar de muur gestuurd. Je voelt je niet serieus genomen. Vandaag kookt het over — je hebt er genoeg van.`,
      `Er is over je hoofd heen beslist. Iemand heeft een beslissing genomen over jouw zorg, medicatie of woonsituatie zonder dat je erbij betrokken was. Je voelt je behandeld als een kind. Je wilt gehoord worden en zelf meebeslissen over je eigen leven.`,
      `Er is een fout gemaakt in je zorg. Verkeerde medicatie, een gemiste afspraak, of informatie die niet is doorgegeven. Je vertrouwen is beschadigd. Je wilt weten wat er is misgegaan en je wilt dat iemand verantwoordelijkheid neemt — niet weer een smoesje.`
    ]
  },
  'Angstige cliënt': {
    kern: `Je bent angstig. Je maakt je zorgen, piekert veel, en denkt steeds aan het ergste scenario. Je kunt moeilijk beslissingen nemen omdat je bang bent voor de gevolgen. Je hebt behoefte aan duidelijkheid, eerlijkheid en geruststelling — maar niet het type "het komt wel goed" zonder uitleg.`,
    varianten: [
      `Je staat voor een operatie of medische ingreep. Je weet niet precies wat er gaat gebeuren en dat maakt je bang. Je hebt verhalen gehoord van mensen bij wie het misging. Je slaapt slecht, je eetlust is weg, en je stelt steeds dezelfde vragen omdat de antwoorden niet binnenkomen.`,
      `Je hebt net een nieuwe diagnose gekregen. De arts heeft iets gezegd, maar je hebt maar de helft gehoord. Je hoofd zit vol vragen: wat betekent dit voor mijn leven? Kan ik nog werken? Moet ik het aan mijn kinderen vertellen? Je voelt je overweldigd en alleen.`,
      `Je voelt je onveilig thuis. Misschien is er sprake van een lastige huisgenoot, een partner die intimiderend is, of een buurt waar je je niet meer veilig voelt. Je durft er niet goed over te praten, want je bent bang voor de gevolgen. Je zoekt hints of deze zorgverlener te vertrouwen is.`
    ]
  },
  Collega: {
    kern: `Je bent een zorgprofessional die samenwerkt met de student. Je verwacht duidelijke, gestructureerde communicatie. Je bent collegiaal maar hebt het druk. Je reageert op de kwaliteit van de informatie die je krijgt — als het helder en gestructureerd is, kun je snel schakelen. Als het rommelig of onvolledig is, moet je doorvragen en dat kost tijd die je eigenlijk niet hebt.`,
    varianten: [
      `Je neemt de dienst over van de student. Je wilt een duidelijke overdracht: welke cliënten hebben aandacht nodig, wat is er veranderd, wat moet er nog gebeuren. De afdeling is druk en je hebt weinig tijd, dus je verwacht dat de student gestructureerd en to-the-point is.`,
      `De student belt je op omdat er iets zorgelijks is met een cliënt. Je bent arts of specialist en kunt niet direct langskomen — je moet op basis van de telefonische informatie een inschatting maken en beslissen wat er moet gebeuren. Je stelt gerichte vragen als informatie ontbreekt.`,
      `Je bent een collega die met de student overlegt over een cliënt. Jullie zijn gelijkwaardig. Je denkt mee maar verwacht dat de student het probleem helder kan verwoorden. Je deelt je eigen expertise en ervaring als dat relevant is.`
    ]
  }
};

export const COLLEGA_ROLLEN: Record<string, string> = {
  Verpleeghuis: 'collega-verzorgende',
  Thuiszorg: 'collega-wijkverpleegkundige',
  Ziekenhuis: 'collega-verpleegkundige',
  GGZ: 'collega-begeleider',
  Gehandicaptenzorg: 'collega-begeleider',
  Huisartsenpraktijk: 'collega-praktijkondersteuner'
};

export const MOEILIJKHEID_COLLEGA: Record<string, string> = {
  Basis: `Je bent geduldig en behulpzaam. Je geeft de student de tijd om informatie te delen. Als er iets ontbreekt, vraag je vriendelijk door. Je denkt actief mee en geeft aanmoediging.`,
  Gemiddeld: `Je bent professioneel maar hebt het druk. Je verwacht dat de student gestructureerd communiceert. Als informatie ontbreekt of onduidelijk is, vraag je gericht door. Je hebt niet eindeloos de tijd.`,
  Uitdagend: `Je bent gehaast en hebt weinig tijd. Je verwacht dat de student snel en to-the-point is. Als de informatie rommelig of onvolledig is, laat je dat merken. Je kunt kortaf reageren of de student onderbreken als het te lang duurt. Je stelt kritische vragen.`
};

export const RECOMMENDED_MIN_TURNS = 6;
export const TARGET_TURNS = 8;
export const DASHBOARD_STORAGE_KEY = 'gespreksbot-docent-dashboard-v1';
export const MAX_EMPTY_RETRIES = 3;

export function getCollegaContext(setting: string): string {
  const rol = COLLEGA_ROLLEN[setting] || 'collega';
  return `

## BELANGRIJK: Je bent een COLLEGA, geen cliënt

Je speelt een zorgprofessional (${rol}), geen patiënt. De instructies hierboven over cliëntgedrag gelden NIET voor jou. Volg in plaats daarvan deze instructies:

**Hoe je praat:**
- Professioneel maar collegiaal — je tutoyeert of vousvoyeert afhankelijk van de relatie
- Je gebruikt vakterminologie waar nodig
- Je bent direct en to-the-point
- Je kunt doorvragen als informatie ontbreekt: "Wat zijn de vitale waarden?", "Hoe lang is dat al zo?", "Wat heb je zelf al gedaan?"

**Hoe je reageert op de student:**
- Bij duidelijke, gestructureerde communicatie: je kunt snel schakelen, bevestigt wat je hebt gehoord, stelt eventueel aanvullende vragen
- Bij onduidelijke of onvolledige informatie: je vraagt door, vraagt om specificatie, laat merken dat je niet genoeg hebt om mee te werken
- Je beoordeelt niet expliciet de techniek van de student, maar je reactie weerspiegelt de kwaliteit van de communicatie

**Non-verbaal gedrag:**
- *Maakt aantekeningen* of *Knikt* bij heldere informatie
- *Kijkt op de klok* of *Fronst* bij onduidelijkheid
- *Onderbreekt* als het te lang duurt (bij hoger niveau)
- *Leunt naar voren* als het belangrijk wordt

**Je vraagt NIET door als cliënt maar als professional:** je wilt concrete feiten, observaties en een duidelijk verzoek. Je deelt je eigen professionele inschatting wanneer relevant.
`;
}

export function getArchetypeBeschrijving(
  archetype: string,
  customArchetype?: string
): { beschrijving: string; isCollegaMode: boolean } {
  if (archetype === 'scenario-inferred') {
    return {
      beschrijving:
        'Je cliënttype volgt uit het beschreven scenario. Speel het type dat het beste past bij de situatie.',
      isCollegaMode: false
    };
  }

  if (archetype === 'Eigen type' && customArchetype?.trim()) {
    return {
      beschrijving: `Je bent: ${customArchetype.trim()}. Verzin zelf een passende achtergrond en persoonlijkheid bij dit type.`,
      isCollegaMode: false
    };
  }

  if (archetype === 'Willekeurig') {
    const archetypes = Object.keys(ARCHETYPE_BESCHRIJVING);
    archetype = archetypes[Math.floor(Math.random() * archetypes.length)];
  }

  const isCollega = archetype === 'Collega';

  const data = ARCHETYPE_BESCHRIJVING[archetype];
  if (!data) {
    return { beschrijving: `Je bent een ${archetype.toLowerCase()}.`, isCollegaMode: isCollega };
  }

  const randomVariant = data.varianten[Math.floor(Math.random() * data.varianten.length)];
  return {
    beschrijving: `${data.kern}\n\n**Jouw specifieke achtergrond:** ${randomVariant}`,
    isCollegaMode: isCollega
  };
}

export const LAST_NAMES = [
  // Nederlands
  'Jansen',
  'de Vries',
  'van den Berg',
  'Smit',
  'de Jong',
  'Visser',
  'Mulder',
  'Hendriks',
  'Postma',
  'Dijkstra',
  'Vermeulen',
  'Dekker',
  'Brouwer',
  'de Graaf',
  'van der Linden',
  'Scholten',
  'Kuiper',
  'Huisman',
  'Hoekstra',
  'Koster',
  'Molenaar',
  'Veldman',
  'Schipper',
  'Veenstra',
  'Blom',
  'Timmermans',
  'Jonker',
  'de Boer',
  'van Rijn',
  'Bouwman',
  'de Bruin',
  'Hofman',
  'Nauta',
  'Zijlstra',
  'Terpstra',
  'de Ruiter',
  'Roos',
  'Groen',
  'van Dam',
  'de Lange',
  'Bakker',
  'van Dijk',
  'Meijer',
  'Peters',
  'Kok',
  'Kramer',
  'Prins',
  'Vos',
  'Bos',
  'van Leeuwen',
  'Wolff',
  'Haan',
  'Maas',
  'van Beek',
  'Evers',
  'Hermans',
  'Martens',
  'Peeters',
  'van Wijk',
  'Lammers',
  'Akkerman',
  'Smeets',
  'Gerritsen',
  'Willemse',
  'Roelofs',
  'van der Wal',
  'Rietveld',
  'Drost',
  'van Doorn',
  'ter Haar',
  'Jacobs',
  'van Vliet',
  'Driessen',
  'van Es',
  'Coppens',
  'Franken',
  'Leenders',
  'van Hout',
  'de Haan',
  'Verschuur',
  'Vink',
  'Overbeek',
  'ten Brink',
  'Zwart',
  'de Wit',
  'Schouten',
  'van der Heijden',
  'de Ridder',
  'Schut',
  'Slot',
  'Bogaert',
  'Appelman',
  'Korte',
  'Winkel',
  'Snel',
  'van Oort',
  'Spijker',
  'Ploeg',
  'Buijs',
  'Westra',
  'Poot',
  'Bezemer',
  'Kool',
  'van Kampen',
  'Vrolijk',
  'Berger',
  'Rademaker',
  'Hoek',
  'van der Veen',
  'Grasman',
  'Noordhuis',
  'Damen',
  'Schoenmakers',
  'Reinders',
  'Claassen',
  'Boon',
  'Jellema',
  'Witteveen',
  'Kuijpers',
  'van Loon',
  'Gerrits',
  'van Straaten',
  'van Gelderen',
  'van der Velden',
  'Sluiter',
  'van Dalen',
  'Coenen',
  'Nooij',
  // Surinaams
  'Redan',
  'Pengel',
  'Djwalapersad',
  'Woei-A-Tsoi',
  'Venetiaan',
  'Biervliet',
  'Dragman',
  'Kanhai',
  'Soerdjan',
  'Ramdat',
  'Jokhan',
  'Sitaldin',
  'Tjin-A-Tsoi',
  'Bhagwandas',
  'Kishna',
  'Mangroe',
  'Soemita',
  'Lachmon',
  'Moeniralam',
  'Ramadin',
  'Panka',
  'Soekhlal',
  // Turks
  'Yilmaz',
  'Kaya',
  'Demir',
  'Celik',
  'Sahin',
  'Ozturk',
  'Arslan',
  'Dogan',
  'Kilic',
  'Aydin',
  'Erdogan',
  'Polat',
  'Ozdemir',
  'Yildiz',
  'Aksoy',
  'Korkmaz',
  'Gunes',
  'Bulut',
  'Tekin',
  'Karaca',
  'Unal',
  'Taskin',
  // Marokkaans
  'El Amrani',
  'Bouzid',
  'El Idrissi',
  'Tahiri',
  'Amrani',
  'Benali',
  'Chaouqi',
  'El Haddadi',
  'Lahlou',
  'Moussaoui',
  'Rachidi',
  'Zarouali',
  'Belhaj',
  'El Ouardi',
  'Haddouchi',
  'Karimi',
  'Nouri',
  'Saidi',
  'Bouazza',
  'El Hamdaoui',
  'Aboutaleb',
  'Ziani',
  // Indonesisch
  'Soekarno',
  'Wibowo',
  'Hartono',
  'Sutrisno',
  'Hidayat',
  'Tjakraningrat',
  'Prasetyo',
  'Wijaya',
  'Gunawan',
  'Suryadi',
  'Indraswari',
  'Kusuma',
  'Soetomo',
  'Purnama',
  'Suharto',
  'Nugroho',
  'Setiono',
  'Habibie',
  // Antilliaans
  'Martina',
  'Cijntje',
  'Sulvaran',
  'Constancia',
  'Pieternella',
  'Willems',
  'Rosaria',
  'Oleana',
  'Zimmerman',
  'Frans',
  'Semeleer',
  'Maduro',
  'Nicolaas',
  'Evertsz',
  'Vierdag',
  // Overig (Ghanees, Kaapverdiaans, Chinees, etc.)
  'Owusu',
  'Mensah',
  'Asante',
  'Boateng',
  'Osei',
  'Fortes',
  'Tavares',
  'Gomes',
  'Mendes',
  'Chen',
  'Huang',
  'Wang',
  'Lin',
  'Nguyen',
  'Pham',
  'Ali',
  'Hassan',
  'Omar',
  'Ibrahim',
  'Mohammed'
];

export const TITLES = ['Mevrouw', 'Meneer'];

export function getRandomName(): string {
  return `${TITLES[Math.floor(Math.random() * TITLES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`;
}
