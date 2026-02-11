import { state } from './state';
import {
  COLLEGA_ROLLEN,
  MOEILIJKHEID_BESCHRIJVING,
  MOEILIJKHEID_COLLEGA,
  RECOMMENDED_MIN_TURNS,
  getCollegaContext,
  getArchetypeBeschrijving,
  getRandomName,
  scenarios
} from './config';
import { sendChatMessage } from './api';
import {
  addMessage,
  addTypingIndicator,
  removeTypingIndicators,
  prepareChat,
  updateChatSessionMeta,
  showToast,
  setAppMode,
  animateScreenEntry,
  setFeedbackTab,
  renderFeedbackExportSummary,
  formatFeedback,
  getFeedbackScores,
  saveCurrentSessionToDashboard,
  getStudentTurnCount,
  clearInlineError,
  updateStartButtonState,
  escapeHtml
} from './ui';
import { getClientInstructies, getCoachContext, getRubricContext, getKennisVoorLeerdoelen } from './knowledge';
import { stopLiveConversation } from './speech';

export async function startScenarioFromSettings() {
  const placeholderName = state.isCollegaMode ? 'De collega' : 'De cliënt';

  state.currentScenario = {
    id: 'dynamic',
    name: placeholderName,
    description: `Maatwerk scenario: ${state.selectedSettings.archetype} in ${state.selectedSettings.setting}`,
    persona: {
      name: placeholderName,
      age: 70,
      tone: 'Wisselend',
      situation: `Heeft vragen of zorgen over ${state.selectedSettings.scenarioType}.`,
      background: 'Onbekend',
      emotion: 'Wisselend'
    }
  };

  state.conversationHistory = [];
  state.selfAssessment = {};
  state.conversationStartedAt = new Date();
  state.conversationClosed = false;
  state.latestFeedbackScores = null;
  state.dashboardSavedForConversation = false;
  prepareChat();
  const scenarioLabel =
    state.selectedSettings.scenarioType === 'Eigen scenario'
      ? state.selectedSettings.customScenario.substring(0, 50) + '...'
      : state.selectedSettings.scenarioType;
  const rolLabel = state.isCollegaMode ? 'Collega' : 'Cliënt';
  addMessage('Systeem', `Gesprek gestart in ${state.selectedSettings.setting}. Scenario: ${scenarioLabel}`, 'system');
  addTypingIndicator(rolLabel, 'patient');

  updateChatSessionMeta();

  let scenarioDescription = '';
  let archetypeForPrompt = state.selectedSettings.archetype;

  if (state.selectedSettings.scenarioType === 'Eigen scenario' && state.selectedSettings.customScenario.trim()) {
    scenarioDescription = `EIGEN SCENARIO: ${state.selectedSettings.customScenario}. Leid zelf het juiste cliënttype af uit deze beschrijving.`;
    archetypeForPrompt = 'scenario-inferred';
  } else if (state.selectedSettings.scenarioType === 'Willekeurig') {
    scenarioDescription =
      'WILLEKEURIG: Bedenk zelf een passend en realistisch scenario voor deze setting en dit cliënttype.';
  } else {
    scenarioDescription = `Standaard scenario: ${state.selectedSettings.scenarioType}`;
  }

  const archetypeResult = getArchetypeBeschrijving(archetypeForPrompt, state.selectedSettings.customArchetype);
  state.currentArchetypeBeschrijving = archetypeResult.beschrijving;
  state.isCollegaMode = archetypeResult.isCollegaMode;

  let archetypeDescription = state.selectedSettings.archetype;
  if (archetypeForPrompt === 'scenario-inferred') {
    archetypeDescription = 'een cliënt passend bij het beschreven scenario';
  } else if (state.selectedSettings.archetype === 'Eigen type' && state.selectedSettings.customArchetype.trim()) {
    archetypeDescription = state.selectedSettings.customArchetype;
  } else if (state.selectedSettings.archetype === 'Willekeurig') {
    archetypeDescription = 'het cliënttype dat beschreven staat in je karakter-sectie';
  }

  const randomHint = getRandomName();

  let openingPrompt: string;
  if (state.isCollegaMode) {
    const collegaRol = COLLEGA_ROLLEN[state.selectedSettings.setting] || 'collega';
    openingPrompt = `Je bent ${randomHint}, een ${collegaRol} in ${state.selectedSettings.setting}.
${scenarioDescription}

Je naam is ${randomHint}. Begin je antwoord VERPLICHT met je naam in dit formaat: [NAAM: ${randomHint}]
Genereer daarna je EERSTE zin als collega. Je begint het gesprek — je verwacht informatie van de student (bijv. een overdracht, een telefonisch consult, of een overleg).
Gebruik *italics* voor non-verbaal gedrag. Houd het kort (1-2 zinnen).

Voorbeeld output:
[NAAM: ${randomHint}]
*Loopt snel de kamer binnen met een kop koffie* Hé, goedemorgen. Hoe is de nacht geweest? Zijn er bijzonderheden?`;
  } else {
    openingPrompt = `Je bent ${randomHint}, een ${archetypeDescription.toLowerCase()} in ${state.selectedSettings.setting}.
${scenarioDescription}

Je naam is ${randomHint}. Begin je antwoord VERPLICHT met je naam in dit formaat: [NAAM: ${randomHint}]
Genereer daarna je EERSTE zin als cliënt. Beschrijf kort je situatie en stemming passend bij de setting.
Gebruik *italics* voor non-verbaal gedrag. Houd het kort (1-2 zinnen).

Voorbeeld output:
[NAAM: ${randomHint}]
*Kijkt op vanuit de stoel* Goedemorgen... ben ik eindelijk aan de beurt?`;
  }

  try {
    if (!state.cachedSystemPrompt) {
      const promptModule = await import('./prompts/system-prompt');
      state.cachedSystemPrompt = promptModule.SYSTEM_PROMPT_MBO_V2;
    }
  } catch (error) {
    console.error('Failed to load system prompt:', error);
    addMessage('Systeem', 'Fout: Kon de systeem-prompt niet laden.', 'system');
    return;
  }

  const clientInstructies = getClientInstructies(state.selectedSettings.leerdoelen);

  if (state.currentRequestController) state.currentRequestController.abort();
  state.currentRequestController = new AbortController();

  try {
    const systemPrompt =
      state.cachedSystemPrompt
        .replace('{{SETTING}}', state.selectedSettings.setting)
        .replace('{{SCENARIO_TYPE}}', state.selectedSettings.scenarioType)
        .replace('{{LEERDOELEN}}', state.selectedSettings.leerdoelen.join(', '))
        .replace(
          '{{MOEILIJKHEID_BESCHRIJVING}}',
          state.isCollegaMode
            ? MOEILIJKHEID_COLLEGA[state.selectedSettings.moeilijkheid] || MOEILIJKHEID_COLLEGA['Gemiddeld']
            : MOEILIJKHEID_BESCHRIJVING[state.selectedSettings.moeilijkheid] || MOEILIJKHEID_BESCHRIJVING['Gemiddeld']
        )
        .replace('{{ARCHETYPE_BESCHRIJVING}}', state.currentArchetypeBeschrijving)
        .replace('{{PATIENT_NAME}}', placeholderName)
        .replace('{{ROLTYPE_CONTEXT}}', state.isCollegaMode ? getCollegaContext(state.selectedSettings.setting) : '') +
      clientInstructies;

    const data = await sendChatMessage(
      systemPrompt,
      [{ role: 'user', content: openingPrompt }],
      state.currentRequestController.signal
    );

    removeTypingIndicators();

    if (state.conversationClosed) return;

    if (data.error) {
      addMessage('Systeem', `Fout: ${data.error}`, 'system');
    } else if (data.response) {
      const nameMatch = data.response.match(/\[NAAM:\s*([^\]]+)\]/i);
      if (nameMatch) {
        const extractedName = nameMatch[1].trim();
        state.currentScenario!.name = extractedName;
        state.currentScenario!.persona.name = extractedName;
        const cleanResponse = data.response.replace(/\[NAAM:[^\]]+\]\s*/i, '').trim();
        state.conversationHistory.push({ role: 'assistant', content: cleanResponse });
        addMessage(extractedName, cleanResponse, 'patient');
      } else {
        state.conversationHistory.push({ role: 'assistant', content: data.response });
        addMessage(state.isCollegaMode ? 'Collega' : 'Client', data.response, 'patient');
      }
      updateChatSessionMeta();
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') return;
    removeTypingIndicators();
    addMessage(
      'Systeem',
      'Er is een probleem met de verbinding. Probeer het later opnieuw of neem contact op met je docent.',
      'system'
    );
  } finally {
    state.currentRequestController = null;
  }
}

