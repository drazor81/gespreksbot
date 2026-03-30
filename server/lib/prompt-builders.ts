import {
  COLLEGA_ROLLEN,
  MOEILIJKHEID_BESCHRIJVING,
  MOEILIJKHEID_COLLEGA,
  getArchetypeBeschrijving,
  getCollegaContext,
  getRandomName
} from '../../src/config';
import { getClientInstructies, getCoachContext, getRubricContext } from '../../src/knowledge/index';
import type { SelectedSettings } from '../../src/types';
import { FEEDBACK_PROMPT } from '../prompts/feedback-prompt';
import { SYSTEM_PROMPT_MBO_V2 } from '../prompts/system-prompt';
import type { SessionState } from './session-state';

export interface PromptMessage {
  role: 'user' | 'assistant';
  content: string;
}

function describeScenario(settings: SelectedSettings): { scenarioDescription: string; archetypeForPrompt: string } {
  if (settings.scenarioType === 'Eigen scenario' && settings.customScenario.trim()) {
    return {
      scenarioDescription: `EIGEN SCENARIO: ${settings.customScenario}. Leid zelf het juiste cliënttype af uit deze beschrijving.`,
      archetypeForPrompt: 'scenario-inferred'
    };
  }

  if (settings.scenarioType === 'Willekeurig') {
    return {
      scenarioDescription: 'WILLEKEURIG: Bedenk zelf een passend en realistisch scenario voor deze setting en dit cliënttype.',
      archetypeForPrompt: settings.archetype
    };
  }

  return {
    scenarioDescription: `Standaard scenario: ${settings.scenarioType}`,
    archetypeForPrompt: settings.archetype
  };
}

function describeArchetypeLabel(settings: SelectedSettings, archetypeForPrompt: string): string {
  if (archetypeForPrompt === 'scenario-inferred') {
    return 'een cliënt passend bij het beschreven scenario';
  }

  if (settings.archetype === 'Eigen type' && settings.customArchetype.trim()) {
    return settings.customArchetype;
  }

  if (settings.archetype === 'Willekeurig') {
    return 'het cliënttype dat beschreven staat in je karakter-sectie';
  }

  return settings.archetype;
}

function buildPersonaLabel(context: SessionState): string {
  return `${context.isCollegaMode ? 'Collega' : 'Cliënt'} (${context.personaName})`;
}

function buildTranscript(history: PromptMessage[], context: SessionState): string {
  return history
    .map((message) => {
      const speaker = message.role === 'user' ? 'Student' : buildPersonaLabel(context);
      return `${speaker}: ${message.content}`;
    })
    .join('\n\n');
}

function buildSelfAssessmentContext(selfAssessment?: Record<string, string>): string {
  const entries = Object.entries(selfAssessment ?? {});
  if (entries.length === 0) {
    return 'De student heeft geen zelfbeoordeling ingevuld.';
  }

  const labelMap: Record<string, string> = {
    goed: 'Dit ging goed',
    twijfel: 'Twijfel',
    beter: 'Dit kan beter'
  };

  return entries.map(([leerdoel, score]) => `- ${leerdoel}: ${labelMap[score] || score}`).join('\n');
}

export function createSessionContext(settings: SelectedSettings): SessionState {
  const { archetypeForPrompt } = describeScenario(settings);
  const archetypeResult = getArchetypeBeschrijving(archetypeForPrompt, settings.customArchetype);

  return {
    personaName: getRandomName(),
    currentArchetypeDescription: archetypeResult.beschrijving,
    isCollegaMode: archetypeResult.isCollegaMode,
    settings: { ...settings }
  };
}

export function buildPatientSystemPrompt(settings: SelectedSettings, context: SessionState): string {
  const clientInstructies = getClientInstructies(settings.leerdoelen);

  return (
    SYSTEM_PROMPT_MBO_V2.replace('{{SETTING}}', settings.setting)
      .replace('{{SCENARIO_TYPE}}', settings.scenarioType)
      .replace('{{LEERDOELEN}}', settings.leerdoelen.join(', '))
      .replace(
        '{{MOEILIJKHEID_BESCHRIJVING}}',
        context.isCollegaMode
          ? MOEILIJKHEID_COLLEGA[settings.moeilijkheid] || MOEILIJKHEID_COLLEGA.Gemiddeld
          : MOEILIJKHEID_BESCHRIJVING[settings.moeilijkheid] || MOEILIJKHEID_BESCHRIJVING.Gemiddeld
      )
      .replace('{{ARCHETYPE_BESCHRIJVING}}', context.currentArchetypeDescription)
      .replace('{{PATIENT_NAME}}', context.personaName)
      .replace('{{ROLTYPE_CONTEXT}}', context.isCollegaMode ? getCollegaContext(settings.setting) : '') + clientInstructies
  );
}

