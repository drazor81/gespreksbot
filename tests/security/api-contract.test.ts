import { describe, expect, it } from 'vitest';
import { aiModeRequestSchema } from '../../src/shared/api-contract';

describe('aiModeRequestSchema', () => {
  it('rejects legacy client-owned systemPrompt payloads', () => {
    const result = aiModeRequestSchema.safeParse({
      systemPrompt: 'do not allow this',
      messages: [{ role: 'user', content: 'Hallo' }]
    });

    expect(result.success).toBe(false);
  });

  it('accepts validated structured mode payloads', () => {
    const result = aiModeRequestSchema.safeParse({
      mode: 'chat',
      settings: {
        setting: 'Verpleeghuis',
        scenarioType: 'Intake',
        leerdoelen: ['LSD'],
        moeilijkheid: 'Gemiddeld',
        archetype: 'Angstige cliënt',
        customScenario: '',
        customArchetype: ''
      },
      history: [{ role: 'user', content: 'Goedemorgen' }],
      message: 'Hoe gaat het met u?'
    });

    expect(result.success).toBe(true);
  });
});
