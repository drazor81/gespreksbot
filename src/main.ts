import './style.css'
import personasData from '../personas.json'
import { SYSTEM_PROMPT_MBO_V2 } from './prompts/system-prompt'
import { getClientInstructies, getCoachContext, getTheorieVoorStudent } from './knowledge'

interface Persona {
  name: string;
  age: number;
  tone: string;
  situation: string;
  background: string;
  emotion: string;
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  persona: Persona;
}

const SYSTEM_PROMPT_MBO = SYSTEM_PROMPT_MBO_V2;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/chat';
let conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [];

const scenarios: Scenario[] = personasData;
let currentScenario: Scenario | null = null;

const SETTINGS_OPTIONS = {
  setting: ["Verpleeghuis", "Thuiszorg", "Ziekenhuis", "GGZ", "Gehandicaptenzorg", "Huisartsenpraktijk"],
  scenarioType: [
    { value: "Intake", label: "Intake – Kennismakingsgesprek met nieuwe cliënt" },
    { value: "Rapportage", label: "Rapportage – Overdracht van zorginformatie (SBAR)" },
    { value: "Motiveren", label: "Motiveren – Cliënt activeren/aansporen" },
    { value: "Slecht-nieuws", label: "Slecht-nieuws – Moeilijke boodschap overbrengen" },
    { value: "Willekeurig", label: "Willekeurig – Laat de AI een scenario kiezen" },
    { value: "Eigen scenario", label: "Eigen scenario – Beschrijf zelf de situatie" }
  ],
  leerdoelen: ["LSD", "OMA/ANNA", "NIVEA", "SBAR", "Klinisch Redeneren", "MGV", "4G-model", "De-escalatie", "STARR", "Vrije oefening"],
  moeilijkheid: ["Basis", "Gemiddeld", "Uitdagend"],
  clientArchetype: ["Verwarde oudere", "Zorgmijdende cliënt", "Boze cliënt", "Angstige cliënt", "Willekeurig", "Eigen type"]
};

const MOEILIJKHEID_BESCHRIJVING: Record<string, string> = {
  'Basis': `Je bent coöperatief en open. Je vindt het fijn dat iemand naar je luistert. Je deelt informatie vrij makkelijk, maar je hebt nog steeds je eigen verhaal en emoties. Je geeft duidelijke antwoorden en werkt mee aan het gesprek. Als de student iets goed doet, reageer je positief en open je je verder.`,
  'Gemiddeld': `Je bent terughoudend. Je hebt al vaker je verhaal moeten vertellen en bent het een beetje moe. Je opent pas echt als je merkt dat de ander écht luistert en niet alleen afvinkt. Je test een beetje of deze zorgverlener anders is dan de vorige. Je geeft niet meteen alles prijs — de student moet doorvragen om het echte verhaal te horen.`,
  'Uitdagend': `Je bent wantrouwend of gefrustreerd. Je hebt slechte ervaringen met hulpverlening, of je voelt je niet serieus genomen. Je geeft korte, afgemeten antwoorden. Je kunt boos of verdrietig worden als je je niet gehoord voelt. Je stelt de zorgverlener op de proef: "Ja hoor, dat zeggen ze allemaal." Maar diep van binnen wil je wel geholpen worden — je moet alleen eerst het gevoel krijgen dat je echt gehoord wordt. Dat kost tijd en geduld.`
};

const ARCHETYPE_BESCHRIJVING: Record<string, { kern: string; varianten: string[] }> = {
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
  }
};

let currentArchetypeBeschrijving = '';

