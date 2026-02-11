import './style.css'
import personasData from '../personas.json'
import { getClientInstructies, getCoachContext, getTheorieVoorStudent, getKorteUitleg, getKennisVoorLeerdoelen, getRubricContext } from './knowledge'

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
  setting?: string;
  scenarioType?: string;
  archetype?: string;
  moeilijkheid?: string;
  recommendedLeerdoelen?: string[];
}

interface ScoreStats {
  goed: number;
  voldoende: number;
  onvoldoende: number;
}

interface DashboardSession {
  id: string;
  dateIso: string;
  studentName: string;
  setting: string;
  scenario: string;
  leerdoelen: string[];
  niveau: string;
  turns: number;
  scores: ScoreStats | null;
}


const API_BASE = import.meta.env.VITE_API_BASE || '';
const API_URL = `${API_BASE}/api/chat`;
let conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [];

// Speech mode state
let speechMode = false;
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let isRecording = false;
let audioContext: AudioContext | null = null;
let silenceTimer: number | null = null;
let liveConversationActive = false;
let micStream: MediaStream | null = null;

const scenarios: Scenario[] = personasData;
let currentScenario: Scenario | null = null;
let isWaitingForResponse = false;
let selfAssessment: Record<string, string> = {};
let conversationStartedAt: Date | null = null;
let conversationClosed = false;
let latestFeedbackScores: ScoreStats | null = null;
let dashboardSavedForConversation = false;
let cachedSystemPrompt: string | null = null;

const DASHBOARD_STORAGE_KEY = 'gespreksbot-docent-dashboard-v1';

const RECOMMENDED_MIN_TURNS = 6;
const TARGET_TURNS = 8;

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
  clientArchetype: ["Verwarde oudere", "Zorgmijdende cliënt", "Boze cliënt", "Angstige cliënt", "Collega", "Willekeurig", "Eigen type"]
};

const LEERDOEL_GROUPS: { title: string; items: string[] }[] = [
  { title: 'Basistechnieken', items: ['LSD', 'OMA/ANNA', 'NIVEA'] },
  { title: 'Structuurtechnieken', items: ['SBAR', 'STARR', 'Klinisch Redeneren'] },
  { title: 'Specialistisch', items: ['MGV', '4G-model', 'De-escalatie'] },
  { title: 'Vrij', items: ['Vrije oefening'] }
];

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
  },
  'Collega': {
    kern: `Je bent een zorgprofessional die samenwerkt met de student. Je verwacht duidelijke, gestructureerde communicatie. Je bent collegiaal maar hebt het druk. Je reageert op de kwaliteit van de informatie die je krijgt — als het helder en gestructureerd is, kun je snel schakelen. Als het rommelig of onvolledig is, moet je doorvragen en dat kost tijd die je eigenlijk niet hebt.`,
    varianten: [
      `Je neemt de dienst over van de student. Je wilt een duidelijke overdracht: welke cliënten hebben aandacht nodig, wat is er veranderd, wat moet er nog gebeuren. De afdeling is druk en je hebt weinig tijd, dus je verwacht dat de student gestructureerd en to-the-point is.`,
      `De student belt je op omdat er iets zorgelijks is met een cliënt. Je bent arts of specialist en kunt niet direct langskomen — je moet op basis van de telefonische informatie een inschatting maken en beslissen wat er moet gebeuren. Je stelt gerichte vragen als informatie ontbreekt.`,
      `Je bent een collega die met de student overlegt over een cliënt. Jullie zijn gelijkwaardig. Je denkt mee maar verwacht dat de student het probleem helder kan verwoorden. Je deelt je eigen expertise en ervaring als dat relevant is.`
    ]
  }
};

const COLLEGA_ROLLEN: Record<string, string> = {
  'Verpleeghuis': 'collega-verzorgende',
  'Thuiszorg': 'collega-wijkverpleegkundige',
  'Ziekenhuis': 'collega-verpleegkundige',
  'GGZ': 'collega-begeleider',
  'Gehandicaptenzorg': 'collega-begeleider',
  'Huisartsenpraktijk': 'collega-praktijkondersteuner'
};

const MOEILIJKHEID_COLLEGA: Record<string, string> = {
  'Basis': `Je bent geduldig en behulpzaam. Je geeft de student de tijd om informatie te delen. Als er iets ontbreekt, vraag je vriendelijk door. Je denkt actief mee en geeft aanmoediging.`,
  'Gemiddeld': `Je bent professioneel maar hebt het druk. Je verwacht dat de student gestructureerd communiceert. Als informatie ontbreekt of onduidelijk is, vraag je gericht door. Je hebt niet eindeloos de tijd.`,
  'Uitdagend': `Je bent gehaast en hebt weinig tijd. Je verwacht dat de student snel en to-the-point is. Als de informatie rommelig of onvolledig is, laat je dat merken. Je kunt kortaf reageren of de student onderbreken als het te lang duurt. Je stelt kritische vragen.`
};

let isCollegaMode = false;
let currentArchetypeBeschrijving = '';

