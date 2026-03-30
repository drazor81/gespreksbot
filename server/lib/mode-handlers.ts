import type { AiModeRequest } from '../../src/shared/api-contract';
import {
  buildCoachPayload,
  buildFeedbackPayload,
  buildOpeningPrompt,
  buildPatientSystemPrompt,
  createSessionContext,
  type PromptMessage
} from './prompt-builders';
import type { SessionStateStore } from './session-state';

export interface BuiltModePayload {
  systemPrompt: string;
  messages: PromptMessage[];
}

export function buildModePayload({
  sid,
  store,
  input
}: {
  sid: string;
  store: SessionStateStore;
  input: AiModeRequest;
}): BuiltModePayload {
  if (input.mode === 'start') {
    const context = createSessionContext(input.settings);
    store.set(sid, context);

    return {
      systemPrompt: buildPatientSystemPrompt(input.settings, context),
      messages: [{ role: 'user', content: buildOpeningPrompt(input.settings, context) }]
    };
  }

  const existingContext = store.get(sid) ?? createSessionContext(input.settings);
  if (!store.get(sid)) {
    store.set(sid, existingContext);
  }

  switch (input.mode) {
    case 'chat':
    case 'stream':
      return {
        systemPrompt: buildPatientSystemPrompt(input.settings, existingContext),
        messages: [...input.history, { role: 'user', content: input.message ?? '' }]
      };
    case 'coach': {
      const payload = buildCoachPayload(input.settings, input.history, existingContext);
      return {
        systemPrompt: payload.systemPrompt,
        messages: [{ role: 'user', content: payload.userPrompt }]
      };
    }
    case 'feedback': {
      const payload = buildFeedbackPayload(input.settings, input.history, existingContext, input.selfAssessment);
      return {
        systemPrompt: payload.systemPrompt,
        messages: [{ role: 'user', content: payload.userPrompt }]
      };
    }
    default:
      throw new Error('Unsupported AI mode.');
  }
}