function getArchetypeBeschrijving(archetype: string, customArchetype?: string): string {
  // Eigen scenario: Claude leidt het type af
  if (archetype === 'scenario-inferred') {
    return 'Je cliënttype volgt uit het beschreven scenario. Speel het type dat het beste past bij de situatie.';
  }

  // Eigen type: gebruik de custom beschrijving
  if (archetype === 'Eigen type' && customArchetype?.trim()) {
    return `Je bent: ${customArchetype.trim()}. Verzin zelf een passende achtergrond en persoonlijkheid bij dit type.`;
  }

  // Willekeurig: kies random archetype via JS
  if (archetype === 'Willekeurig') {
    const archetypes = Object.keys(ARCHETYPE_BESCHRIJVING);
    archetype = archetypes[Math.floor(Math.random() * archetypes.length)];
  }

  const data = ARCHETYPE_BESCHRIJVING[archetype];
  if (!data) {
    return `Je bent een ${archetype.toLowerCase()}.`;
  }

  const randomVariant = data.varianten[Math.floor(Math.random() * data.varianten.length)];
  return `${data.kern}\n\n**Jouw specifieke achtergrond:** ${randomVariant}`;
}

let selectedSettings = {
  setting: SETTINGS_OPTIONS.setting[0],
  scenarioType: SETTINGS_OPTIONS.scenarioType[0].value,
  leerdoelen: [SETTINGS_OPTIONS.leerdoelen[0]],
  moeilijkheid: SETTINGS_OPTIONS.moeilijkheid[1],
  archetype: SETTINGS_OPTIONS.clientArchetype[0],
  customScenario: '',
  customArchetype: ''
};

const app = document.querySelector<HTMLDivElement>('#app')!