function getCollegaContext(setting: string): string {
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

function getArchetypeBeschrijving(archetype: string, customArchetype?: string): string {
  isCollegaMode = false; // Reset bij elke aanroep

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

  isCollegaMode = archetype === 'Collega';

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

function populateChecklist() {
  const body = document.querySelector('#checklist-body') as HTMLDivElement;
  if (!body) return;
  const kennis = getKennisVoorLeerdoelen(selectedSettings.leerdoelen);
  if (kennis.length === 0) {
    body.innerHTML = '<p class="checklist-empty">Geen leerdoelen geselecteerd.</p>';
    return;
  }
  let html = '';
  for (const k of kennis) {
    html += `<div class="checklist-item"><strong>${k.naam}</strong>`;
    html += `<p>${k.korteUitleg}</p><ul>`;
    for (const [, beschrijving] of Object.entries(k.technieken)) {
      html += `<li>${beschrijving}</li>`;
    }
    html += `</ul></div>`;
  }
  body.innerHTML = html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setInlineError(id: string, message: string) {
  const el = document.querySelector(`#${id}`) as HTMLElement | null;
  if (!el) return;
  el.textContent = message;
}

function clearInlineError(id: string) {
  setInlineError(id, '');
}

function showToast(message: string, variant: 'info' | 'success' | 'error' = 'info') {
  const container = document.querySelector('#toast-container') as HTMLDivElement | null;
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${variant}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-leave');
    setTimeout(() => toast.remove(), 240);
  }, 2200);
}

function addTypingIndicator(sender: string, type: 'patient' | 'system' | 'meta' = 'patient') {
  const container = document.querySelector('#chat-container') as HTMLDivElement | null;
  if (!container) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${type} typing-message`;
  msgDiv.setAttribute('data-typing', 'true');

  const strong = document.createElement('strong');
  strong.textContent = sender;
  const content = document.createElement('div');
  content.className = 'message-content';
  const dots = document.createElement('span');
  dots.className = 'typing-dots';
  dots.innerHTML = '<span></span><span></span><span></span>';
  content.appendChild(dots);

  msgDiv.appendChild(strong);
  msgDiv.appendChild(content);
  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
}

function removeTypingIndicators() {
  document.querySelectorAll('[data-typing="true"]').forEach(el => el.remove());
}

function getFeedbackScores(text: string): ScoreStats | null {
  const scoresMatch = text.match(/<!--SCORES\n([\s\S]*?)SCORES-->/);
  if (!scoresMatch) return null;

  const stats: ScoreStats = { goed: 0, voldoende: 0, onvoldoende: 0 };
  const lines = scoresMatch[1].trim().split('\n').filter(l => l.includes('|'));
  const dataLines = lines.filter(l => !l.startsWith('leerdoel|'));

  for (const line of dataLines) {
    const parts = line.split('|').map(s => s.trim());
    if (parts.length < 3) continue;
    const score = parts[2].toLowerCase();
    if (score === 'goed') stats.goed += 1;
    if (score === 'voldoende') stats.voldoende += 1;
    if (score === 'onvoldoende') stats.onvoldoende += 1;
  }
  return stats.goed + stats.voldoende + stats.onvoldoende > 0 ? stats : null;
}

function loadDashboardSessions(): DashboardSession[] {
  try {
    const raw = localStorage.getItem(DASHBOARD_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DashboardSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveDashboardSessions(sessions: DashboardSession[]) {
  localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(sessions.slice(0, 120)));
}

function saveCurrentSessionToDashboard() {
  if (dashboardSavedForConversation) return;
  if (!conversationStartedAt) return;
  const session: DashboardSession = {
    id: `${Date.now()}`,
    dateIso: new Date().toISOString(),
    studentName: (document.querySelector('#student-name-input') as HTMLInputElement | null)?.value.trim() || 'Onbekend',
    setting: selectedSettings.setting,
    scenario: getScenarioLabelForUi(),
    leerdoelen: [...selectedSettings.leerdoelen],
    niveau: selectedSettings.moeilijkheid,
    turns: getStudentTurnCount(),
    scores: latestFeedbackScores
  };

  const sessions = loadDashboardSessions();
  sessions.unshift(session);
  saveDashboardSessions(sessions);
  dashboardSavedForConversation = true;
}

function renderDashboard() {
  const content = document.querySelector('#dashboard-content') as HTMLDivElement | null;
  if (!content) return;

  const sessions = loadDashboardSessions();
  if (sessions.length === 0) {
    content.innerHTML = '<p class="dashboard-empty">Nog geen sessies opgeslagen.</p>';
    return;
  }

  const uniqueStudents = new Set(sessions.map(s => s.studentName).filter(Boolean)).size;
  const avgTurns = Math.round(sessions.reduce((sum, s) => sum + s.turns, 0) / sessions.length);
  const scoreTotals = sessions.reduce((acc, s) => {
    if (s.scores) {
      acc.goed += s.scores.goed;
      acc.voldoende += s.scores.voldoende;
      acc.onvoldoende += s.scores.onvoldoende;
    }
    return acc;
  }, { goed: 0, voldoende: 0, onvoldoende: 0 });

  const rows = sessions.slice(0, 20).map(s => {
    const date = new Date(s.dateIso).toLocaleDateString('nl-NL');
    const scoreSummary = s.scores
      ? `G:${s.scores.goed} V:${s.scores.voldoende} O:${s.scores.onvoldoende}`
      : '-';
    return `<tr>
      <td>${escapeHtml(date)}</td>
      <td>${escapeHtml(s.studentName)}</td>
      <td>${escapeHtml(s.scenario)}</td>
      <td>${escapeHtml(String(s.turns))}</td>
      <td>${escapeHtml(scoreSummary)}</td>
    </tr>`;
  }).join('');

  content.innerHTML = `
    <div class="dashboard-stats">
      <div><strong>Sessies:</strong> ${sessions.length}</div>
      <div><strong>Studenten:</strong> ${uniqueStudents}</div>
      <div><strong>Gem. beurten:</strong> ${avgTurns}</div>
      <div><strong>Scores:</strong> G ${scoreTotals.goed} / V ${scoreTotals.voldoende} / O ${scoreTotals.onvoldoende}</div>
    </div>
    <div class="dashboard-table-wrap">
      <table class="dashboard-table">
        <thead>
          <tr><th>Datum</th><th>Student</th><th>Scenario</th><th>Beurten</th><th>Scores</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function buildLeerdoelSelectionHtml() {
  return LEERDOEL_GROUPS.map(group => `
    <div class="leerdoel-group">
      <div class="leerdoel-group-title">${group.title}</div>
      <div class="leerdoel-chips">
        ${group.items.map(leerdoel => `
          <label class="leerdoel-chip">
            <input type="checkbox" name="leerdoel" value="${leerdoel}" ${leerdoel === 'LSD' ? 'checked' : ''}>
            <span class="leerdoel-chip-name">${leerdoel}</span>
            <span class="leerdoel-chip-desc">${getKorteUitleg(leerdoel)}</span>
          </label>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function setAppMode(mode: 'setup' | 'chat' | 'feedback') {
  app.classList.remove('setup-mode', 'chat-mode', 'feedback-mode');
  app.classList.add(`${mode}-mode`);
}

function animateScreenEntry(selector: string) {
  const element = document.querySelector(selector) as HTMLElement | null;
  if (!element) return;
  element.classList.remove('screen-enter');
  void element.offsetWidth;
  element.classList.add('screen-enter');
}

function setFeedbackTab(tab: 'gesprek' | 'feedback') {
  const feedbackScreen = document.querySelector('#feedback-screen') as HTMLDivElement | null;
  const gesprekTab = document.querySelector('#feedback-tab-gesprek') as HTMLButtonElement | null;
  const feedbackTab = document.querySelector('#feedback-tab-feedback') as HTMLButtonElement | null;
  if (!feedbackScreen || !gesprekTab || !feedbackTab) return;

  feedbackScreen.classList.toggle('tab-gesprek', tab === 'gesprek');
  feedbackScreen.classList.toggle('tab-feedback', tab === 'feedback');

  gesprekTab.classList.toggle('active', tab === 'gesprek');
  feedbackTab.classList.toggle('active', tab === 'feedback');

  gesprekTab.setAttribute('aria-selected', String(tab === 'gesprek'));
  feedbackTab.setAttribute('aria-selected', String(tab === 'feedback'));
}

function setChecklistPanelVisibility(visible: boolean) {
  const panel = document.querySelector('#checklist-panel') as HTMLDivElement | null;
  const checklistBtn = document.querySelector('#checklist-btn') as HTMLButtonElement | null;
  if (!panel || !checklistBtn) return;

  panel.style.display = visible ? 'block' : 'none';
  panel.setAttribute('aria-hidden', String(!visible));
  checklistBtn.setAttribute('aria-expanded', String(visible));
}

function getScenarioLabelForUi() {
  if (currentScenario && currentScenario.id !== 'dynamic') {
    return currentScenario.name;
  }
  if (selectedSettings.scenarioType === 'Eigen scenario' && selectedSettings.customScenario.trim()) {
    return selectedSettings.customScenario.trim();
  }
  return selectedSettings.scenarioType;
}

function getStudentTurnCount() {
  return conversationHistory.filter(msg => msg.role === 'user').length;
}

function updateConversationActionButtons() {
  const endButton = document.querySelector('#end-conversation-btn') as HTMLButtonElement | null;
  const feedbackButton = document.querySelector('#feedback-btn') as HTMLButtonElement | null;
  if (!endButton || !feedbackButton) return;

  const turns = getStudentTurnCount();
  if (conversationClosed) {
    endButton.style.display = 'none';
    feedbackButton.style.display = 'block';
    return;
  }

  if (turns >= RECOMMENDED_MIN_TURNS) {
    endButton.style.display = 'block';
    feedbackButton.style.display = 'none';
  } else {
    endButton.style.display = 'none';
    feedbackButton.style.display = 'none';
  }
}

function updateChatSessionMeta() {
  const meta = document.querySelector('#chat-session-meta') as HTMLDivElement | null;
  const chatContainer = document.querySelector('#chat-container') as HTMLDivElement | null;
  const contextBar = document.querySelector('#chat-context-bar') as HTMLDivElement | null;
  const turnStatus = document.querySelector('#chat-turn-status') as HTMLDivElement | null;
  if (!meta || !chatContainer || !contextBar || !turnStatus) return;

  const isChatVisible = chatContainer.style.display !== 'none';
  meta.style.display = isChatVisible ? 'flex' : 'none';
  if (!isChatVisible) return;

  contextBar.innerHTML = '';
  const contextItems = [
    selectedSettings.setting || 'Setting onbekend',
    selectedSettings.leerdoelen.length > 0 ? selectedSettings.leerdoelen.join(' + ') : 'Geen leerdoelen',
    selectedSettings.moeilijkheid || 'Niveau onbekend'
  ];
  contextItems.forEach(item => {
    const chip = document.createElement('span');
    chip.className = 'chat-context-chip';
    chip.textContent = item;
    contextBar.appendChild(chip);
  });

  const turns = getStudentTurnCount();
  let turnMessage = `Beurt ${turns} van ~${TARGET_TURNS}.`;
  if (turns < 4) {
    turnMessage += ' Probeer minimaal 6 beurten.';
  } else if (conversationClosed) {
    turnMessage += ' Gesprek is afgerond.';
  } else if (turns >= RECOMMENDED_MIN_TURNS) {
    turnMessage += ' Je kunt nu het gesprek afronden of doorgaan.';
  }
  turnStatus.textContent = turnMessage;
  updateConversationActionButtons();
}

function getFormattedDateTime(date: Date) {
  return date.toLocaleString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function renderFeedbackExportSummary() {
  const summary = document.querySelector('#feedback-export-summary') as HTMLDivElement | null;
  if (!summary) return;

  const studentInput = document.querySelector('#student-name-input') as HTMLInputElement | null;
  const studentName = studentInput?.value.trim() || 'Niet ingevuld';
  const startedAt = conversationStartedAt ?? new Date();
  const scenarioLabel = getScenarioLabelForUi();
  const goals = selectedSettings.leerdoelen.length > 0 ? selectedSettings.leerdoelen.join(', ') : 'Geen leerdoelen';

  summary.innerHTML = `
    <div class="feedback-meta-item"><strong>Datum:</strong> ${escapeHtml(getFormattedDateTime(startedAt))}</div>
    <div class="feedback-meta-item"><strong>Student:</strong> ${escapeHtml(studentName)}</div>
    <div class="feedback-meta-item"><strong>Setting:</strong> ${escapeHtml(selectedSettings.setting)}</div>
    <div class="feedback-meta-item"><strong>Scenario:</strong> ${escapeHtml(scenarioLabel)}</div>
    <div class="feedback-meta-item"><strong>Leerdoelen:</strong> ${escapeHtml(goals)}</div>
    <div class="feedback-meta-item"><strong>Niveau:</strong> ${escapeHtml(selectedSettings.moeilijkheid)}</div>
  `;
}

function printFeedback() {
  renderFeedbackExportSummary();
  window.print();
}

function showConfirmDialog(message: string): Promise<boolean> {
  const modal = document.querySelector('#confirm-modal') as HTMLDivElement | null;
  const messageEl = document.querySelector('#confirm-message') as HTMLParagraphElement | null;
  const cancelBtn = document.querySelector('#confirm-cancel-btn') as HTMLButtonElement | null;
  const okBtn = document.querySelector('#confirm-ok-btn') as HTMLButtonElement | null;

  if (!modal || !messageEl || !cancelBtn || !okBtn) {
    return Promise.resolve(false);
  }

  messageEl.textContent = message;
  modal.style.display = 'flex';
  okBtn.focus();

  return new Promise(resolve => {
    const cleanup = () => {
      modal.style.display = 'none';
      cancelBtn.removeEventListener('click', onCancel);
      okBtn.removeEventListener('click', onConfirm);
      modal.removeEventListener('click', onOverlayClick);
      document.removeEventListener('keydown', onEscape);
    };

    const onCancel = () => {
      cleanup();
      resolve(false);
    };

    const onConfirm = () => {
      cleanup();
      resolve(true);
    };

    const onOverlayClick = (event: MouseEvent) => {
      if (event.target === modal) onCancel();
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };

    cancelBtn.addEventListener('click', onCancel);
    okBtn.addEventListener('click', onConfirm);
    modal.addEventListener('click', onOverlayClick);
    document.addEventListener('keydown', onEscape);
  });
}

function initUI() {
  app.innerHTML = `
    <header>
      <h1>Gespreksbot Zorg (MBO 4)</h1>
      <div class="header-actions">
        <button type="button" id="help-btn" class="help-btn" aria-label="Open hulp">?</button>
        <button type="button" id="reset-btn">Reset</button>
      </div>
    </header>
    <div id="setup-screen" class="scenario-selector">
      <div class="settings-panel">
        <h3>Instellingen</h3>
        <p class="setup-intro">Kies een scenario en pas daarna leerdoelen en niveau aan.</p>
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
          <div class="leerdoel-limit">Maximaal 2 tegelijk <span id="leerdoel-count">1/2</span></div>
          <div class="leerdoel-groups">${buildLeerdoelSelectionHtml()}</div>
          <button type="button" id="setup-theory-btn" class="setup-theory-link">Bekijk theorie bij geselecteerde leerdoelen</button>
          <p id="setup-theory-error" class="inline-error" role="alert" aria-live="polite"></p>
        </div>
        <div class="setting-group">
          <label>Niveau:</label>
          <select id="moeilijkheid-select">${SETTINGS_OPTIONS.moeilijkheid.map(m => `<option value="${m}" ${m === 'Gemiddeld' ? 'selected' : ''}>${m}</option>`).join('')}</select>
        </div>
        <div class="setting-group" id="archetype-group">
          <label>Client type:</label>
          <select id="archetype-select">${SETTINGS_OPTIONS.clientArchetype.map(a => `<option value="${a}">${a}</option>`).join('')}</select>
        </div>
        <div class="setting-group" id="custom-archetype-group" style="display: none;">
          <label>Beschrijf het clienttype:</label>
          <input type="text" id="custom-archetype-input" placeholder="Bijv: kind met downsyndroom, tiener met ADHD...">
        </div>
        <button type="button" id="start-btn" style="width: 100%; margin-top: 1rem;">Start maatwerk gesprek</button>
        <p id="setup-error" class="inline-error" role="alert" aria-live="polite"></p>
      </div>

      <hr style="margin: 1.5rem 0; border: 0; border-top: 1px solid #eee;">

      <h3>Kies een startscenario:</h3>
      <p id="scenario-prefill-message" class="scenario-prefill-message" aria-live="polite"></p>
      <div class="setting-group">
        <select id="predefined-scenario-select">
          <option value="" disabled selected>Kies een scenario...</option>
          ${scenarios.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
        </select>
      </div>
      <div id="selected-scenario-description" class="scenario-description-box" style="display: none;"></div>
      <button type="button" id="start-predefined-btn" class="secondary-btn" style="display: none; width: 100%; margin-top: 0.5rem;">Start dit scenario</button>
    </div>
    <div id="chat-session-meta" class="chat-session-meta" style="display: none;">
      <div id="chat-context-bar" class="chat-context-bar"></div>
      <div id="chat-turn-status" class="chat-turn-status"></div>
    </div>
    <div id="chat-container" style="display: none;"></div>
    <div id="input-area" style="display: none;">
      <div id="checklist-panel" class="checklist-panel" style="display: none;" aria-hidden="true">
        <div class="checklist-header">
          <span>Geheugensteuntje</span>
          <button type="button" id="checklist-close" class="checklist-close-btn" aria-label="Sluit geheugensteuntje">&times;</button>
        </div>
        <div class="checklist-body" id="checklist-body"></div>
      </div>
      <div class="input-toolbar">
        <button type="button" id="theory-btn" title="Bekijk theorie">Theorie</button>
        <button type="button" id="checklist-btn" title="Geheugensteuntje" aria-expanded="false" aria-controls="checklist-panel">Checklist</button>
        <button type="button" id="hint-btn" title="Vraag een tip">Tip</button>
      </div>
      <div class="speech-toggle">
        <span class="speech-toggle-label">Spraak</span>
        <label class="toggle-switch">
          <input type="checkbox" id="speech-toggle-input" role="switch" aria-label="Spraakmodus aan/uit" aria-checked="false">
          <span class="toggle-slider"></span>
        </label>
      </div>
      <form id="input-form">
        <input type="text" id="user-input" placeholder="Typ je bericht..." autocomplete="off">
        <button type="submit">Verstuur</button>
      </form>
      <div id="speech-input" style="display: none;">
        <div class="live-conversation">
          <button type="button" id="live-conv-btn" class="live-conv-button" title="Start live gesprek">
            <svg class="mic-icon" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
            <span class="live-conv-label">Start gesprek</span>
          </button>
          <div class="live-status" id="live-status" style="display: none;">
            <div class="live-indicator"></div>
            <span class="live-status-text">Luistert...</span>
          </div>
        </div>
      </div>
      <div class="conversation-end-actions">
        <button type="button" id="end-conversation-btn" class="end-conversation-btn" style="display: none;">Rond gesprek af</button>
        <button type="button" id="feedback-btn" class="feedback-action-btn" title="Rond het gesprek af en bekijk feedback" style="display: none;">Feedback bekijken</button>
      </div>
    </div>
    <div id="theory-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Theorie</h2>
          <button type="button" id="close-theory-btn" class="close-btn" aria-label="Sluit theorievenster">&times;</button>
        </div>
        <div id="theory-content" class="modal-body"></div>
      </div>
    </div>
    <div id="help-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Hulp</h2>
          <button type="button" id="close-help-btn" class="close-btn" aria-label="Sluit hulpvenster">&times;</button>
        </div>
        <div class="modal-body">
          <p>Oefen gesprekstechnieken met een virtuele client of collega. Zo werkt het:</p>
          <ol>
            <li><strong>Stel je gesprek in</strong> - Kies een scenario of vul zelf instellingen in.</li>
            <li><strong>Voer het gesprek</strong> - Typ of spreek je antwoorden en gebruik Theorie, Checklist en Tip.</li>
            <li><strong>Rond af</strong> - Gebruik na voldoende beurten de knop 'Rond gesprek af'.</li>
            <li><strong>Vraag feedback</strong> - Bekijk daarna je analyse en exporteer naar PDF.</li>
          </ol>
        </div>
      </div>
    </div>
    <div id="feedback-screen" class="tab-feedback" style="display: none;">
      <div class="feedback-export-controls">
        <label for="student-name-input">Studentnaam (optioneel)</label>
        <input type="text" id="student-name-input" maxlength="100" placeholder="Bijv. Samira de Vries">
      </div>
      <div id="feedback-export-summary" class="feedback-export-summary"></div>
      <div class="feedback-tabs" role="tablist" aria-label="Feedback onderdelen">
        <button type="button" id="feedback-tab-gesprek" class="feedback-tab" role="tab" aria-selected="false">Gesprek</button>
        <button type="button" id="feedback-tab-feedback" class="feedback-tab active" role="tab" aria-selected="true">Feedback</button>
      </div>
      <div class="feedback-container">
        <div class="feedback-gesprek">
          <h3>Gesprek</h3>
          <div id="feedback-gesprek-content"></div>
        </div>
        <div class="feedback-panel">
          <div class="feedback-panel-header">
            <h3>Feedback</h3>
            <div class="feedback-panel-actions">
              <button type="button" id="dashboard-btn" class="copy-feedback-btn" title="Open docentdashboard">Docentdashboard</button>
              <button type="button" id="copy-feedback-btn" class="copy-feedback-btn" title="Kopieer feedback" style="display: none;">Kopieer</button>
              <button type="button" id="export-feedback-btn" class="copy-feedback-btn" title="Exporteer feedback als PDF">Exporteer als PDF</button>
            </div>
          </div>
          <div id="feedback-content">
            <p class="feedback-loading">Feedback wordt gegenereerd...</p>
          </div>
        </div>
      </div>
      <button type="button" id="new-conversation-btn">Nieuw gesprek</button>
    </div>
    <div id="dashboard-modal" class="modal" style="display: none;">
      <div class="modal-content dashboard-modal-content">
        <div class="modal-header">
          <h2>Docentdashboard</h2>
          <button type="button" id="close-dashboard-btn" class="close-btn" aria-label="Sluit dashboard">&times;</button>
        </div>
        <div id="dashboard-content" class="modal-body"></div>
      </div>
    </div>
    <div id="confirm-modal" class="modal" style="display: none;">
      <div class="modal-content confirm-modal-content" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <div class="modal-header">
          <h2 id="confirm-title">Bevestiging</h2>
        </div>
        <div class="modal-body">
          <p id="confirm-message"></p>
          <div class="confirm-actions">
            <button type="button" id="confirm-cancel-btn" class="modal-secondary-btn">Annuleren</button>
            <button type="button" id="confirm-ok-btn" class="modal-primary-btn">Doorgaan</button>
          </div>
        </div>
      </div>
    </div>
    <div id="toast-container" class="toast-container" aria-live="polite"></div>
  `

  document.querySelector('#start-btn')?.addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('input[name="leerdoel"]:checked');
    if (checkboxes.length === 0) {
      setInlineError('setup-error', 'Selecteer minimaal 1 leerdoel (of kies "Vrije oefening").');
      return;
    }
    clearInlineError('setup-error');
    updateSettings();
    startScenarioFromSettings();
  });

  document.querySelector('#help-btn')?.addEventListener('click', () => {
    const helpModal = document.querySelector('#help-modal') as HTMLDivElement | null;
    if (helpModal) helpModal.style.display = 'flex';
  });

  document.querySelector('#close-help-btn')?.addEventListener('click', () => {
    const helpModal = document.querySelector('#help-modal') as HTMLDivElement | null;
    if (helpModal) helpModal.style.display = 'none';
  });

  document.querySelector('#help-modal')?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).id === 'help-modal') {
      const helpModal = document.querySelector('#help-modal') as HTMLDivElement | null;
      if (helpModal) helpModal.style.display = 'none';
    }
  });

  document.querySelector('#scenario-type-select')?.addEventListener('change', (e) => {
    const value = (e.target as HTMLSelectElement).value;
    const customGroup = document.querySelector('#custom-scenario-group') as HTMLDivElement;
    const archetypeGroup = document.querySelector('#archetype-group') as HTMLDivElement;
    const prefillMessage = document.querySelector('#scenario-prefill-message') as HTMLParagraphElement | null;

    if (customGroup) {
      customGroup.style.display = value === 'Eigen scenario' ? 'flex' : 'none';
    }
    if (archetypeGroup) {
      archetypeGroup.style.display = value === 'Eigen scenario' ? 'none' : 'flex';
    }
    if (prefillMessage) prefillMessage.textContent = '';
  });

  document.querySelector('#archetype-select')?.addEventListener('change', (e) => {
    const value = (e.target as HTMLSelectElement).value;
    const customArchetypeGroup = document.querySelector('#custom-archetype-group') as HTMLDivElement;
    if (customArchetypeGroup) {
      customArchetypeGroup.style.display = value === 'Eigen type' ? 'flex' : 'none';
    }
  });

  const scenarioSelect = document.querySelector('#predefined-scenario-select') as HTMLSelectElement;
  const descriptionBox = document.querySelector('#selected-scenario-description') as HTMLDivElement;
  const startScenarioBtn = document.querySelector('#start-predefined-btn') as HTMLButtonElement;

  scenarioSelect?.addEventListener('change', (e) => {
    const id = (e.target as HTMLSelectElement).value;
    const scenario = scenarios.find(s => s.id === id);
    if (!scenario) return;

    descriptionBox.style.display = 'block';
    descriptionBox.innerHTML = `<strong>${scenario.name}</strong>${scenario.description}`;

    startScenarioBtn.style.display = 'block';

    // Automatically prefill settings when selecting (preview)
    const settingSelect = document.querySelector('#setting-select') as HTMLSelectElement | null;
    const scenarioTypeSelect = document.querySelector('#scenario-type-select') as HTMLSelectElement | null;
    const archetypeSelect = document.querySelector('#archetype-select') as HTMLSelectElement | null;
    const moeilijkheidSelect = document.querySelector('#moeilijkheid-select') as HTMLSelectElement | null;
    const checkboxes = document.querySelectorAll('input[name="leerdoel"]');

    if (settingSelect && scenario.setting) settingSelect.value = scenario.setting;
    if (scenarioTypeSelect && scenario.scenarioType) scenarioTypeSelect.value = scenario.scenarioType;
    if (archetypeSelect && scenario.archetype) archetypeSelect.value = scenario.archetype;
    if (moeilijkheidSelect && scenario.moeilijkheid) moeilijkheidSelect.value = scenario.moeilijkheid;

    if (scenario.recommendedLeerdoelen) {
      checkboxes.forEach(cb => {
        const input = cb as HTMLInputElement;
        input.checked = scenario.recommendedLeerdoelen!.includes(input.value);
      });
      updateStartButtonState();
    }
  });

  startScenarioBtn?.addEventListener('click', () => {
    const id = scenarioSelect.value;
    if (id) startScenario(id);
  });

  const form = document.querySelector<HTMLFormElement>('#input-form');
  form?.addEventListener('submit', (e) => {
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

  document.querySelector('#theory-modal')?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).id === 'theory-modal') {
      closeTheory();
    }
  });

  document.querySelector('#end-conversation-btn')?.addEventListener('click', () => {
    endConversation();
  });

  document.querySelector('#feedback-btn')?.addEventListener('click', () => {
    showFeedback();
  });

  document.querySelector('#copy-feedback-btn')?.addEventListener('click', copyFeedback);
  document.querySelector('#export-feedback-btn')?.addEventListener('click', printFeedback);
  document.querySelector('#dashboard-btn')?.addEventListener('click', () => {
    renderDashboard();
    const modal = document.querySelector('#dashboard-modal') as HTMLDivElement | null;
    if (modal) modal.style.display = 'flex';
  });

  document.querySelector('#close-dashboard-btn')?.addEventListener('click', () => {
    const modal = document.querySelector('#dashboard-modal') as HTMLDivElement | null;
    if (modal) modal.style.display = 'none';
  });

  document.querySelector('#dashboard-modal')?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).id === 'dashboard-modal') {
      const modal = document.querySelector('#dashboard-modal') as HTMLDivElement | null;
      if (modal) modal.style.display = 'none';
    }
  });

  document.querySelector('#feedback-tab-gesprek')?.addEventListener('click', () => {
    setFeedbackTab('gesprek');
  });

  document.querySelector('#feedback-tab-feedback')?.addEventListener('click', () => {
    setFeedbackTab('feedback');
  });

  document.querySelector('#student-name-input')?.addEventListener('input', () => {
    renderFeedbackExportSummary();
  });

  document.querySelector('#new-conversation-btn')?.addEventListener('click', () => {
    location.reload();
  });

  document.querySelector('#reset-btn')?.addEventListener('click', async () => {
    const shouldReset = conversationHistory.length === 0
      || await showConfirmDialog('Weet je zeker dat je het gesprek wilt afsluiten? Je voortgang gaat verloren.');
    if (shouldReset) location.reload();
  });

  document.querySelector('#speech-toggle-input')?.addEventListener('change', (e) => {
    const toggle = e.target as HTMLInputElement;
    speechMode = toggle.checked;
    toggle.setAttribute('aria-checked', String(speechMode));

    const inputForm = document.querySelector('#input-form') as HTMLElement;
    const speechInput = document.querySelector('#speech-input') as HTMLElement;
    if (speechMode) {
      inputForm.style.display = 'none';
      speechInput.style.display = 'flex';
    } else {
      inputForm.style.display = 'flex';
      speechInput.style.display = 'none';
      if (liveConversationActive) stopLiveConversation();
    }
  });

  document.querySelector('#live-conv-btn')?.addEventListener('click', () => {
    if (liveConversationActive) {
      stopLiveConversation();
    } else {
      startLiveConversation();
    }
  });

  const leerdoelGroup = document.querySelector('.leerdoel-groups');
  leerdoelGroup?.addEventListener('change', () => {
    clearInlineError('setup-error');
    clearInlineError('setup-theory-error');
    updateStartButtonState();
  });
  updateStartButtonState();

  document.querySelector('#setup-theory-btn')?.addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('input[name="leerdoel"]:checked');
    const currentLeerdoelen = Array.from(checkboxes).map(cb => (cb as HTMLInputElement).value);
    if (currentLeerdoelen.length === 0) {
      setInlineError('setup-theory-error', 'Selecteer eerst minimaal 1 leerdoel om theorie te bekijken.');
      return;
    }
    clearInlineError('setup-theory-error');
    const previousLeerdoelen = selectedSettings.leerdoelen;
    selectedSettings.leerdoelen = currentLeerdoelen;
    showTheory();
    selectedSettings.leerdoelen = previousLeerdoelen;
  });

  document.querySelector('#checklist-btn')?.addEventListener('click', () => {
    const panel = document.querySelector('#checklist-panel') as HTMLDivElement;
    const isVisible = !!panel && panel.style.display !== 'none';
    if (!isVisible) populateChecklist();
    setChecklistPanelVisibility(!isVisible);
  });

  document.querySelector('#checklist-close')?.addEventListener('click', () => {
    setChecklistPanelVisibility(false);
  });

  setAppMode('setup');
  setFeedbackTab('feedback');
  renderFeedbackExportSummary();
  updateConversationActionButtons();
  updateChatSessionMeta();
}

