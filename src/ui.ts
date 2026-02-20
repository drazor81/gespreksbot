import { state } from './state';
import {
  SETTINGS_OPTIONS,
  LEERDOEL_GROUPS,
  RECOMMENDED_MIN_TURNS,
  TARGET_TURNS,
  DASHBOARD_STORAGE_KEY,
  scenarios
} from './config';
import { getKorteUitleg, getKennisVoorLeerdoelen, getTheorieVoorStudent } from './knowledge';
import type { DashboardSession, ScoreStats } from './types';
import {
  startScenarioFromSettings,
  startScenario,
  handleSendMessage,
  getHint,
  endConversation,
  showFeedback,
  copyFeedback,
  printFeedback
} from './chat';
import { startLiveConversation, stopLiveConversation } from './speech';
import { openVoiceOverlay, isWebSpeechSupported } from './voice';

const app = document.querySelector<HTMLDivElement>('#app')!;

function showModal(id: string): void {
  const modal = document.querySelector(`#${id}`) as HTMLDivElement | null;
  if (modal) modal.style.display = 'flex';
}

function hideModal(id: string): void {
  const modal = document.querySelector(`#${id}`) as HTMLDivElement | null;
  if (modal) modal.style.display = 'none';
}

function wireModalCloseOnOverlayClick(modalId: string): void {
  document.querySelector(`#${modalId}`)?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).id === modalId) hideModal(modalId);
  });
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function setInlineError(id: string, message: string): void {
  const el = document.querySelector(`#${id}`) as HTMLElement | null;
  if (!el) return;
  el.textContent = message;
}

export function clearInlineError(id: string): void {
  setInlineError(id, '');
}