function initUI() {
  app.innerHTML = `
    <header>
      <h1>Gespreksbot Zorg (MBO 4)</h1>
      <button id="reset-btn">Reset</button>
    </header>
    <div id="setup-screen" class="scenario-selector">
      <div class="settings-panel">
        <h3>Instellingen</h3>
        <div class="setting-group">
          <label>Setting:</label>
          <select id="setting-select">${SETTINGS_OPTIONS.setting.map(s => `<option value="${s}">${s}</option>`).join('')}</select>
        </div>
        <div class="setting-group">
          <label>Scenario:</label>
          <select id="scenario-type-select">${SETTINGS_OPTIONS.scenarioType.map(s => `<option value="${s.value}">${s.label}</option>`).join('')}</select>
        </div>
        <div class="setting-group" id="custom-scenario-group" style="display: none;">
          <label>Beschrijf je scenario:</label>
          <textarea id="custom-scenario-input" rows="3" placeholder="Bijv: Een verwarde vrouw die je op straat tegenkomt en de weg kwijt lijkt te zijn..."></textarea>
        </div>
        <div class="setting-group">
          <label>Leerdoelen:</label>
          <div class="checkbox-group">
            ${SETTINGS_OPTIONS.leerdoelen.map(l => `
              <label><input type="checkbox" name="leerdoel" value="${l}" ${l === 'LSD' ? 'checked' : ''}> ${l}</label>
            `).join('')}
          </div>
          <small class="leerdoel-hint">Maximaal 2 leerdoelen tegelijk</small>
        </div>
        <div class="setting-group">
          <label>Niveau:</label>
          <select id="moeilijkheid-select">${SETTINGS_OPTIONS.moeilijkheid.map(m => `<option value="${m}" ${m === 'Gemiddeld' ? 'selected' : ''}>${m}</option>`).join('')}</select>
        </div>
        <div class="setting-group" id="archetype-group">
          <label>Cliënt Type:</label>
          <select id="archetype-select">${SETTINGS_OPTIONS.clientArchetype.map(a => `<option value="${a}">${a}</option>`).join('')}</select>
        </div>
        <div class="setting-group" id="custom-archetype-group" style="display: none;">
          <label>Beschrijf het cliënttype:</label>
          <input type="text" id="custom-archetype-input" placeholder="Bijv: kind met downsyndroom, tiener met ADHD...">
        </div>
        <button id="start-btn" style="width: 100%; margin-top: 1rem;">Start Maatwerk Gesprek</button>
      </div>
      
      <hr style="margin: 1.5rem 0; border: 0; border-top: 1px solid #eee;">
      
      <h3>Of kies een cliënt:</h3>
      <div class="scenario-grid">
        ${scenarios.map(s => `
          <div class="scenario-card predefined" data-id="${s.id}">
            <strong>${s.name}</strong><br>
            <small>${s.description}</small>
          </div>
        `).join('')}
      </div>
    </div>
    <div id="chat-container" style="display: none;"></div>
    <form id="input-area" style="display: none;">
      <input type="text" id="user-input" placeholder="Typ je bericht..." autocomplete="off">
      <button type="button" id="theory-btn" title="Bekijk theorie">📚</button>
      <button type="button" id="hint-btn" title="Vraag een tip">💡</button>
      <button type="submit">Verstuur</button>
    </form>
    <div id="theory-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h2>📚 Theorie</h2>
          <button id="close-theory-btn" class="close-btn">&times;</button>
        </div>
        <div id="theory-content" class="modal-body"></div>
      </div>
    </div>
  `

  document.querySelector('#start-btn')?.addEventListener('click', () => {
    // Validate at least one learning goal is selected
    const checkboxes = document.querySelectorAll('input[name="leerdoel"]:checked');
    if (checkboxes.length === 0) {
      alert('Selecteer minimaal 1 leerdoel (of kies "Vrije oefening")');
      return;
    }
    updateSettings();
    startScenarioFromSettings();
  });

  // Show/hide custom scenario input and archetype based on selection
  document.querySelector('#scenario-type-select')?.addEventListener('change', (e) => {
    const value = (e.target as HTMLSelectElement).value;
    const customGroup = document.querySelector('#custom-scenario-group') as HTMLDivElement;
    const archetypeGroup = document.querySelector('#archetype-group') as HTMLDivElement;

    if (customGroup) {
      customGroup.style.display = value === 'Eigen scenario' ? 'flex' : 'none';
    }
    if (archetypeGroup) {
      // Hide archetype for custom scenarios - Claude will infer it
      archetypeGroup.style.display = value === 'Eigen scenario' ? 'none' : 'flex';
    }
  });

  // Show/hide custom archetype input based on selection
  document.querySelector('#archetype-select')?.addEventListener('change', (e) => {
    const value = (e.target as HTMLSelectElement).value;
    const customArchetypeGroup = document.querySelector('#custom-archetype-group') as HTMLDivElement;
    if (customArchetypeGroup) {
      customArchetypeGroup.style.display = value === 'Eigen type' ? 'flex' : 'none';
    }
  });

  const cards = document.querySelectorAll('.scenario-card.predefined');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-id');
      startScenario(id!);
    });
  });

  const form = document.querySelector<HTMLFormElement>('#input-area')!;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSendMessage();
  });

  document.querySelector('#hint-btn')?.addEventListener('click', () => {
    getHint();
  });

  document.querySelector('#theory-btn')?.addEventListener('click', () => {
    showTheory();
  });

  document.querySelector('#close-theory-btn')?.addEventListener('click', () => {
    closeTheory();
  });

  // Close modal when clicking outside
  document.querySelector('#theory-modal')?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).id === 'theory-modal') {
      closeTheory();
    }
  });

  document.querySelector('#reset-btn')?.addEventListener('click', () => {
    location.reload();
  });

  // Update start button state based on checkbox selection
  const checkboxGroup = document.querySelector('.checkbox-group');
  checkboxGroup?.addEventListener('change', updateStartButtonState);
  updateStartButtonState(); // Initial state
}

function updateStartButtonState() {
  const MAX_LEERDOELEN = 2;
  const startBtn = document.querySelector('#start-btn') as HTMLButtonElement;
  const checked = document.querySelectorAll('input[name="leerdoel"]:checked');
  const allCheckboxes = document.querySelectorAll('input[name="leerdoel"]');

  // Disable unchecked checkboxes when max is reached
  allCheckboxes.forEach(cb => {
    const input = cb as HTMLInputElement;
    if (!input.checked) {
      input.disabled = checked.length >= MAX_LEERDOELEN;
    }
  });

  if (startBtn) {
    if (checked.length === 0) {
      startBtn.classList.add('btn-disabled');
    } else {
      startBtn.classList.remove('btn-disabled');
    }
  }
}