function updateStartButtonState() {
  const MAX_LEERDOELEN = 2;
  const startBtn = document.querySelector('#start-btn') as HTMLButtonElement;
  const countEl = document.querySelector('#leerdoel-count') as HTMLSpanElement | null;
  const checked = document.querySelectorAll('input[name="leerdoel"]:checked');
  const allCheckboxes = document.querySelectorAll('input[name="leerdoel"]');

  // Disable unchecked checkboxes when max is reached
  allCheckboxes.forEach(cb => {
    const input = cb as HTMLInputElement;
    input.disabled = !input.checked && checked.length >= MAX_LEERDOELEN;
  });

  if (countEl) countEl.textContent = `${checked.length}/${MAX_LEERDOELEN}`;

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
  const placeholderName = isCollegaMode ? "De collega" : "De cliënt";

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

  document.querySelectorAll('.scenario-card.predefined').forEach(card => card.classList.remove('selected'));

  conversationHistory = [];
  selfAssessment = {};
  conversationStartedAt = new Date();
  conversationClosed = false;
  latestFeedbackScores = null;
  dashboardSavedForConversation = false;
  prepareChat();
  const scenarioLabel = selectedSettings.scenarioType === 'Eigen scenario' ? selectedSettings.customScenario.substring(0, 50) + '...' : selectedSettings.scenarioType;
  const rolLabel = isCollegaMode ? 'Collega' : 'Cliënt';
  addMessage('Systeem', `Gesprek gestart in ${selectedSettings.setting}. Scenario: ${scenarioLabel}`, 'system');
  addTypingIndicator(rolLabel, 'patient');

  // Request dynamic opening from Claude
  updateChatSessionMeta();

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

  let openingPrompt: string;
  if (isCollegaMode) {
    const collegaRol = COLLEGA_ROLLEN[selectedSettings.setting] || 'collega';
    openingPrompt = `Je bent ${randomHint}, een ${collegaRol} in ${selectedSettings.setting}.
${scenarioDescription}

Je naam is ${randomHint}. Begin je antwoord VERPLICHT met je naam in dit formaat: [NAAM: ${randomHint}]
Genereer daarna je EERSTE zin als collega. Je begint het gesprek — je verwacht informatie van de student (bijv. een overdracht, een telefonisch consult, of een overleg).
Gebruik *italics* voor non-verbaal gedrag. Houd het kort (1-2 zinnen).

Voorbeeld output:
[NAAM: ${randomHint}]
*Loopt snel de kamer binnen met een kop koffie* Hé, goedemorgen. Hoe is de nacht geweest? Zijn er bijzonderheden?`;
  } else {
    openingPrompt = `Je bent ${randomHint}, een ${archetypeDescription.toLowerCase()} in ${selectedSettings.setting}.
${scenarioDescription}

Je naam is ${randomHint}. Begin je antwoord VERPLICHT met je naam in dit formaat: [NAAM: ${randomHint}]
Genereer daarna je EERSTE zin als cliënt. Beschrijf kort je situatie en stemming passend bij de setting.
Gebruik *italics* voor non-verbaal gedrag. Houd het kort (1-2 zinnen).

Voorbeeld output:
[NAAM: ${randomHint}]
*Kijkt op vanuit de stoel* Goedemorgen... ben ik eindelijk aan de beurt?`;
  }

  /* 
   * Optimization: Lazy load the large system prompt only when starting the scenario.
   * This reduces the initial bundle size significantly.
   */
  try {
    if (!cachedSystemPrompt) {
      const promptModule = await import('./prompts/system-prompt');
      cachedSystemPrompt = promptModule.SYSTEM_PROMPT_MBO_V2;
    }
  } catch (error) {
    console.error('Failed to load system prompt:', error);
    addMessage('Systeem', 'Fout: Kon de systeem-prompt niet laden.', 'system');
    return;
  }

  // Haal kennis op voor geselecteerde leerdoelen
  const clientInstructies = getClientInstructies(selectedSettings.leerdoelen);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt: cachedSystemPrompt
          .replace('{{SETTING}}', selectedSettings.setting)
          .replace('{{SCENARIO_TYPE}}', selectedSettings.scenarioType)
          .replace('{{LEERDOELEN}}', selectedSettings.leerdoelen.join(', '))
          .replace('{{MOEILIJKHEID_BESCHRIJVING}}', isCollegaMode
            ? (MOEILIJKHEID_COLLEGA[selectedSettings.moeilijkheid] || MOEILIJKHEID_COLLEGA['Gemiddeld'])
            : (MOEILIJKHEID_BESCHRIJVING[selectedSettings.moeilijkheid] || MOEILIJKHEID_BESCHRIJVING['Gemiddeld']))
          .replace('{{ARCHETYPE_BESCHRIJVING}}', currentArchetypeBeschrijving)
          .replace('{{PATIENT_NAME}}', placeholderName)
          .replace('{{ROLTYPE_CONTEXT}}', isCollegaMode ? getCollegaContext(selectedSettings.setting) : '')
          + clientInstructies,
        messages: [{ role: 'user', content: openingPrompt }]
      })
    });

    const data = await response.json();

    removeTypingIndicators();

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
        updateChatSessionMeta();
      } else {
        conversationHistory.push({ role: 'assistant', content: data.response });
        addMessage(isCollegaMode ? 'Collega' : 'Client', data.response, 'patient');
        updateChatSessionMeta();
      }
    }
  } catch (error) {
    removeTypingIndicators();
    addMessage('Systeem', 'Er is een probleem met de verbinding. Probeer het later opnieuw of neem contact op met je docent.', 'system');
  }
}

