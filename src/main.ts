import './style.css'
import personasData from '../personas.json'
import { SYSTEM_PROMPT_MBO_V2 } from './prompts/system-prompt'

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
      <button type="button" id="hint-btn" title="Vraag een tip">💡</button>
      <button type="submit">Verstuur</button>
    </form>
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

  document.querySelector('#reset-btn')?.addEventListener('click', () => {
    location.reload();
  });

  // Update start button state based on checkbox selection
  const checkboxGroup = document.querySelector('.checkbox-group');
  checkboxGroup?.addEventListener('change', updateStartButtonState);
  updateStartButtonState(); // Initial state
}

function updateStartButtonState() {
  const startBtn = document.querySelector('#start-btn') as HTMLButtonElement;
  const checkboxes = document.querySelectorAll('input[name="leerdoel"]:checked');

  if (startBtn) {
    if (checkboxes.length === 0) {
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
  let archetypeDescription = selectedSettings.archetype;

  if (selectedSettings.scenarioType === 'Eigen scenario' && selectedSettings.customScenario.trim()) {
    scenarioDescription = `EIGEN SCENARIO: ${selectedSettings.customScenario}. Leid zelf het juiste cliënttype af uit deze beschrijving.`;
    archetypeDescription = 'een cliënt passend bij het beschreven scenario';
  } else if (selectedSettings.scenarioType === 'Willekeurig') {
    scenarioDescription = 'WILLEKEURIG: Bedenk zelf een passend en realistisch scenario voor deze setting en dit cliënttype.';
  } else {
    scenarioDescription = `Standaard scenario: ${selectedSettings.scenarioType}`;
  }

  // Handle random archetype (only if not custom scenario)
  if (selectedSettings.archetype === 'Willekeurig' && selectedSettings.scenarioType !== 'Eigen scenario') {
    archetypeDescription = 'een willekeurig gekozen cliënttype (kies zelf uit: verwarde oudere, boze cliënt, angstige cliënt, of zorgmijdende cliënt)';
  } else if (selectedSettings.archetype === 'Eigen type' && selectedSettings.customArchetype.trim()) {
    archetypeDescription = selectedSettings.customArchetype;
  }

  const titles = ["Mevrouw", "Meneer"];
  const lastNames = ["Jansen", "de Vries", "van den Berg", "Smit", "de Jong", "Visser", "Mulder", "Bakhuizen", "Hendriks", "Postma", "Dijkstra", "Vermeulen", "Willems", "Kramer", "de Wit", "Luiten", "Groot", "Schouten", "Prins", "Vos", "Meijer"];
  const randomHint = `${titles[Math.floor(Math.random() * titles.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;

  const openingPrompt = `Je bent een ${archetypeDescription.toLowerCase()} in ${selectedSettings.setting}.
${scenarioDescription}

Bedenk een realistische naam voor jezelf (bijv. ${randomHint}, maar kies gerust een andere) en begin je antwoord VERPLICHT met je naam in dit formaat: [NAAM: Mevrouw/Meneer Achternaam]
Genereer daarna je EERSTE zin als cliënt. Beschrijf kort je situatie en stemming passend bij de setting.
Gebruik *italics* voor non-verbaal gedrag. Houd het kort (1-2 zinnen).

Voorbeeld output:
[NAAM: Mevrouw van Dam]
*Kijkt op vanuit de stoel* Goedemorgen... ben ik eindelijk aan de beurt?`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt: SYSTEM_PROMPT_MBO
          .replace('{{SETTING}}', selectedSettings.setting)
          .replace('{{SCENARIO_TYPE}}', selectedSettings.scenarioType)
          .replace('{{LEERDOELEN}}', selectedSettings.leerdoelen.join(', '))
          .replace('{{MOEILIJKHEID}}', selectedSettings.moeilijkheid)
          .replace('{{ARCHETYPE}}', selectedSettings.archetype)
          .replace('{{PATIENT_NAME}}', placeholderName),
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

  const coachSystemPrompt = `Je bent een ervaren praktijkbegeleider die MBO-zorgstudenten coacht tijdens gespreksoefeningen. Je observeert het gesprek en geeft korte, behulpzame tips.`;

  const coachUserPrompt = `Hier is het gesprek tot nu toe tussen een student en een cliënt:

---
${transcript}
---

Context:
- Setting: ${selectedSettings.setting}
- De student oefent met: ${selectedSettings.leerdoelen.join(', ')}

Geef de student één korte tip (max 2 zinnen) om het gesprek te verbeteren. Wees bemoedigend en concreet. Gebruik geen vakjargon zoals "LSD" of "NIVEA" - beschrijf gewoon wat de student kan doen.`;

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

  // Build dynamic system prompt
  const dynamicPrompt = SYSTEM_PROMPT_MBO
    .replace('{{SETTING}}', selectedSettings.setting)
    .replace('{{SCENARIO_TYPE}}', selectedSettings.scenarioType)
    .replace('{{LEERDOELEN}}', selectedSettings.leerdoelen.join(', '))
    .replace('{{MOEILIJKHEID}}', selectedSettings.moeilijkheid)
    .replace('{{ARCHETYPE}}', selectedSettings.archetype)
    .replace('{{PATIENT_NAME}}', persona.name);

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
