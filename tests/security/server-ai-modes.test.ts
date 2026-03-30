// @vitest-environment node
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../server/app';
import { buildModePayload } from '../../server/lib/mode-handlers';
import { createSessionStateStore } from '../../server/lib/session-state';
import { createSessionToken } from '../../server/lib/session-tokens';

const baseSettings = {
  setting: 'Verpleeghuis',
  scenarioType: 'Intake',
  leerdoelen: ['LSD'],
  moeilijkheid: 'Gemiddeld',
  archetype: 'Angstige cliënt',
  customScenario: '',
  customArchetype: ''
} as const;

describe('buildModePayload', () => {
  it('creates a server-owned opening payload and stores session context', () => {
    const store = createSessionStateStore();

    const result = buildModePayload({
      sid: 'session-1',
      store,
      input: {
        mode: 'start',
        settings: { ...baseSettings },
        history: []
      }
    });

    expect(result.systemPrompt).toContain('Je bent');
    expect(result.messages[0]?.role).toBe('user');
    expect(result.messages[0]?.content).toContain('[NAAM:');
    expect(store.get('session-1')?.personaName).toBeTruthy();
  });

  it('reuses stored session context for follow-up chat payloads', () => {
    const store = createSessionStateStore();

    buildModePayload({
      sid: 'session-2',
      store,
      input: {
        mode: 'start',
        settings: { ...baseSettings },
        history: []
      }
    });

    const storedName = store.get('session-2')?.personaName;
    const result = buildModePayload({
      sid: 'session-2',
      store,
      input: {
        mode: 'chat',
        settings: { ...baseSettings },
        history: [{ role: 'assistant', content: 'Goedemorgen.' }],
        message: 'Hoe gaat het met u?'
      }
    });

    expect(storedName).toBeTruthy();
    expect(result.systemPrompt).toContain(storedName!);
    expect(result.messages.at(-1)).toEqual({ role: 'user', content: 'Hoe gaat het met u?' });
  });

  it('rejects malformed structured AI mode requests before calling the model', async () => {
    process.env.SESSION_TOKEN_SECRET = '12345678901234567890123456789012';
    const token = await createSessionToken(process.env.SESSION_TOKEN_SECRET, 'session-3');
    const app = createApp();

    const response = await request(app)
      .post('/api/ai-mode')
      .set('Authorization', `Bearer ${token}`)
      .send({ mode: 'chat' });

    expect(response.status).toBe(400);
  });
});