function updateSettings() {
  const settingEl = document.querySelector('#setting-select') as HTMLSelectElement;
  const scenarioTypeEl = document.querySelector('#scenario-type-select') as HTMLSelectElement;
  const moeilijkheidEl = document.querySelector('#moeilijkheid-select') as HTMLSelectElement;
  const archetypeEl = document.querySelector('#archetype-select') as HTMLSelectElement;
  const customScenarioEl = document.querySelector('#custom-scenario-input') as HTMLTextAreaElement;
  const customArchetypeEl = document.querySelector('#custom-archetype-input') as HTMLInputElement;

  if (settingEl) selectedSettings.setting = settingEl.value;
  if (scenarioTypeEl) selectedSettings.scenarioType = scenarioTypeEl.value;
  if (moeilijkheidEl) selectedSettings.moeilijkheid = moeilijkheidEl.value;
  if (archetypeEl) selectedSettings.archetype = archetypeEl.value;
  if (customScenarioEl) selectedSettings.customScenario = customScenarioEl.value;
  if (customArchetypeEl) selectedSettings.customArchetype = customArchetypeEl.value;

  const checkboxes = document.querySelectorAll('input[name="leerdoel"]:checked');
  selectedSettings.leerdoelen = Array.from(checkboxes).map(cb => (cb as HTMLInputElement).value);
}