function startScenario(id: string) {
  const preset = scenarios.find(s => s.id === id) || null;
  if (!preset) return;

  currentScenario = preset;

  selectedSettings.setting = preset.setting || selectedSettings.setting;
  selectedSettings.scenarioType = preset.scenarioType || selectedSettings.scenarioType;
  selectedSettings.archetype = preset.archetype || selectedSettings.archetype;
  selectedSettings.moeilijkheid = preset.moeilijkheid || selectedSettings.moeilijkheid;
  selectedSettings.customScenario = '';
  selectedSettings.customArchetype = '';
  if (preset.recommendedLeerdoelen && preset.recommendedLeerdoelen.length > 0) {
    selectedSettings.leerdoelen = preset.recommendedLeerdoelen.slice(0, 2);
  }

  const settingSelect = document.querySelector('#setting-select') as HTMLSelectElement | null;
  const scenarioTypeSelect = document.querySelector('#scenario-type-select') as HTMLSelectElement | null;
  const archetypeSelect = document.querySelector('#archetype-select') as HTMLSelectElement | null;
  const moeilijkheidSelect = document.querySelector('#moeilijkheid-select') as HTMLSelectElement | null;
  const customScenarioInput = document.querySelector('#custom-scenario-input') as HTMLTextAreaElement | null;
  const customArchetypeInput = document.querySelector('#custom-archetype-input') as HTMLInputElement | null;
  const checkboxes = document.querySelectorAll('input[name="leerdoel"]');
  const scenarioPrefillMessage = document.querySelector('#scenario-prefill-message') as HTMLParagraphElement | null;

  if (settingSelect) settingSelect.value = selectedSettings.setting;
  if (scenarioTypeSelect) scenarioTypeSelect.value = selectedSettings.scenarioType;
  if (archetypeSelect) archetypeSelect.value = selectedSettings.archetype;
  if (moeilijkheidSelect) moeilijkheidSelect.value = selectedSettings.moeilijkheid;
  if (customScenarioInput) customScenarioInput.value = '';
  if (customArchetypeInput) customArchetypeInput.value = '';

  checkboxes.forEach(cb => {
    const input = cb as HTMLInputElement;
    input.checked = selectedSettings.leerdoelen.includes(input.value);
  });
  updateStartButtonState();

  const customGroup = document.querySelector('#custom-scenario-group') as HTMLDivElement | null;
  const archetypeGroup = document.querySelector('#archetype-group') as HTMLDivElement | null;
  const customArchetypeGroup = document.querySelector('#custom-archetype-group') as HTMLDivElement | null;
  if (customGroup) customGroup.style.display = selectedSettings.scenarioType === 'Eigen scenario' ? 'flex' : 'none';
  if (archetypeGroup) archetypeGroup.style.display = selectedSettings.scenarioType === 'Eigen scenario' ? 'none' : 'flex';
  if (customArchetypeGroup) customArchetypeGroup.style.display = selectedSettings.archetype === 'Eigen type' ? 'flex' : 'none';

  const scenarioSelect = document.querySelector('#predefined-scenario-select') as HTMLSelectElement | null;
  if (scenarioSelect && scenarioSelect.value !== id) {
    scenarioSelect.value = id;
    // Trigger change event to show description if set programmatically
    scenarioSelect.dispatchEvent(new Event('change'));
  }

  if (scenarioPrefillMessage) {
    scenarioPrefillMessage.textContent = `Startpunt geladen: ${preset.name}. Kies eventueel andere leerdoelen of niveau en klik daarna op 'Start maatwerk gesprek'.`;
  }

  showToast(`Startpunt geladen: ${preset.name}`, 'info');
  clearInlineError('setup-error');
  clearInlineError('setup-theory-error');
  document.querySelector('.settings-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function prepareChat() {
  setAppMode('chat');
  const feedbackScreen = document.querySelector('#feedback-screen') as HTMLDivElement | null;
  if (feedbackScreen) feedbackScreen.style.display = 'none';
  setFeedbackTab('feedback');
  const input = document.querySelector('#user-input') as HTMLInputElement | null;
  const submitBtn = document.querySelector('#input-form button[type="submit"]') as HTMLButtonElement | null;
  if (input) {
    input.disabled = false;
    input.placeholder = 'Typ je bericht...';
  }
  if (submitBtn) submitBtn.disabled = false;
  document.querySelector<HTMLDivElement>('#setup-screen')!.style.display = 'none';
  document.querySelector<HTMLDivElement>('#chat-session-meta')!.style.display = 'flex';
  document.querySelector<HTMLDivElement>('#chat-container')!.style.display = 'flex';
  document.querySelector<HTMLDivElement>('#input-area')!.style.display = 'flex';
  animateScreenEntry('#chat-session-meta');
  animateScreenEntry('#chat-container');
  animateScreenEntry('#input-area');
  setChecklistPanelVisibility(false);
  updateChatSessionMeta();
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

function buildSelfAssessmentForm(leerdoelen: string[]): string {
  const kennis = getKennisVoorLeerdoelen(leerdoelen);
  if (kennis.length === 0) return '';

  let html = '<div class="self-assessment"><h3>Hoe vond je zelf dat het ging?</h3><p class="sa-intro">Beoordeel jezelf voordat je de AI-feedback ziet.</p>';
  for (const k of kennis) {
    html += `<fieldset class="sa-fieldset"><legend>${k.naam}</legend><div class="sa-options">`;
    const options = [
      { value: 'goed', label: '😊 Dit ging goed' },
      { value: 'twijfel', label: '🤔 Twijfel' },
      { value: 'beter', label: '😬 Dit kan beter' }
    ];
    for (const opt of options) {
      html += `<label class="sa-option"><input type="radio" name="sa-${k.id}" value="${opt.value}"><span>${opt.label}</span></label>`;
    }
    html += '</div></fieldset>';
  }
  html += '<button type="button" id="sa-submit-btn" class="sa-submit-btn">Bekijk AI-feedback</button></div>';
  return html;
}

function buildSelfAssessmentSummary(): string {
  const entries = Object.entries(selfAssessment);
  if (entries.length === 0) return '';

  const emojiMap: Record<string, string> = { goed: '🟢', twijfel: '🟡', beter: '🔴' };
  const labelMap: Record<string, string> = { goed: 'ging goed', twijfel: 'twijfel', beter: 'kan beter' };

  let html = '<div class="sa-summary"><strong>Jouw zelfbeoordeling:</strong>';
  for (const [leerdoel, score] of entries) {
    html += `<span class="sa-summary-item">${emojiMap[score] || '⚪'} ${leerdoel}: ${labelMap[score] || score}</span>`;
  }
  html += '</div>';
  return html;
}

function buildSelfAssessmentContext(): string {
  const entries = Object.entries(selfAssessment);
  if (entries.length === 0) return 'De student heeft geen zelfbeoordeling ingevuld.';

  const labelMap: Record<string, string> = { goed: 'Dit ging goed', twijfel: 'Twijfel', beter: 'Dit kan beter' };
  return entries.map(([leerdoel, score]) => `- ${leerdoel}: ${labelMap[score] || score}`).join('\n');
}

async function generateAIFeedback() {
  const feedbackContent = document.querySelector('#feedback-content')!;
  const summaryHtml = buildSelfAssessmentSummary();
  feedbackContent.innerHTML = summaryHtml + '<p class="feedback-loading">Feedback wordt gegenereerd...</p>';

  const transcript = conversationHistory.map(msg => {
    const speaker = msg.role === 'user' ? 'Student' : `${isCollegaMode ? 'Collega' : 'Cliënt'} (${currentScenario?.persona.name || (isCollegaMode ? 'de collega' : 'de cliënt')})`;
    return `${speaker}: ${msg.content}`;
  }).join('\n\n');

  const coachKennis = getCoachContext(selectedSettings.leerdoelen);
  const rubricKennis = getRubricContext(selectedSettings.leerdoelen);
  const selfAssessmentContext = buildSelfAssessmentContext();

  // Lazy load feedback prompt
  let feedbackPromptTemplate;
  try {
    const promptModule = await import('./prompts/feedback-prompt');
    feedbackPromptTemplate = promptModule.FEEDBACK_PROMPT;
  } catch (error) {
    console.error('Failed to load feedback prompt:', error);
    feedbackContent.innerHTML = summaryHtml + '<p class="feedback-error">Kon feedback-prompt niet laden. Probeer opnieuw.</p>';
    return;
  }

  const feedbackSystemPrompt = feedbackPromptTemplate
    .replace('{{LEERDOELEN}}', selectedSettings.leerdoelen.join(', '))
    .replace('{{COACH_KENNIS}}', coachKennis)
    .replace('{{RUBRIC}}', rubricKennis)
    .replace('{{SELF_ASSESSMENT}}', selfAssessmentContext);

  const feedbackUserPrompt = `Hier is het volledige gesprek tussen de student en de cliënt:

---
${transcript}
---

Context:
- Setting: ${selectedSettings.setting}
- Scenario: ${selectedSettings.scenarioType}
- Cliënttype: ${selectedSettings.archetype}
- Niveau: ${selectedSettings.moeilijkheid}
- Leerdoelen: ${selectedSettings.leerdoelen.join(', ')}
- Aantal beurten: ${conversationHistory.length}

Geef nu je feedback volgens de voorgeschreven structuur.`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt: feedbackSystemPrompt,
        messages: [{ role: 'user', content: feedbackUserPrompt }]
      })
    });

    const data = await response.json();

    if (data.error) {
      feedbackContent.innerHTML = summaryHtml + `<p class="feedback-error">Kon geen feedback genereren: ${data.error}</p>`;
    } else {
      latestFeedbackScores = getFeedbackScores(data.response);
      feedbackContent.innerHTML = summaryHtml + formatFeedback(data.response);
      const copyBtn = document.querySelector('#copy-feedback-btn') as HTMLButtonElement;
      if (copyBtn) copyBtn.style.display = 'inline-flex';
      saveCurrentSessionToDashboard();
      showToast('Feedback is gereed en opgeslagen in het dashboard.', 'success');
    }
  } catch (error) {
    feedbackContent.innerHTML = summaryHtml + '<p class="feedback-error">Kon geen verbinding maken met de server.</p>';
  }
}