export function buildOpeningPrompt(settings: SelectedSettings, context: SessionState): string {
  const { scenarioDescription, archetypeForPrompt } = describeScenario(settings);
  const archetypeDescription = describeArchetypeLabel(settings, archetypeForPrompt);
  const personaName = context.personaName;

  if (context.isCollegaMode) {
    const collegaRol = COLLEGA_ROLLEN[settings.setting] || 'collega';
    return `Je bent ${personaName}, een ${collegaRol} in ${settings.setting}.
${scenarioDescription}

Je naam is ${personaName}. Begin je antwoord VERPLICHT met je naam in dit formaat: [NAAM: ${personaName}]
Genereer daarna je EERSTE zin als collega. Je begint het gesprek — je verwacht informatie van de student (bijv. een overdracht, een telefonisch consult, of een overleg).
Gebruik *italics* voor non-verbaal gedrag. Houd het kort (1-2 zinnen).

Voorbeeld output:
[NAAM: ${personaName}]
*Loopt snel de kamer binnen met een kop koffie* Hé, goedemorgen. Hoe is de nacht geweest? Zijn er bijzonderheden?`;
  }

  return `Je bent ${personaName}, een ${archetypeDescription.toLowerCase()} in ${settings.setting}.
${scenarioDescription}

Je naam is ${personaName}. Begin je antwoord VERPLICHT met je naam in dit formaat: [NAAM: ${personaName}]
Genereer daarna je EERSTE zin als cliënt. Beschrijf kort je situatie en stemming passend bij de setting.
Gebruik *italics* voor non-verbaal gedrag. Houd het kort (1-2 zinnen).

Voorbeeld output:
[NAAM: ${personaName}]
*Kijkt op vanuit de stoel* Goedemorgen... ben ik eindelijk aan de beurt?`;
}

export function buildCoachPayload(settings: SelectedSettings, history: PromptMessage[], context: SessionState) {
  const transcript = buildTranscript(history, context);
  const coachKennis = getCoachContext(settings.leerdoelen);

  return {
    systemPrompt: `Je bent een ervaren praktijkbegeleider die MBO-zorgstudenten coacht tijdens gespreksoefeningen. Je observeert het gesprek en geeft korte, behulpzame tips.

## Kennis over de gesprekstechnieken die de student oefent:

${coachKennis}`,
    userPrompt: `Hier is het gesprek tot nu toe tussen een student en een cliënt:

---
${transcript}
---

Context:
- Setting: ${settings.setting}
- De student oefent met: ${settings.leerdoelen.join(', ')}

Analyseer het gesprek op basis van je kennis over de gesprekstechnieken hierboven. Geef de student één korte tip (max 2 zinnen) om het gesprek te verbeteren. Wees bemoedigend en concreet. Beschrijf gewoon wat de student kan doen, niet welke techniek het is.`
  };
}

export function buildFeedbackPayload(
  settings: SelectedSettings,
  history: PromptMessage[],
  context: SessionState,
  selfAssessment?: Record<string, string>
) {
  const transcript = buildTranscript(history, context);
  const coachKennis = getCoachContext(settings.leerdoelen);
  const rubricKennis = getRubricContext(settings.leerdoelen);
  const selfAssessmentContext = buildSelfAssessmentContext(selfAssessment);

  return {
    systemPrompt: FEEDBACK_PROMPT.replace('{{LEERDOELEN}}', settings.leerdoelen.join(', '))
      .replace('{{COACH_KENNIS}}', coachKennis)
      .replace('{{RUBRIC}}', rubricKennis)
      .replace('{{SELF_ASSESSMENT}}', selfAssessmentContext),
    userPrompt: `Hier is het volledige gesprek tussen de student en de cliënt:

---
${transcript}
---

Context:
- Setting: ${settings.setting}
- Scenario: ${settings.scenarioType}
- Cliënttype: ${settings.archetype}
- Niveau: ${settings.moeilijkheid}
- Leerdoelen: ${settings.leerdoelen.join(', ')}
- Aantal beurten: ${history.length}

Geef nu je feedback volgens de voorgeschreven structuur.`
  };
}