export function startScenario(id: string) {
  const preset = scenarios.find((s) => s.id === id) || null;
  if (!preset) return;

  state.currentScenario = preset;

  state.selectedSettings.setting = preset.setting || state.selectedSettings.setting;
  state.selectedSettings.scenarioType = preset.scenarioType || state.selectedSettings.scenarioType;
  state.selectedSettings.archetype = preset.archetype || state.selectedSettings.archetype;
  state.selectedSettings.moeilijkheid = preset.moeilijkheid || state.selectedSettings.moeilijkheid;
  state.selectedSettings.customScenario = '';
  state.selectedSettings.customArchetype = '';
  if (preset.recommendedLeerdoelen && preset.recommendedLeerdoelen.length > 0) {
    state.selectedSettings.leerdoelen = preset.recommendedLeerdoelen.slice(0, 2);
  }

  const settingSelect = document.querySelector('#setting-select') as HTMLSelectElement | null;
  const scenarioTypeSelect = document.querySelector('#scenario-type-select') as HTMLSelectElement | null;
  const archetypeSelect = document.querySelector('#archetype-select') as HTMLSelectElement | null;
  const moeilijkheidSelect = document.querySelector('#moeilijkheid-select') as HTMLSelectElement | null;
  const customScenarioInput = document.querySelector('#custom-scenario-input') as HTMLTextAreaElement | null;
  const customArchetypeInput = document.querySelector('#custom-archetype-input') as HTMLInputElement | null;
  const checkboxes = document.querySelectorAll('input[name="leerdoel"]');
  const scenarioPrefillMessage = document.querySelector('#scenario-prefill-message') as HTMLParagraphElement | null;

  if (settingSelect) settingSelect.value = state.selectedSettings.setting;
  if (scenarioTypeSelect) scenarioTypeSelect.value = state.selectedSettings.scenarioType;
  if (archetypeSelect) archetypeSelect.value = state.selectedSettings.archetype;
  if (moeilijkheidSelect) moeilijkheidSelect.value = state.selectedSettings.moeilijkheid;
  if (customScenarioInput) customScenarioInput.value = '';
  if (customArchetypeInput) customArchetypeInput.value = '';

  checkboxes.forEach((cb) => {
    const input = cb as HTMLInputElement;
    input.checked = state.selectedSettings.leerdoelen.includes(input.value);
  });
  updateStartButtonState();

  const customGroup = document.querySelector('#custom-scenario-group') as HTMLDivElement | null;
  const archetypeGroup = document.querySelector('#archetype-group') as HTMLDivElement | null;
  const customArchetypeGroup = document.querySelector('#custom-archetype-group') as HTMLDivElement | null;
  if (customGroup)
    customGroup.style.display = state.selectedSettings.scenarioType === 'Eigen scenario' ? 'flex' : 'none';
  if (archetypeGroup)
    archetypeGroup.style.display = state.selectedSettings.scenarioType === 'Eigen scenario' ? 'none' : 'flex';
  if (customArchetypeGroup)
    customArchetypeGroup.style.display = state.selectedSettings.archetype === 'Eigen type' ? 'flex' : 'none';

  const scenarioSelect = document.querySelector('#predefined-scenario-select') as HTMLSelectElement | null;
  if (scenarioSelect && scenarioSelect.value !== id) {
    scenarioSelect.value = id;
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

export function handleSendMessage() {
  if (state.isWaitingForResponse) return;
  if (state.conversationClosed) return;
  const input = document.querySelector<HTMLInputElement>('#user-input')!;
  const text = input.value.trim();
  if (!text) return;

  state.isWaitingForResponse = true;
  const submitBtn = document.querySelector<HTMLButtonElement>('#input-form button[type="submit"]')!;
  input.disabled = true;
  submitBtn.disabled = true;

  addMessage('Jij (Student)', text, 'student');
  input.value = '';
  state.conversationHistory.push({ role: 'user', content: text });
  updateChatSessionMeta();
  addTypingIndicator(state.currentScenario?.persona.name || (state.isCollegaMode ? 'Collega' : 'Client'), 'patient');

  generateResponse().finally(() => {
    state.isWaitingForResponse = false;
    input.disabled = false;
    submitBtn.disabled = false;
    input.focus();
  });
}

export async function generateResponseAndReturn(): Promise<string | null> {
  if (!state.currentScenario) {
    state.currentScenario = scenarios[0];
  }

  const persona = state.currentScenario.persona;
  const clientInstructies = getClientInstructies(state.selectedSettings.leerdoelen);

  if (!state.cachedSystemPrompt) {
    try {
      const promptModule = await import('./prompts/system-prompt');
      state.cachedSystemPrompt = promptModule.SYSTEM_PROMPT_MBO_V2;
    } catch (error) {
      console.error('Failed to load system prompt:', error);
      addMessage('Systeem', 'Fout: Kon de systeem-prompt niet laden.', 'system');
      return null;
    }
  }

  const dynamicPrompt =
    state.cachedSystemPrompt
      .replace('{{SETTING}}', state.selectedSettings.setting)
      .replace('{{SCENARIO_TYPE}}', state.selectedSettings.scenarioType)
      .replace('{{LEERDOELEN}}', state.selectedSettings.leerdoelen.join(', '))
      .replace(
        '{{MOEILIJKHEID_BESCHRIJVING}}',
        state.isCollegaMode
          ? MOEILIJKHEID_COLLEGA[state.selectedSettings.moeilijkheid] || MOEILIJKHEID_COLLEGA['Gemiddeld']
          : MOEILIJKHEID_BESCHRIJVING[state.selectedSettings.moeilijkheid] || MOEILIJKHEID_BESCHRIJVING['Gemiddeld']
      )
      .replace('{{ARCHETYPE_BESCHRIJVING}}', state.currentArchetypeBeschrijving)
      .replace('{{PATIENT_NAME}}', persona.name)
      .replace('{{ROLTYPE_CONTEXT}}', state.isCollegaMode ? getCollegaContext(state.selectedSettings.setting) : '') +
    clientInstructies;

  if (state.currentRequestController) state.currentRequestController.abort();
  state.currentRequestController = new AbortController();

  try {
    const data = await sendChatMessage(dynamicPrompt, state.conversationHistory, state.currentRequestController.signal);

    removeTypingIndicators();

    if (state.conversationClosed) return null;

    if (data.error) {
      addMessage('Systeem', `Fout: ${data.error}`, 'system');
      return null;
    } else if (data.response) {
      state.conversationHistory.push({ role: 'assistant', content: data.response });
      addMessage(persona.name, data.response, 'patient');
      updateChatSessionMeta();
      return data.response;
    }
    return null;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') return null;
    removeTypingIndicators();
    addMessage(
      'Systeem',
      'Er is een probleem met de verbinding. Probeer het later opnieuw of neem contact op met je docent.',
      'system'
    );
    return null;
  } finally {
    state.currentRequestController = null;
  }
}

async function generateResponse() {
  await generateResponseAndReturn();
}

export async function getHint() {
  const hintBtn = document.querySelector('#hint-btn') as HTMLButtonElement;
  if (hintBtn) hintBtn.disabled = true;

  if (state.conversationClosed) {
    addMessage('Coach', 'Het gesprek is afgerond. Bekijk je feedback voor uitgebreide tips!', 'meta');
    if (hintBtn) hintBtn.disabled = false;
    return;
  }

  if (state.conversationHistory.length === 0) {
    addMessage('Coach', '💡 Begin eerst het gesprek met de cliënt, dan kan ik je tips geven!', 'meta');
    if (hintBtn) hintBtn.disabled = false;
    return;
  }

  addTypingIndicator('Coach', 'meta');

  const transcript = state.conversationHistory
    .map((msg) => {
      const speaker =
        msg.role === 'user'
          ? 'Student'
          : `${state.isCollegaMode ? 'Collega' : 'Cliënt'} (${state.currentScenario?.persona.name || (state.isCollegaMode ? 'de collega' : 'de cliënt')})`;
      return `${speaker}: ${msg.content}`;
    })
    .join('\n\n');

  const coachKennis = getCoachContext(state.selectedSettings.leerdoelen);

  const coachSystemPrompt = `Je bent een ervaren praktijkbegeleider die MBO-zorgstudenten coacht tijdens gespreksoefeningen. Je observeert het gesprek en geeft korte, behulpzame tips.

## Kennis over de gesprekstechnieken die de student oefent:

${coachKennis}`;

  const coachUserPrompt = `Hier is het gesprek tot nu toe tussen een student en een cliënt:

---
${transcript}
---

Context:
- Setting: ${state.selectedSettings.setting}
- De student oefent met: ${state.selectedSettings.leerdoelen.join(', ')}

Analyseer het gesprek op basis van je kennis over de gesprekstechnieken hierboven. Geef de student één korte tip (max 2 zinnen) om het gesprek te verbeteren. Wees bemoedigend en concreet. Beschrijf gewoon wat de student kan doen, niet welke techniek het is.`;

  try {
    const data = await sendChatMessage(coachSystemPrompt, [{ role: 'user', content: coachUserPrompt }]);

    removeTypingIndicators();

    if (data.error) {
      addMessage('Systeem', 'Kon geen tip genereren.', 'system');
    } else if (data.response) {
      addMessage('Coach', `💡 ${data.response}`, 'meta');
    }
  } catch {
    removeTypingIndicators();
    addMessage('Systeem', 'Kon geen verbinding maken met de coach. Probeer het opnieuw.', 'system');
  } finally {
    if (hintBtn) hintBtn.disabled = false;
  }
}

export async function endConversation() {
  if (state.isWaitingForResponse || state.conversationClosed) return;
  if (state.liveConversationActive) stopLiveConversation();

  if (getStudentTurnCount() < RECOMMENDED_MIN_TURNS) {
    addMessage('Systeem', `Probeer minimaal ${RECOMMENDED_MIN_TURNS} beurten voordat je afrondt.`, 'system');
    return;
  }

  const input = document.querySelector<HTMLInputElement>('#user-input');
  const submitBtn = document.querySelector<HTMLButtonElement>('#input-form button[type="submit"]');
  const endBtn = document.querySelector<HTMLButtonElement>('#end-conversation-btn');

  state.conversationClosed = true;

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

function buildSelfAssessmentForm(leerdoelen: string[]): string {
  const kennis = getKennisVoorLeerdoelen(leerdoelen);
  if (kennis.length === 0) return '';

  let html =
    '<div class="self-assessment"><h3>Hoe vond je zelf dat het ging?</h3><p class="sa-intro">Beoordeel jezelf voordat je de AI-feedback ziet.</p>';
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
  const entries = Object.entries(state.selfAssessment);
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
  const entries = Object.entries(state.selfAssessment);
  if (entries.length === 0) return 'De student heeft geen zelfbeoordeling ingevuld.';

  const labelMap: Record<string, string> = { goed: 'Dit ging goed', twijfel: 'Twijfel', beter: 'Dit kan beter' };
  return entries.map(([leerdoel, score]) => `- ${leerdoel}: ${labelMap[score] || score}`).join('\n');
}

async function generateAIFeedback() {
  const feedbackContent = document.querySelector('#feedback-content')!;
  const summaryHtml = buildSelfAssessmentSummary();
  feedbackContent.innerHTML = summaryHtml + '<p class="feedback-loading">Feedback wordt gegenereerd...</p>';

  const transcript = state.conversationHistory
    .map((msg) => {
      const speaker =
        msg.role === 'user'
          ? 'Student'
          : `${state.isCollegaMode ? 'Collega' : 'Cliënt'} (${state.currentScenario?.persona.name || (state.isCollegaMode ? 'de collega' : 'de cliënt')})`;
      return `${speaker}: ${msg.content}`;
    })
    .join('\n\n');

  const coachKennis = getCoachContext(state.selectedSettings.leerdoelen);
  const rubricKennis = getRubricContext(state.selectedSettings.leerdoelen);
  const selfAssessmentContext = buildSelfAssessmentContext();

  let feedbackPromptTemplate;
  try {
    const promptModule = await import('./prompts/feedback-prompt');
    feedbackPromptTemplate = promptModule.FEEDBACK_PROMPT;
  } catch (error) {
    console.error('Failed to load feedback prompt:', error);
    feedbackContent.innerHTML =
      summaryHtml + '<p class="feedback-error">Kon feedback-prompt niet laden. Probeer opnieuw.</p>';
    return;
  }

  const feedbackSystemPrompt = feedbackPromptTemplate
    .replace('{{LEERDOELEN}}', state.selectedSettings.leerdoelen.join(', '))
    .replace('{{COACH_KENNIS}}', coachKennis)
    .replace('{{RUBRIC}}', rubricKennis)
    .replace('{{SELF_ASSESSMENT}}', selfAssessmentContext);

  const feedbackUserPrompt = `Hier is het volledige gesprek tussen de student en de cliënt:

---
${transcript}
---

Context:
- Setting: ${state.selectedSettings.setting}
- Scenario: ${state.selectedSettings.scenarioType}
- Cliënttype: ${state.selectedSettings.archetype}
- Niveau: ${state.selectedSettings.moeilijkheid}
- Leerdoelen: ${state.selectedSettings.leerdoelen.join(', ')}
- Aantal beurten: ${state.conversationHistory.length}

Geef nu je feedback volgens de voorgeschreven structuur.`;

  try {
    const data = await sendChatMessage(feedbackSystemPrompt, [{ role: 'user', content: feedbackUserPrompt }]);

    if (data.error) {
      feedbackContent.innerHTML =
        summaryHtml + `<p class="feedback-error">Kon geen feedback genereren: ${escapeHtml(data.error)}</p>`;
    } else if (data.response) {
      state.latestFeedbackScores = getFeedbackScores(data.response);
      feedbackContent.innerHTML = summaryHtml + formatFeedback(data.response);
      const copyBtn = document.querySelector('#copy-feedback-btn') as HTMLButtonElement;
      if (copyBtn) copyBtn.style.display = 'inline-flex';
      saveCurrentSessionToDashboard();
      showToast('Feedback is gereed en opgeslagen in het dashboard.', 'success');
    }
  } catch {
    feedbackContent.innerHTML = summaryHtml + '<p class="feedback-error">Kon geen verbinding maken met de server.</p>';
  }
}

export async function showFeedback() {
  if (!state.conversationClosed) {
    addMessage('Systeem', 'Rond eerst het gesprek af met de knop "Rond gesprek af".', 'system');
    return;
  }

  if (state.conversationHistory.length < 2) {
    addMessage('Systeem', 'Voer eerst een gesprek voordat je feedback vraagt.', 'system');
    return;
  }

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

  const gesprekContent = document.querySelector('#feedback-gesprek-content')!;
  const chatContainer = document.querySelector('#chat-container')!;
  gesprekContent.innerHTML = chatContainer.innerHTML;

  const copyBtn = document.querySelector('#copy-feedback-btn') as HTMLButtonElement | null;
  if (copyBtn) copyBtn.style.display = 'none';

  const feedbackContent = document.querySelector('#feedback-content')!;
  const saForm = buildSelfAssessmentForm(state.selectedSettings.leerdoelen);

  if (saForm) {
    feedbackContent.innerHTML = saForm;

    document.querySelector('#sa-submit-btn')?.addEventListener('click', () => {
      state.selfAssessment = {};
      const kennis = getKennisVoorLeerdoelen(state.selectedSettings.leerdoelen);
      let allAnswered = true;
      for (const k of kennis) {
        const selected = document.querySelector(`input[name="sa-${k.id}"]:checked`) as HTMLInputElement;
        if (selected) {
          state.selfAssessment[k.naam] = selected.value;
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
    state.selfAssessment = {};
    generateAIFeedback();
  }
}

export function copyFeedback() {
  const el = document.querySelector('#feedback-content');
  if (!el) return;
  navigator.clipboard.writeText((el as HTMLElement).innerText).then(() => {
    const btn = document.querySelector('#copy-feedback-btn') as HTMLButtonElement;
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = 'Gekopieerd';
      setTimeout(() => {
        btn.textContent = orig;
      }, 2000);
    }
    showToast('Feedback gekopieerd naar klembord.', 'success');
  });
}

export function printFeedback() {
  renderFeedbackExportSummary();
  window.print();
}