async function startScenarioFromSettings() {
  // Use a placeholder name for the first turn - Claude will generate its own name
  const placeholderName = "De cliënt";

  currentScenario = {
    id: "dynamic",
    name: placeholderName,
    description: `Maatwerk scenario: ${selectedSettings.archetype} in ${selectedSettings.setting}`,
    persona: {
      name: placeholderName,
      age: 70,
      tone: "Wisselend",
      situation: `Heeft vragen of zorgen over ${selectedSettings.scenarioType}.`,
      background: "Onbekend",
      emotion: "Wisselend"
    }
  };

  prepareChat();
  const scenarioLabel = selectedSettings.scenarioType === 'Eigen scenario' ? selectedSettings.customScenario.substring(0, 50) + '...' : selectedSettings.scenarioType;
  addMessage('Systeem', `Gesprek gestart in ${selectedSettings.setting}. Scenario: ${scenarioLabel}`, 'system');
  addMessage('Cliënt', '*...*', 'patient'); // Typing indicator

  // Request dynamic opening from Claude
  conversationHistory = []; // Reset history for new conversation

  // Determine scenario description
  let scenarioDescription = '';
  let archetypeForPrompt = selectedSettings.archetype;

  if (selectedSettings.scenarioType === 'Eigen scenario' && selectedSettings.customScenario.trim()) {
    scenarioDescription = `EIGEN SCENARIO: ${selectedSettings.customScenario}. Leid zelf het juiste cliënttype af uit deze beschrijving.`;
    archetypeForPrompt = 'scenario-inferred';
  } else if (selectedSettings.scenarioType === 'Willekeurig') {
    scenarioDescription = 'WILLEKEURIG: Bedenk zelf een passend en realistisch scenario voor deze setting en dit cliënttype.';
  } else {
    scenarioDescription = `Standaard scenario: ${selectedSettings.scenarioType}`;
  }

  // Generate archetype description (with random variant) and store for the session
  currentArchetypeBeschrijving = getArchetypeBeschrijving(archetypeForPrompt, selectedSettings.customArchetype);

  // Determine archetypeDescription for the opening prompt
  let archetypeDescription = selectedSettings.archetype;
  if (archetypeForPrompt === 'scenario-inferred') {
    archetypeDescription = 'een cliënt passend bij het beschreven scenario';
  } else if (selectedSettings.archetype === 'Eigen type' && selectedSettings.customArchetype.trim()) {
    archetypeDescription = selectedSettings.customArchetype;
  } else if (selectedSettings.archetype === 'Willekeurig') {
    // The archetype was already resolved in getArchetypeBeschrijving, extract the type for the opening prompt
    archetypeDescription = 'het cliënttype dat beschreven staat in je karakter-sectie';
  }

  const titles = ["Mevrouw", "Meneer"];
  const lastNames = [
    // Nederlands
    "Jansen", "de Vries", "van den Berg", "Smit", "de Jong", "Visser", "Mulder",
    "Hendriks", "Postma", "Dijkstra", "Vermeulen", "Dekker", "Brouwer", "de Graaf",
    "van der Linden", "Scholten", "Kuiper", "Huisman", "Hoekstra", "Koster",
    "Molenaar", "Veldman", "Schipper", "Veenstra", "Blom", "Timmermans", "Jonker",
    "de Boer", "van Rijn", "Bouwman", "de Bruin", "Hofman", "Nauta", "Zijlstra",
    "Terpstra", "de Ruiter", "Roos", "Groen", "van Dam", "de Lange",
    "Bakker", "van Dijk", "Meijer", "Peters", "Kok", "Kramer", "Prins", "Vos",
    "Bos", "van Leeuwen", "Wolff", "Haan", "Maas", "van Beek", "Evers",
    "Hermans", "Martens", "Peeters", "van Wijk", "Lammers", "Akkerman", "Smeets",
    "Gerritsen", "Willemse", "Roelofs", "van der Wal", "Rietveld", "Drost",
    "van Doorn", "ter Haar", "Jacobs", "van Vliet", "Driessen", "van Es",
    "Coppens", "Franken", "Leenders", "van Hout", "de Haan", "Verschuur",
    "Vink", "Overbeek", "ten Brink", "Zwart", "de Wit", "Schouten",
    "van der Heijden", "de Ridder", "Schut", "Slot", "Bogaert", "Appelman",
    "Korte", "Winkel", "Snel", "van Oort", "Spijker", "Ploeg", "Buijs",
    "Westra", "Poot", "Bezemer", "Kool", "van Kampen", "Vrolijk", "Berger",
    "Rademaker", "Hoek", "van der Veen", "Grasman", "Noordhuis", "Damen",
    "Schoenmakers", "Reinders", "Claassen", "Boon", "Jellema", "Witteveen",
    "Kuijpers", "van Loon", "Gerrits", "van Straaten", "van Gelderen",
    "van der Velden", "Sluiter", "van Dalen", "Coenen", "Nooij",
    // Surinaams
    "Redan", "Pengel", "Djwalapersad", "Woei-A-Tsoi", "Venetiaan", "Biervliet",
    "Dragman", "Kanhai", "Soerdjan", "Ramdat", "Jokhan", "Sitaldin", "Tjin-A-Tsoi",
    "Bhagwandas", "Kishna", "Mangroe", "Soemita", "Lachmon", "Moeniralam",
    "Ramadin", "Panka", "Soekhlal",
    // Turks
    "Yilmaz", "Kaya", "Demir", "Celik", "Sahin", "Ozturk", "Arslan", "Dogan",
    "Kilic", "Aydin", "Erdogan", "Polat", "Ozdemir", "Yildiz", "Aksoy",
    "Korkmaz", "Gunes", "Bulut", "Tekin", "Karaca", "Unal", "Taskin",
    // Marokkaans
    "El Amrani", "Bouzid", "El Idrissi", "Tahiri", "Amrani", "Benali", "Chaouqi",
    "El Haddadi", "Lahlou", "Moussaoui", "Rachidi", "Zarouali", "Belhaj",
    "El Ouardi", "Haddouchi", "Karimi", "Nouri", "Saidi", "Bouazza", "El Hamdaoui",
    "Aboutaleb", "Ziani",
    // Indonesisch
    "Soekarno", "Wibowo", "Hartono", "Sutrisno", "Hidayat", "Tjakraningrat",
    "Prasetyo", "Wijaya", "Gunawan", "Suryadi", "Indraswari", "Kusuma",
    "Soetomo", "Purnama", "Suharto", "Nugroho", "Setiono", "Habibie",
    // Antilliaans
    "Martina", "Cijntje", "Sulvaran", "Constancia", "Pieternella", "Willems",
    "Rosaria", "Oleana", "Zimmerman", "Frans", "Semeleer", "Maduro",
    "Nicolaas", "Evertsz", "Vierdag",
    // Overig (Ghanees, Kaapverdiaans, Chinees, etc.)
    "Owusu", "Mensah", "Asante", "Boateng", "Osei", "Fortes", "Tavares",
    "Gomes", "Mendes", "Chen", "Huang", "Wang", "Lin", "Nguyen", "Pham",
    "Ali", "Hassan", "Omar", "Ibrahim", "Mohammed"
  ];
  const randomHint = `${titles[Math.floor(Math.random() * titles.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;

  const openingPrompt = `Je bent ${randomHint}, een ${archetypeDescription.toLowerCase()} in ${selectedSettings.setting}.
${scenarioDescription}

Je naam is ${randomHint}. Begin je antwoord VERPLICHT met je naam in dit formaat: [NAAM: ${randomHint}]
Genereer daarna je EERSTE zin als cliënt. Beschrijf kort je situatie en stemming passend bij de setting.
Gebruik *italics* voor non-verbaal gedrag. Houd het kort (1-2 zinnen).

Voorbeeld output:
[NAAM: ${randomHint}]
*Kijkt op vanuit de stoel* Goedemorgen... ben ik eindelijk aan de beurt?`;

  // Haal kennis op voor geselecteerde leerdoelen
  const clientInstructies = getClientInstructies(selectedSettings.leerdoelen);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt: SYSTEM_PROMPT_MBO
          .replace('{{SETTING}}', selectedSettings.setting)
          .replace('{{SCENARIO_TYPE}}', selectedSettings.scenarioType)
          .replace('{{LEERDOELEN}}', selectedSettings.leerdoelen.join(', '))
          .replace('{{MOEILIJKHEID_BESCHRIJVING}}', MOEILIJKHEID_BESCHRIJVING[selectedSettings.moeilijkheid] || MOEILIJKHEID_BESCHRIJVING['Gemiddeld'])
          .replace('{{ARCHETYPE_BESCHRIJVING}}', currentArchetypeBeschrijving)
          .replace('{{PATIENT_NAME}}', placeholderName)
          + clientInstructies,
        messages: [{ role: 'user', content: openingPrompt }]
      })
    });

    const data = await response.json();

    // Remove typing indicator
    const container = document.querySelector('#chat-container')!;
    const lastMessage = container.lastElementChild;
    if (lastMessage) lastMessage.remove();

    if (data.error) {
      addMessage('Systeem', `Fout: ${data.error}`, 'system');
    } else {
      // Extract name from response if present
      const nameMatch = data.response.match(/\[NAAM:\s*([^\]]+)\]/i);
      if (nameMatch) {
        const extractedName = nameMatch[1].trim();
        currentScenario!.name = extractedName;
        currentScenario!.persona.name = extractedName;
        // Remove the name tag safely (case insensitive)
        const cleanResponse = data.response.replace(/\[NAAM:[^\]]+\]\s*/i, '').trim();
        conversationHistory.push({ role: 'assistant', content: cleanResponse });
        addMessage(extractedName, cleanResponse, 'patient');
      } else {
        conversationHistory.push({ role: 'assistant', content: data.response });
        addMessage('Cliënt', data.response, 'patient');
      }
    }
  } catch (error) {
    const container = document.querySelector('#chat-container')!;
    const lastMessage = container.lastElementChild;
    if (lastMessage) lastMessage.remove();
    addMessage('Systeem', 'Kan geen verbinding maken met de AI-server.', 'system');
  }
}

function startScenario(id: string) {
  currentScenario = scenarios.find(s => s.id === id) || null;
  if (!currentScenario) return;

  prepareChat();
  addMessage('Systeem', `Je start het gesprek met ${currentScenario.persona.name}. Theorie: MBO 4 niveau.`, 'system');

  setTimeout(() => {
    addMessage(currentScenario!.persona.name, `*${currentScenario!.persona.tone}* ${currentScenario!.persona.situation}`, 'patient');
  }, 1000);
}

function prepareChat() {
  document.querySelector<HTMLDivElement>('#setup-screen')!.style.display = 'none';
  document.querySelector<HTMLDivElement>('#chat-container')!.style.display = 'flex';
  document.querySelector<HTMLFormElement>('#input-area')!.style.display = 'flex';
}

function showTheory() {
  const theorie = getTheorieVoorStudent(selectedSettings.leerdoelen);
  const modal = document.querySelector('#theory-modal') as HTMLDivElement;
  const content = document.querySelector('#theory-content') as HTMLDivElement;

  // Convert markdown-like formatting to HTML
  const htmlContent = theorie
    .replace(/## (.*)/g, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n- /g, '<br>• ')
    .replace(/\n\n---\n\n/g, '<hr>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');

  content.innerHTML = htmlContent;
  modal.style.display = 'flex';
}

function closeTheory() {
  const modal = document.querySelector('#theory-modal') as HTMLDivElement;
  modal.style.display = 'none';
}

function handleSendMessage() {
  const input = document.querySelector<HTMLInputElement>('#user-input')!;
  const text = input.value.trim();
  if (!text) return;

  addMessage('Jij (Student)', text, 'student');
  input.value = '';

  // Add to conversation history
  conversationHistory.push({ role: 'user', content: text });

  // Show typing indicator
  addMessage(currentScenario?.persona.name || 'Cliënt', '*denkt na...*', 'patient');

  generateResponse();
}

function addMessage(sender: string, text: string, type: 'student' | 'patient' | 'system' | 'meta') {
  const container = document.querySelector('#chat-container')!;
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${type}`;

  // Format text: convert *text* to styled non-verbal behavior
  const formattedText = formatMessageText(text);

  msgDiv.innerHTML = `
    <strong>${sender}</strong>
    <div class="message-content">${formattedText}</div>
    <div class="message-info">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
  `;
  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
}

