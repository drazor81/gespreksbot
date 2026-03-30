import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildAiRequest, sendAiModeRequest, streamAiModeRequest } from '../../src/api';
import { state } from '../../src/state';

const baseSettings = {
  setting: 'Verpleeghuis',
  scenarioType: 'Intake',
  leerdoelen: ['LSD'],
  moeilijkheid: 'Gemiddeld',
  archetype: 'Angstige cliënt',
  customScenario: '',
  customArchetype: ''
} as const;

describe('frontend ai api', () => {
  beforeEach(() => {
    state.sessionToken = null;
    state.sessionTokenExpiresAt = null;
    vi.restoreAllMocks();
  });

  it('builds structured AI requests without a legacy system prompt field', () => {
    const payload = buildAiRequest('chat', {
      settings: { ...baseSettings },
      history: [],
      message: 'Hallo'
    });

    expect(payload.mode).toBe('chat');
    expect(payload).not.toHaveProperty('systemPrompt');
  });

  it('bootstraps a session token before sending structured ai requests', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ sessionToken: 'session-token', expiresInSeconds: 900 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ response: 'Hallo terug' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      );

    vi.stubGlobal('fetch', fetchMock);

    const result = await sendAiModeRequest(
      buildAiRequest('chat', {
        settings: { ...baseSettings },
        history: [],
        message: 'Hallo'
      })
    );

    expect(result.response).toBe('Hallo terug');
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/api/session'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/api/ai-mode'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer session-token'
        })
      })
    );

    const requestBody = JSON.parse(fetchMock.mock.calls[1][1]?.body as string) as Record<string, unknown>;
    expect(requestBody.mode).toBe('chat');
    expect(requestBody).not.toHaveProperty('systemPrompt');
  });

  it('streams structured ai mode requests with bearer auth and no system prompt field', async () => {
    const encoder = new TextEncoder();
    const eventStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: 'Hallo ' })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, fullText: 'Hallo daar' })}\n\n`));
        controller.close();
      }
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ sessionToken: 'session-token', expiresInSeconds: 900 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      )
      .mockResolvedValueOnce(
        new Response(eventStream, {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' }
        })
      );

    vi.stubGlobal('fetch', fetchMock);

    const chunks: string[] = [];
    const result = await streamAiModeRequest(
      buildAiRequest('stream', {
        settings: { ...baseSettings },
        history: [],
        message: 'Hallo'
      }),
      (delta) => chunks.push(delta)
    );

    expect(chunks).toEqual(['Hallo ']);
    expect(result).toBe('Hallo daar');
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/api/ai-mode/stream'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer session-token'
        })
      })
    );

    const requestBody = JSON.parse(fetchMock.mock.calls[1][1]?.body as string) as Record<string, unknown>;
    expect(requestBody.mode).toBe('stream');
    expect(requestBody).not.toHaveProperty('systemPrompt');
  });
});