async function showFeedback() {
  if (!conversationClosed) {
    addMessage('Systeem', 'Rond eerst het gesprek af met de knop "Rond gesprek af".', 'system');
    return;
  }

  if (conversationHistory.length < 2) {
    addMessage('Systeem', 'Voer eerst een gesprek voordat je feedback vraagt.', 'system');
    return;
  }

  // Hide chat and input, show feedback screen
  setAppMode('feedback');
  document.querySelector<HTMLDivElement>('#chat-session-meta')!.style.display = 'none';
  document.querySelector<HTMLDivElement>('#chat-container')!.style.display = 'none';
  document.querySelector<HTMLDivElement>('#input-area')!.style.display = 'none';
  updateChatSessionMeta();
  const feedbackScreen = document.querySelector<HTMLDivElement>('#feedback-screen')!;
  feedbackScreen.style.display = 'flex';
  animateScreenEntry('#feedback-screen');
  setFeedbackTab('feedback');
  renderFeedbackExportSummary();

  // Copy conversation to feedback panel
  const gesprekContent = document.querySelector('#feedback-gesprek-content')!;
  const chatContainer = document.querySelector('#chat-container')!;
  gesprekContent.innerHTML = chatContainer.innerHTML;

  const copyBtn = document.querySelector('#copy-feedback-btn') as HTMLButtonElement | null;
  if (copyBtn) copyBtn.style.display = 'none';

  // Show self-assessment form first
  const feedbackContent = document.querySelector('#feedback-content')!;
  const saForm = buildSelfAssessmentForm(selectedSettings.leerdoelen);

  if (saForm) {
    feedbackContent.innerHTML = saForm;

    document.querySelector('#sa-submit-btn')?.addEventListener('click', () => {
      // Collect self-assessment answers
      selfAssessment = {};
      const kennis = getKennisVoorLeerdoelen(selectedSettings.leerdoelen);
      let allAnswered = true;
      for (const k of kennis) {
        const selected = document.querySelector(`input[name="sa-${k.id}"]:checked`) as HTMLInputElement;
        if (selected) {
          selfAssessment[k.naam] = selected.value;
        } else {
          allAnswered = false;
        }
      }

      if (!allAnswered) {
        const hint = document.querySelector('.sa-hint');
        if (!hint) {
          const p = document.createElement('p');
          p.className = 'sa-hint';
          p.textContent = 'Beoordeel alle leerdoelen voordat je verdergaat.';
          document.querySelector('#sa-submit-btn')?.before(p);
        }
        return;
      }

      generateAIFeedback();
    });
  } else {
    // No leerdoelen with knowledge — skip self-assessment
    selfAssessment = {};
    generateAIFeedback();
  }
}