function formatMessageText(text: string): string {
  // Split by asterisk patterns and format non-verbal cues
  // Pattern: *text* becomes styled block
  const parts = text.split(/(\*[^*]+\*)/g);

  return parts.map(part => {
    if (part.startsWith('*') && part.endsWith('*')) {
      // Non-verbal behavior - extract content and style it
      const content = part.slice(1, -1);
      return `<div class="nonverbal">${content}</div>`;
    }
    return part.trim() ? `<span>${part}</span>` : '';
  }).join('');
}

async function getHint() {
  const hintBtn = document.querySelector('#hint-btn') as HTMLButtonElement;
  if (hintBtn) hintBtn.disabled = true;

  // Check if there's a conversation to give hints about
  if (conversationHistory.length === 0) {
    addMessage('Coach', '💡 Begin eerst het gesprek met de cliënt, dan kan ik je tips geven!', 'meta');
    if (hintBtn) hintBtn.disabled = false;
    return;
  }

  // Add temp loading message
  addMessage('Systeem', 'Coach denkt na over een tip...', 'system');

  // Format conversation as a readable transcript (not as chat messages)
  const transcript = conversationHistory.map(msg => {
    const speaker = msg.role === 'user' ? 'Student' : `Cliënt (${currentScenario?.persona.name || 'de cliënt'})`;
    return `${speaker}: ${msg.content}`;
  }).join('\n\n');

  // Haal coach context op voor geselecteerde leerdoelen
  const coachKennis = getCoachContext(selectedSettings.leerdoelen);

  const coachSystemPrompt = `Je bent een ervaren praktijkbegeleider die MBO-zorgstudenten coacht tijdens gespreksoefeningen. Je observeert het gesprek en geeft korte, behulpzame tips.

## Kennis over de gesprekstechnieken die de student oefent:

${coachKennis}`;

  const coachUserPrompt = `Hier is het gesprek tot nu toe tussen een student en een cliënt:

---
${transcript}
---

Context:
- Setting: ${selectedSettings.setting}
- De student oefent met: ${selectedSettings.leerdoelen.join(', ')}

Analyseer het gesprek op basis van je kennis over de gesprekstechnieken hierboven. Geef de student één korte tip (max 2 zinnen) om het gesprek te verbeteren. Wees bemoedigend en concreet. Beschrijf gewoon wat de student kan doen, niet welke techniek het is.`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt: coachSystemPrompt,
        messages: [{ role: 'user', content: coachUserPrompt }]
      })
    });

    const data = await response.json();

    // Remove loading message
    const container = document.querySelector('#chat-container')!;
    const lastMessage = container.lastElementChild;
    if (lastMessage && lastMessage.textContent?.includes('Coach denkt na')) {
      lastMessage.remove();
    }

    if (data.error) {
      addMessage('Systeem', 'Kon geen tip genereren.', 'system');
    } else {
      addMessage('Coach', `💡 ${data.response}`, 'meta');
    }
  } catch (error) {
    const container = document.querySelector('#chat-container')!;
    const lastMessage = container.lastElementChild;
    if (lastMessage && lastMessage.textContent?.includes('Coach denkt na')) {
      lastMessage.remove();
    }
    addMessage('Systeem', 'Kon geen verbinding maken met de coach. Probeer het opnieuw.', 'system');
  } finally {
    if (hintBtn) hintBtn.disabled = false;
  }
}