export function showToast(message: string, variant: 'info' | 'success' | 'error' = 'info'): void {
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

export function addTypingIndicator(sender: string, type: 'patient' | 'system' | 'meta' = 'patient'): void {
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

export function removeTypingIndicators(): void {
  document.querySelectorAll('[data-typing="true"]').forEach((el) => el.remove());
}

export function addMessage(sender: string, text: string, type: 'student' | 'patient' | 'system' | 'meta'): void {
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

export function getFeedbackScores(text: string): ScoreStats | null {
  const scoresMatch = text.match(/<!--SCORES\n([\s\S]*?)SCORES-->/);
  if (!scoresMatch) return null;

  const stats: ScoreStats = { goed: 0, voldoende: 0, onvoldoende: 0 };
  const lines = scoresMatch[1]
    .trim()
    .split('\n')
    .filter((l) => l.includes('|'));
  const dataLines = lines.filter((l) => !l.startsWith('leerdoel|'));

  for (const line of dataLines) {
    const parts = line.split('|').map((s) => s.trim());
    if (parts.length < 3) continue;
    const score = parts[2].toLowerCase();
    if (score === 'goed') stats.goed += 1;
    if (score === 'voldoende') stats.voldoende += 1;
    if (score === 'onvoldoende') stats.onvoldoende += 1;
  }
  return stats.goed + stats.voldoende + stats.onvoldoende > 0 ? stats : null;
}

export function formatFeedback(text: string): string {
  let scoreHtml = '';
  const scoresMatch = text.match(/<!--SCORES\n([\s\S]*?)SCORES-->/);
  if (scoresMatch) {
    const lines = scoresMatch[1]
      .trim()
      .split('\n')
      .filter((l) => l.includes('|'));
    const dataLines = lines.filter((l) => !l.startsWith('leerdoel|'));
    const grouped: Record<string, { criterium: string; score: string }[]> = {};
    for (const line of dataLines) {
      const [leerdoel, criterium, score] = line.split('|').map((s) => s.trim());
      if (!leerdoel || !criterium || !score) continue;
      if (!grouped[leerdoel]) grouped[leerdoel] = [];
      grouped[leerdoel].push({ criterium, score });
    }

    if (Object.keys(grouped).length > 0) {
      scoreHtml = '<div class="score-table-container">';
      for (const [leerdoel, criteria] of Object.entries(grouped)) {
        scoreHtml += `<div class="score-leerdoel-label">${leerdoel}</div>`;
        for (const { criterium, score } of criteria) {
          const scoreClass =
            score === 'goed' ? 'score-goed' : score === 'voldoende' ? 'score-voldoende' : 'score-onvoldoende';
          scoreHtml += `<div class="score-row"><span class="score-dot ${scoreClass}"></span><span class="score-criterium">${criterium}</span><span class="score-label ${scoreClass}">${score}</span></div>`;
        }
      }
      scoreHtml += '</div>';
    }

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

export function loadDashboardSessions(): DashboardSession[] {
  try {
    const raw = localStorage.getItem(DASHBOARD_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DashboardSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(DASHBOARD_STORAGE_KEY);
    return [];
  }
}

export function saveDashboardSessions(sessions: DashboardSession[]): void {
  localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(sessions.slice(0, 120)));
}

export function saveCurrentSessionToDashboard(): void {
  if (state.dashboardSavedForConversation) return;
  if (!state.conversationStartedAt) return;
  const session: DashboardSession = {
    id: `${Date.now()}`,
    dateIso: new Date().toISOString(),
    studentName: (document.querySelector('#student-name-input') as HTMLInputElement | null)?.value.trim() || 'Onbekend',
    setting: state.selectedSettings.setting,
    scenario: getScenarioLabelForUi(),
    leerdoelen: [...state.selectedSettings.leerdoelen],
    niveau: state.selectedSettings.moeilijkheid,
    turns: getStudentTurnCount(),
    scores: state.latestFeedbackScores
  };

  const sessions = loadDashboardSessions();
  sessions.unshift(session);
  saveDashboardSessions(sessions);
  state.dashboardSavedForConversation = true;
}

export function renderDashboard(): void {
  const content = document.querySelector('#dashboard-content') as HTMLDivElement | null;
  if (!content) return;

  const sessions = loadDashboardSessions();
  if (sessions.length === 0) {
    content.innerHTML = '<p class="dashboard-empty">Nog geen sessies opgeslagen.</p>';
    return;
  }

  const uniqueStudents = new Set(sessions.map((s) => s.studentName).filter(Boolean)).size;
  const avgTurns = Math.round(sessions.reduce((sum, s) => sum + s.turns, 0) / sessions.length);
  const scoreTotals = sessions.reduce(
    (acc, s) => {
      if (s.scores) {
        acc.goed += s.scores.goed;
        acc.voldoende += s.scores.voldoende;
        acc.onvoldoende += s.scores.onvoldoende;
      }
      return acc;
    },
    { goed: 0, voldoende: 0, onvoldoende: 0 }
  );

  const rows = sessions
    .slice(0, 20)
    .map((s) => {
      const date = new Date(s.dateIso).toLocaleDateString('nl-NL');
      const scoreSummary = s.scores ? `G:${s.scores.goed} V:${s.scores.voldoende} O:${s.scores.onvoldoende}` : '-';
      return `<tr>
      <td>${escapeHtml(date)}</td>
      <td>${escapeHtml(s.studentName)}</td>
      <td>${escapeHtml(s.scenario)}</td>
      <td>${escapeHtml(String(s.turns))}</td>
      <td>${escapeHtml(scoreSummary)}</td>
    </tr>`;
    })
    .join('');

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

function buildLeerdoelSelectionHtml(): string {
  return LEERDOEL_GROUPS.map(
    (group) => `
    <div class="leerdoel-group">
      <div class="leerdoel-group-title">${group.title}</div>
      <div class="leerdoel-chips">
        ${group.items
        .map(
          (leerdoel) => `
          <label class="leerdoel-chip">
            <input type="checkbox" name="leerdoel" value="${leerdoel}" ${leerdoel === 'LSD' ? 'checked' : ''}>
            <span class="leerdoel-chip-name">${leerdoel}</span>
            <span class="leerdoel-chip-desc">${getKorteUitleg(leerdoel)}</span>
          </label>
        `
        )
        .join('')}
      </div>
    </div>
  `
  ).join('');
}

export function setAppMode(mode: 'setup' | 'chat' | 'feedback'): void {
  app.classList.remove('setup-mode', 'chat-mode', 'feedback-mode');
  app.classList.add(`${mode}-mode`);
}

export function animateScreenEntry(selector: string): void {
  const element = document.querySelector(selector) as HTMLElement | null;
  if (!element) return;
  element.classList.remove('screen-enter');
  void element.offsetWidth;
  element.classList.add('screen-enter');
}

export function setFeedbackTab(tab: 'gesprek' | 'feedback'): void {
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

export function setChecklistPanelVisibility(visible: boolean): void {
  const panel = document.querySelector('#checklist-panel') as HTMLDivElement | null;
  const checklistBtn = document.querySelector('#checklist-btn') as HTMLButtonElement | null;
  if (!panel || !checklistBtn) return;

  panel.style.display = visible ? 'block' : 'none';
  panel.setAttribute('aria-hidden', String(!visible));
  checklistBtn.setAttribute('aria-expanded', String(visible));
}

export function getScenarioLabelForUi(): string {
  if (state.currentScenario && state.currentScenario.id !== 'dynamic') {
    return state.currentScenario.name;
  }
  if (state.selectedSettings.scenarioType === 'Eigen scenario' && state.selectedSettings.customScenario.trim()) {
    return state.selectedSettings.customScenario.trim();
  }
  return state.selectedSettings.scenarioType;
}

export function getStudentTurnCount(): number {
  return state.conversationHistory.filter((msg) => msg.role === 'user').length;
}

export function updateConversationActionButtons(): void {
  const endButton = document.querySelector('#end-conversation-btn') as HTMLButtonElement | null;
  const feedbackButton = document.querySelector('#feedback-btn') as HTMLButtonElement | null;
  if (!endButton || !feedbackButton) return;

  const turns = getStudentTurnCount();
  if (state.conversationClosed) {
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

export function updateChatSessionMeta(): void {
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
    state.selectedSettings.setting || 'Setting onbekend',
    state.selectedSettings.leerdoelen.length > 0 ? state.selectedSettings.leerdoelen.join(' + ') : 'Geen leerdoelen',
    state.selectedSettings.moeilijkheid || 'Niveau onbekend'
  ];
  contextItems.forEach((item) => {
    const chip = document.createElement('span');
    chip.className = 'chat-context-chip';
    chip.textContent = item;
    contextBar.appendChild(chip);
  });

  const turns = getStudentTurnCount();
  let turnMessage = `Beurt ${turns} van ~${TARGET_TURNS}.`;
  if (turns < 4) {
    turnMessage += ' Probeer minimaal 6 beurten.';
  } else if (state.conversationClosed) {
    turnMessage += ' Gesprek is afgerond.';
  } else if (turns >= RECOMMENDED_MIN_TURNS) {
    turnMessage += ' Je kunt nu het gesprek afronden of doorgaan.';
  }
  turnStatus.textContent = turnMessage;
  updateConversationActionButtons();
}

export function getFormattedDateTime(date: Date): string {
  return date.toLocaleString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function renderFeedbackExportSummary(): void {
  const summary = document.querySelector('#feedback-export-summary') as HTMLDivElement | null;
  if (!summary) return;

  const studentInput = document.querySelector('#student-name-input') as HTMLInputElement | null;
  const studentName = studentInput?.value.trim() || 'Niet ingevuld';
  const startedAt = state.conversationStartedAt ?? new Date();
  const scenarioLabel = getScenarioLabelForUi();
  const goals =
    state.selectedSettings.leerdoelen.length > 0 ? state.selectedSettings.leerdoelen.join(', ') : 'Geen leerdoelen';

  summary.innerHTML = `
    <div class="feedback-meta-item"><strong>Datum:</strong> ${escapeHtml(getFormattedDateTime(startedAt))}</div>
    <div class="feedback-meta-item"><strong>Student:</strong> ${escapeHtml(studentName)}</div>
    <div class="feedback-meta-item"><strong>Setting:</strong> ${escapeHtml(state.selectedSettings.setting)}</div>
    <div class="feedback-meta-item"><strong>Scenario:</strong> ${escapeHtml(scenarioLabel)}</div>
    <div class="feedback-meta-item"><strong>Leerdoelen:</strong> ${escapeHtml(goals)}</div>
    <div class="feedback-meta-item"><strong>Niveau:</strong> ${escapeHtml(state.selectedSettings.moeilijkheid)}</div>
  `;
}

export function populateChecklist(): void {
  const body = document.querySelector('#checklist-body') as HTMLDivElement;
  if (!body) return;
  const kennis = getKennisVoorLeerdoelen(state.selectedSettings.leerdoelen);
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

export function showTheory(): void {
  const theorie = getTheorieVoorStudent(state.selectedSettings.leerdoelen);
  const content = document.querySelector('#theory-content') as HTMLDivElement;

  const htmlContent = theorie
    .replace(/## (.*)/g, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n- /g, '<br>• ')
    .replace(/\n\n---\n\n/g, '<hr>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');

  const sanitized = htmlContent
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  content.innerHTML = sanitized;
  showModal('theory-modal');
}

export function closeTheory(): void {
  hideModal('theory-modal');
}

export function showConfirmDialog(message: string): Promise<boolean> {
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

  return new Promise((resolve) => {
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

export function prepareChat() {
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

export function updateStartButtonState(): void {
  const MAX_LEERDOELEN = 2;
  const startBtn = document.querySelector('#start-btn') as HTMLButtonElement;
  const countEl = document.querySelector('#leerdoel-count') as HTMLSpanElement | null;
  const checked = document.querySelectorAll('input[name="leerdoel"]:checked');
  const allCheckboxes = document.querySelectorAll('input[name="leerdoel"]');

  allCheckboxes.forEach((cb) => {
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

export function updateSettings(): void {
  const settingEl = document.querySelector('#setting-select') as HTMLSelectElement;
  const scenarioTypeEl = document.querySelector('#scenario-type-select') as HTMLSelectElement;
  const moeilijkheidEl = document.querySelector('#moeilijkheid-select') as HTMLSelectElement;
  const archetypeEl = document.querySelector('#archetype-select') as HTMLSelectElement;
  const customScenarioEl = document.querySelector('#custom-scenario-input') as HTMLTextAreaElement;
  const customArchetypeEl = document.querySelector('#custom-archetype-input') as HTMLInputElement;

  if (settingEl) state.selectedSettings.setting = settingEl.value;
  if (scenarioTypeEl) state.selectedSettings.scenarioType = scenarioTypeEl.value;
  if (moeilijkheidEl) state.selectedSettings.moeilijkheid = moeilijkheidEl.value;
  if (archetypeEl) state.selectedSettings.archetype = archetypeEl.value;
  if (customScenarioEl) state.selectedSettings.customScenario = customScenarioEl.value;
  if (customArchetypeEl) state.selectedSettings.customArchetype = customArchetypeEl.value;

  const checkboxes = document.querySelectorAll('input[name="leerdoel"]:checked');
  state.selectedSettings.leerdoelen = Array.from(checkboxes).map((cb) => (cb as HTMLInputElement).value);
}

export function initUI(): void {
  app.innerHTML = `
    <header>
      <h1>ZorgGesprek+</h1>
      <p class="header-tagline">De gesprekstrainer voor MBO-zorgstudenten</p>
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
          <select id="setting-select">${SETTINGS_OPTIONS.setting.map((s) => `<option value="${s}">${s}</option>`).join('')}</select>
        </div>
        <div class="setting-group">
          <label>Scenario:</label>
          <select id="scenario-type-select">${SETTINGS_OPTIONS.scenarioType.map((s) => `<option value="${s.value}">${s.label}</option>`).join('')}</select>
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
          <select id="moeilijkheid-select">${SETTINGS_OPTIONS.moeilijkheid.map((m) => `<option value="${m}" ${m === 'Gemiddeld' ? 'selected' : ''}>${m}</option>`).join('')}</select>
        </div>
        <div class="setting-group" id="archetype-group">
          <label>Client type:</label>
          <select id="archetype-select">${SETTINGS_OPTIONS.clientArchetype.map((a) => `<option value="${a}">${a}</option>`).join('')}</select>
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
          ${scenarios.map((s) => `<option value="${s.id}">${s.name}</option>`).join('')}
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
  `;

  // --- Event listeners ---

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

  document.querySelector('#help-btn')?.addEventListener('click', () => showModal('help-modal'));
  document.querySelector('#close-help-btn')?.addEventListener('click', () => hideModal('help-modal'));
  wireModalCloseOnOverlayClick('help-modal');

  document.querySelector('#scenario-type-select')?.addEventListener('change', (e) => {
    const value = (e.target as HTMLSelectElement).value;
    const customGroup = document.querySelector('#custom-scenario-group') as HTMLDivElement;
    const archetypeGroup = document.querySelector('#archetype-group') as HTMLDivElement;
    const prefillMessage = document.querySelector('#scenario-prefill-message') as HTMLParagraphElement | null;

    if (customGroup) customGroup.style.display = value === 'Eigen scenario' ? 'flex' : 'none';
    if (archetypeGroup) archetypeGroup.style.display = value === 'Eigen scenario' ? 'none' : 'flex';
    if (prefillMessage) prefillMessage.textContent = '';
  });

  document.querySelector('#archetype-select')?.addEventListener('change', (e) => {
    const value = (e.target as HTMLSelectElement).value;
    const customArchetypeGroup = document.querySelector('#custom-archetype-group') as HTMLDivElement;
    if (customArchetypeGroup) customArchetypeGroup.style.display = value === 'Eigen type' ? 'flex' : 'none';
  });

  const scenarioSelect = document.querySelector('#predefined-scenario-select') as HTMLSelectElement;
  const descriptionBox = document.querySelector('#selected-scenario-description') as HTMLDivElement;
  const startScenarioBtn = document.querySelector('#start-predefined-btn') as HTMLButtonElement;

  scenarioSelect?.addEventListener('change', (e) => {
    const id = (e.target as HTMLSelectElement).value;
    const scenario = scenarios.find((s) => s.id === id);
    if (!scenario) return;

    descriptionBox.style.display = 'block';
    descriptionBox.innerHTML = '';
    const nameEl = document.createElement('strong');
    nameEl.textContent = scenario.name;
    const descEl = document.createElement('span');
    descEl.textContent = scenario.description;
    descriptionBox.appendChild(nameEl);
    descriptionBox.appendChild(descEl);
    startScenarioBtn.style.display = 'block';

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
      checkboxes.forEach((cb) => {
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

  document.querySelector('#hint-btn')?.addEventListener('click', getHint);
  document.querySelector('#theory-btn')?.addEventListener('click', showTheory);
  document.querySelector('#close-theory-btn')?.addEventListener('click', closeTheory);
  wireModalCloseOnOverlayClick('theory-modal');

  document.querySelector('#end-conversation-btn')?.addEventListener('click', endConversation);
  document.querySelector('#feedback-btn')?.addEventListener('click', showFeedback);
  document.querySelector('#copy-feedback-btn')?.addEventListener('click', copyFeedback);
  document.querySelector('#export-feedback-btn')?.addEventListener('click', printFeedback);

  document.querySelector('#dashboard-btn')?.addEventListener('click', () => {
    renderDashboard();
    showModal('dashboard-modal');
  });
  document.querySelector('#close-dashboard-btn')?.addEventListener('click', () => hideModal('dashboard-modal'));
  wireModalCloseOnOverlayClick('dashboard-modal');

  document.querySelector('#feedback-tab-gesprek')?.addEventListener('click', () => setFeedbackTab('gesprek'));
  document.querySelector('#feedback-tab-feedback')?.addEventListener('click', () => setFeedbackTab('feedback'));
  document.querySelector('#student-name-input')?.addEventListener('input', renderFeedbackExportSummary);
  document.querySelector('#new-conversation-btn')?.addEventListener('click', () => {
    location.reload();
  });

  document.querySelector('#reset-btn')?.addEventListener('click', async () => {
    const shouldReset =
      state.conversationHistory.length === 0 ||
      (await showConfirmDialog('Weet je zeker dat je het gesprek wilt afsluiten? Je voortgang gaat verloren.'));
    if (shouldReset) location.reload();
  });

  document.querySelector('#speech-toggle-input')?.addEventListener('change', (e) => {
    const toggle = e.target as HTMLInputElement;
    state.speechMode = toggle.checked;
    toggle.setAttribute('aria-checked', String(state.speechMode));

    if (state.speechMode && isWebSpeechSupported()) {
      // Use new voice overlay for browsers with Web Speech API
      toggle.checked = false;
      state.speechMode = false;
      toggle.setAttribute('aria-checked', 'false');
      openVoiceOverlay();
      return;
    }

    // Fallback to old speech input for unsupported browsers
    const inputForm = document.querySelector('#input-form') as HTMLElement;
    const speechInput = document.querySelector('#speech-input') as HTMLElement;
    if (state.speechMode) {
      inputForm.style.display = 'none';
      speechInput.style.display = 'flex';
    } else {
      inputForm.style.display = 'flex';
      speechInput.style.display = 'none';
      if (state.liveConversationActive) stopLiveConversation();
    }
  });

  document.querySelector('#live-conv-btn')?.addEventListener('click', () => {
    if (state.liveConversationActive) {
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
    const currentLeerdoelen = Array.from(checkboxes).map((cb) => (cb as HTMLInputElement).value);
    if (currentLeerdoelen.length === 0) {
      setInlineError('setup-theory-error', 'Selecteer eerst minimaal 1 leerdoel om theorie te bekijken.');
      return;
    }
    clearInlineError('setup-theory-error');
    const previousLeerdoelen = state.selectedSettings.leerdoelen;
    state.selectedSettings.leerdoelen = currentLeerdoelen;
    showTheory();
    state.selectedSettings.leerdoelen = previousLeerdoelen;
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