function formatFeedback(text: string): string {
  // Extract SCORES block
  let scoreHtml = '';
  const scoresMatch = text.match(/<!--SCORES\n([\s\S]*?)SCORES-->/);
  if (scoresMatch) {
    const lines = scoresMatch[1].trim().split('\n').filter(l => l.includes('|'));
    // Skip header line if present
    const dataLines = lines.filter(l => !l.startsWith('leerdoel|'));
    const grouped: Record<string, { criterium: string; score: string }[]> = {};
    for (const line of dataLines) {
      const [leerdoel, criterium, score] = line.split('|').map(s => s.trim());
      if (!leerdoel || !criterium || !score) continue;
      if (!grouped[leerdoel]) grouped[leerdoel] = [];
      grouped[leerdoel].push({ criterium, score });
    }

    if (Object.keys(grouped).length > 0) {
      scoreHtml = '<div class="score-table-container">';
      for (const [leerdoel, criteria] of Object.entries(grouped)) {
        scoreHtml += `<div class="score-leerdoel-label">${leerdoel}</div>`;
        for (const { criterium, score } of criteria) {
          const scoreClass = score === 'goed' ? 'score-goed' : score === 'voldoende' ? 'score-voldoende' : 'score-onvoldoende';
          scoreHtml += `<div class="score-row"><span class="score-dot ${scoreClass}"></span><span class="score-criterium">${criterium}</span><span class="score-label ${scoreClass}">${score}</span></div>`;
        }
      }
      scoreHtml += '</div>';
    }

    // Remove SCORES block from text
    text = text.replace(/<!--SCORES\n[\s\S]*?SCORES-->\n*/, '');
  }

  const feedbackHtml = text
    .replace(/### (.*)/g, '<h4>$1</h4>')
    .replace(/## (.*)/g, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/"(.*?)"/g, '<q>$1</q>')
    .replace(/\n- /g, '<br>• ')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');

  return scoreHtml + feedbackHtml;
}

function copyFeedback() {
  const el = document.querySelector('#feedback-content');
  if (!el) return;
  navigator.clipboard.writeText((el as HTMLElement).innerText).then(() => {
    const btn = document.querySelector('#copy-feedback-btn') as HTMLButtonElement;
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = 'Gekopieerd';
      setTimeout(() => { btn.textContent = orig; }, 2000);
    }
    showToast('Feedback gekopieerd naar klembord.', 'success');
  });
}

async function endConversation() {
  if (isWaitingForResponse || conversationClosed) return;
  if (liveConversationActive) stopLiveConversation();

  if (getStudentTurnCount() < RECOMMENDED_MIN_TURNS) {
    addMessage('Systeem', `Probeer minimaal ${RECOMMENDED_MIN_TURNS} beurten voordat je afrondt.`, 'system');
    return;
  }

  const input = document.querySelector<HTMLInputElement>('#user-input');
  const submitBtn = document.querySelector<HTMLButtonElement>('#input-form button[type="submit"]');
  const endBtn = document.querySelector<HTMLButtonElement>('#end-conversation-btn');

  // Immediately close conversation
  conversationClosed = true;

  if (input) {
    input.value = '';
    input.disabled = true;
    input.placeholder = 'Gesprek afgerond. Bekijk nu feedback.';
  }
  if (submitBtn) submitBtn.disabled = true;
  if (endBtn) endBtn.disabled = true;

  addMessage('Systeem', 'Je hebt het gesprek afgerond. Je kunt nu feedback bekijken.', 'system');
  showToast('Gesprek afgerond. Feedback is nu beschikbaar.', 'success');

  updateChatSessionMeta();
}

function handleSendMessage() {
  if (isWaitingForResponse) return;
  if (conversationClosed) return;
  const input = document.querySelector<HTMLInputElement>('#user-input')!;
  const text = input.value.trim();
  if (!text) return;

  isWaitingForResponse = true;
  const submitBtn = document.querySelector<HTMLButtonElement>('#input-form button[type="submit"]')!;
  input.disabled = true;
  submitBtn.disabled = true;

  addMessage('Jij (Student)', text, 'student');
  input.value = '';
  conversationHistory.push({ role: 'user', content: text });
  updateChatSessionMeta();
  addTypingIndicator(currentScenario?.persona.name || (isCollegaMode ? 'Collega' : 'Client'), 'patient');

  generateResponse().finally(() => {
    isWaitingForResponse = false;
    input.disabled = false;
    submitBtn.disabled = false;
    input.focus();
  });
}

function addMessage(sender: string, text: string, type: 'student' | 'patient' | 'system' | 'meta') {
  const container = document.querySelector('#chat-container')!;
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${type}`;

  const strong = document.createElement('strong');
  strong.textContent = sender;

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.appendChild(formatMessageSafe(text));

  const infoDiv = document.createElement('div');
  infoDiv.className = 'message-info';
  infoDiv.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  msgDiv.appendChild(strong);
  msgDiv.appendChild(contentDiv);
  msgDiv.appendChild(infoDiv);
  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
}

function formatMessageSafe(text: string): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const parts = text.split(/(\*[^*]+\*)/g);

  for (const part of parts) {
    if (part.startsWith('*') && part.endsWith('*')) {
      const div = document.createElement('div');
      div.className = 'nonverbal';
      div.textContent = part.slice(1, -1);
      fragment.appendChild(div);
    } else if (part.trim()) {
      const span = document.createElement('span');
      span.textContent = part;
      fragment.appendChild(span);
    }
  }

  return fragment;
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
  addTypingIndicator('Coach', 'meta');

  // Format conversation as a readable transcript (not as chat messages)
  const transcript = conversationHistory.map(msg => {
    const speaker = msg.role === 'user' ? 'Student' : `${isCollegaMode ? 'Collega' : 'Cliënt'} (${currentScenario?.persona.name || (isCollegaMode ? 'de collega' : 'de cliënt')})`;
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

    removeTypingIndicators();

    if (data.error) {
      addMessage('Systeem', 'Kon geen tip genereren.', 'system');
    } else {
      addMessage('Coach', `💡 ${data.response}`, 'meta');
    }
  } catch (error) {
    removeTypingIndicators();
    addMessage('Systeem', 'Kon geen verbinding maken met de coach. Probeer het opnieuw.', 'system');
  } finally {
    if (hintBtn) hintBtn.disabled = false;
  }
}

async function generateResponseAndReturn(): Promise<string | null> {
  if (!currentScenario) {
    currentScenario = scenarios[0];
  }

  const persona = currentScenario.persona;

  // Haal kennis op voor geselecteerde leerdoelen
  const clientInstructies = getClientInstructies(selectedSettings.leerdoelen);

  // Ensure system prompt is loaded
  if (!cachedSystemPrompt) {
    try {
      const promptModule = await import('./prompts/system-prompt');
      cachedSystemPrompt = promptModule.SYSTEM_PROMPT_MBO_V2;
    } catch (error) {
      console.error('Failed to load system prompt:', error);
      addMessage('Systeem', 'Fout: Kon de systeem-prompt niet laden.', 'system');
      return null;
    }
  }

  // Build dynamic system prompt
  const dynamicPrompt = cachedSystemPrompt
    .replace('{{SETTING}}', selectedSettings.setting)
    .replace('{{SCENARIO_TYPE}}', selectedSettings.scenarioType)
    .replace('{{LEERDOELEN}}', selectedSettings.leerdoelen.join(', '))
    .replace('{{MOEILIJKHEID_BESCHRIJVING}}', isCollegaMode
      ? (MOEILIJKHEID_COLLEGA[selectedSettings.moeilijkheid] || MOEILIJKHEID_COLLEGA['Gemiddeld'])
      : (MOEILIJKHEID_BESCHRIJVING[selectedSettings.moeilijkheid] || MOEILIJKHEID_BESCHRIJVING['Gemiddeld']))
    .replace('{{ARCHETYPE_BESCHRIJVING}}', currentArchetypeBeschrijving)
    .replace('{{PATIENT_NAME}}', persona.name)
    .replace('{{ROLTYPE_CONTEXT}}', isCollegaMode ? getCollegaContext(selectedSettings.setting) : '')
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

    removeTypingIndicators();

    if (data.error) {
      addMessage('Systeem', `Fout: ${data.error}`, 'system');
      return null;
    } else {
      conversationHistory.push({ role: 'assistant', content: data.response });
      addMessage(persona.name, data.response, 'patient');
      updateChatSessionMeta();
      return data.response;
    }
  } catch (error) {
    removeTypingIndicators();
    addMessage('Systeem', 'Er is een probleem met de verbinding. Probeer het later opnieuw of neem contact op met je docent.', 'system');
    return null;
  }
}

async function generateResponse() {
  await generateResponseAndReturn();
}

// --- Live conversation functions ---

function updateLiveStatus(state: 'idle' | 'listening' | 'processing' | 'speaking') {
  const btn = document.querySelector('#live-conv-btn') as HTMLButtonElement;
  const label = btn?.querySelector('.live-conv-label') as HTMLSpanElement;
  const statusEl = document.querySelector('#live-status') as HTMLElement;
  const statusText = statusEl?.querySelector('.live-status-text') as HTMLSpanElement;
  const indicator = statusEl?.querySelector('.live-indicator') as HTMLElement;

  if (!btn || !statusEl) return;

  btn.classList.remove('active');
  statusEl.style.display = 'none';
  indicator?.classList.remove('listening', 'processing', 'speaking');

  switch (state) {
    case 'idle':
      if (label) label.textContent = 'Start gesprek';
      break;
    case 'listening':
      btn.classList.add('active');
      if (label) label.textContent = 'Stop gesprek';
      statusEl.style.display = 'flex';
      indicator?.classList.add('listening');
      if (statusText) statusText.textContent = 'Luistert...';
      break;
    case 'processing':
      btn.classList.add('active');
      if (label) label.textContent = 'Stop gesprek';
      statusEl.style.display = 'flex';
      indicator?.classList.add('processing');
      if (statusText) statusText.textContent = 'Verwerkt...';
      break;
    case 'speaking':
      btn.classList.add('active');
      if (label) label.textContent = 'Stop gesprek';
      statusEl.style.display = 'flex';
      indicator?.classList.add('speaking');
      if (statusText) statusText.textContent = 'Spreekt...';
      break;
  }
}

async function startLiveConversation() {
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    liveConversationActive = true;
    startListeningCycle();
  } catch (err) {
    addMessage('Systeem', 'Kon microfoon niet openen. Controleer je browserinstellingen.', 'system');
  }
}

function stopLiveConversation() {
  liveConversationActive = false;
  // Stop any active recording
  if (silenceTimer) {
    clearTimeout(silenceTimer);
    silenceTimer = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  isRecording = false;
  // Release microphone
  if (micStream) {
    micStream.getTracks().forEach(t => t.stop());
    micStream = null;
  }
  updateLiveStatus('idle');
}

function startListeningCycle() {
  if (!liveConversationActive || !micStream) return;

  audioChunks = [];
  mediaRecorder = new MediaRecorder(micStream, { mimeType: 'audio/webm;codecs=opus' });

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) audioChunks.push(e.data);
  };

  mediaRecorder.onstop = () => {
    if (!liveConversationActive) return;
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
    handleLiveSpeechInput(audioBlob);
  };

  mediaRecorder.start();
  isRecording = true;
  updateLiveStatus('listening');
  startSilenceDetection(micStream);
}

function stopCurrentRecording() {
  if (silenceTimer) {
    clearTimeout(silenceTimer);
    silenceTimer = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  isRecording = false;
}

function startSilenceDetection(stream: MediaStream) {
  audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);

  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  let silenceStart: number | null = null;
  const SILENCE_THRESHOLD = 15;
  const SILENCE_DURATION = 1500; // 1.5 seconds

  function checkSilence() {
    if (!isRecording || !liveConversationActive) return;

    analyser.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length;

    if (average < SILENCE_THRESHOLD) {
      if (!silenceStart) silenceStart = Date.now();
      else if (Date.now() - silenceStart > SILENCE_DURATION) {
        stopCurrentRecording();
        return;
      }
    } else {
      silenceStart = null;
    }

    silenceTimer = window.setTimeout(checkSilence, 100);
  }

  // Wait before starting silence detection to avoid instant stop
  silenceTimer = window.setTimeout(checkSilence, 1000);
}

async function handleLiveSpeechInput(audioBlob: Blob) {
  if (!liveConversationActive) return;

  updateLiveStatus('processing');

  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const sttResponse = await fetch(`${API_BASE}/api/speech-to-text`, {
      method: 'POST',
      body: formData,
    });

    const sttData = await sttResponse.json();

    if (sttData.error) {
      addMessage('Systeem', `Spraakherkenning fout: ${sttData.error}`, 'system');
      if (liveConversationActive) startListeningCycle();
      return;
    }

    const transcript = sttData.transcript?.trim();
    if (!transcript) {
      // No speech detected — just resume listening
      if (liveConversationActive) startListeningCycle();
      return;
    }

    // Add transcript to chat
    addMessage('Jij (Student)', transcript, 'student');
    conversationHistory.push({ role: 'user', content: transcript });
    updateChatSessionMeta();

    // Show typing indicator
    addTypingIndicator(currentScenario?.persona.name || (isCollegaMode ? 'Collega' : 'Client'), 'patient');

    // Generate response
    const responseText = await generateResponseAndReturn();

    // Speak the response, then resume listening
    if (responseText && liveConversationActive) {
      updateLiveStatus('speaking');
      await speakResponse(responseText);
    }
  } catch (error) {
    addMessage('Systeem', 'Fout bij spraakverwerking.', 'system');
  }

  // Resume listening for next turn
  if (liveConversationActive) {
    startListeningCycle();
  }
}

async function speakResponse(text: string) {
  try {
    const response = await fetch(`${API_BASE}/api/text-to-speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      console.error('TTS error:', await response.text());
      return;
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    await new Promise<void>((resolve) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      audio.play();
    });
  } catch (error) {
    console.error('TTS playback error:', error);
  }
}

initUI()