async function generateResponse() {
  if (!currentScenario) {
    currentScenario = scenarios[0];
  }

  const persona = currentScenario.persona;

  // Haal kennis op voor geselecteerde leerdoelen
  const clientInstructies = getClientInstructies(selectedSettings.leerdoelen);

  // Build dynamic system prompt
  const dynamicPrompt = SYSTEM_PROMPT_MBO
    .replace('{{SETTING}}', selectedSettings.setting)
    .replace('{{SCENARIO_TYPE}}', selectedSettings.scenarioType)
    .replace('{{LEERDOELEN}}', selectedSettings.leerdoelen.join(', '))
    .replace('{{MOEILIJKHEID_BESCHRIJVING}}', MOEILIJKHEID_BESCHRIJVING[selectedSettings.moeilijkheid] || MOEILIJKHEID_BESCHRIJVING['Gemiddeld'])
    .replace('{{ARCHETYPE_BESCHRIJVING}}', currentArchetypeBeschrijving)
    .replace('{{PATIENT_NAME}}', persona.name)
    + clientInstructies;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt: dynamicPrompt,
        messages: conversationHistory
      })
    });

    const data = await response.json();

    // Remove typing indicator
    const container = document.querySelector('#chat-container')!;
    const lastMessage = container.lastElementChild;
    if (lastMessage?.textContent?.includes('denkt na')) {
      lastMessage.remove();
    }

    if (data.error) {
      addMessage('Systeem', `Fout: ${data.error}`, 'system');
    } else {
      conversationHistory.push({ role: 'assistant', content: data.response });
      addMessage(persona.name, data.response, 'patient');
    }
  } catch (error) {
    // Remove typing indicator
    const container = document.querySelector('#chat-container')!;
    const lastMessage = container.lastElementChild;
    if (lastMessage?.textContent?.includes('denkt na')) {
      lastMessage.remove();
    }
    addMessage('Systeem', 'Kan geen verbinding maken met de AI-server. Start de server met: cd server && npm start', 'system');
  }
}

initUI()
