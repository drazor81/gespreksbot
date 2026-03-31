import { state } from './state';
import type { AiModeRequest } from './shared/api-contract';
import { getTurnstileChallengeToken } from './security/turnstile';

export const API_BASE = import.meta.env.VITE_API_BASE || '';
const SESSION_REFRESH_SKEW_MS = 30_000;
const DEV_BYPASS_CHALLENGE_TOKEN = 'dev-bypass';

interface ApiErrorResponse {
  error?: string;
}

interface SessionBootstrapResponse {
  sessionToken: string;
  expiresInSeconds: number;
}

interface JsonAiResponse extends ApiErrorResponse {
  response?: string;
}

class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'UnauthorizedError';
  }
}

let sessionBootstrapPromise: Promise<string> | null = null;

function hasValidSessionToken(): boolean {
  return Boolean(
    state.sessionToken &&
      state.sessionTokenExpiresAt &&
      Date.now() < state.sessionTokenExpiresAt - SESSION_REFRESH_SKEW_MS
  );
}

function clearSessionToken(): void {
  state.sessionToken = null;
  state.sessionTokenExpiresAt = null;
}

async function resolveChallengeToken(): Promise<string> {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  if (siteKey) {
    return getTurnstileChallengeToken(siteKey);
  }

  return DEV_BYPASS_CHALLENGE_TOKEN;
}

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as ApiErrorResponse;
    if (typeof data.error === 'string' && data.error.trim()) {
      return data.error;
    }
  } catch {
    // Ignore JSON parsing failures for non-JSON error responses.
  }

  return fallback;
}

async function throwForFailedResponse(response: Response, fallback: string): Promise<never> {
  if (response.status === 401) {
    throw new UnauthorizedError();
  }

  throw new Error(await parseErrorMessage(response, fallback));
}

async function withFreshSessionToken<T>(operation: (sessionToken: string) => Promise<T>): Promise<T> {
  const run = async (allowRefresh: boolean): Promise<T> => {
    const sessionToken = await ensureSessionToken();

    try {
      return await operation(sessionToken);
    } catch (error) {
      if (allowRefresh && error instanceof UnauthorizedError) {
        clearSessionToken();
        return run(false);
      }
      throw error;
    }
  };

  return run(true);
}

export async function bootstrapSession(challengeToken: string): Promise<SessionBootstrapResponse> {
  const response = await fetch(`${API_BASE}/api/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeToken })
  });

  if (!response.ok) {
    await throwForFailedResponse(response, `Session bootstrap failed: ${response.status}`);
  }

  return (await response.json()) as SessionBootstrapResponse;
}

export async function ensureSessionToken(): Promise<string> {
  if (hasValidSessionToken()) {
    return state.sessionToken!;
  }

  if (!sessionBootstrapPromise) {
    sessionBootstrapPromise = resolveChallengeToken()
      .then((challengeToken) => bootstrapSession(challengeToken))
      .then((data) => {
        state.sessionToken = data.sessionToken;
        state.sessionTokenExpiresAt = Date.now() + data.expiresInSeconds * 1000;
        return data.sessionToken;
      })
      .finally(() => {
        sessionBootstrapPromise = null;
      });
  }

  return sessionBootstrapPromise;
}

export function buildAiRequest(mode: AiModeRequest['mode'], payload: Omit<AiModeRequest, 'mode'>): AiModeRequest {
  return { mode, ...payload };
}

export async function sendAiModeRequest(
  request: AiModeRequest,
  signal?: AbortSignal
): Promise<JsonAiResponse> {
  return withFreshSessionToken(async (sessionToken) => {
    const response = await fetch(`${API_BASE}/api/ai-mode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`
      },
      signal,
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      await throwForFailedResponse(response, `Server error: ${response.status}`);
    }

    return (await response.json()) as JsonAiResponse;
  });
}

export async function streamAiModeRequest(
  request: AiModeRequest,
  onDelta: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  return withFreshSessionToken(async (sessionToken) => {
    const response = await fetch(`${API_BASE}/api/ai-mode/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`
      },
      signal,
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      await throwForFailedResponse(response, `Server error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Streaming response body ontbreekt.');
    }

    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const jsonString = line.slice(6).trim();
        if (!jsonString) continue;

        try {
          const data = JSON.parse(jsonString) as {
            delta?: string;
            done?: boolean;
            fullText?: string;
            error?: string;
          };

          if (data.error) {
            throw new Error(data.error);
          }
          if (data.delta) {
            fullText += data.delta;
            onDelta(data.delta);
          }
          if (data.done && data.fullText) {
            fullText = data.fullText;
          }
        } catch (error) {
          if (error instanceof SyntaxError) {
            continue;
          }
          throw error;
        }
      }
    }

    return fullText;
  });
}

export async function speechToText(audioBlob: Blob): Promise<{ transcript?: string; error?: string }> {
  return withFreshSessionToken(async (sessionToken) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const response = await fetch(`${API_BASE}/api/speech-to-text`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionToken}`
      },
      body: formData
    });

    if (!response.ok) {
      await throwForFailedResponse(response, `STT error: ${response.status}`);
    }

    return (await response.json()) as { transcript?: string; error?: string };
  });
}

export async function textToSpeech(text: string): Promise<Blob> {
  return withFreshSessionToken(async (sessionToken) => {
    const response = await fetch(`${API_BASE}/api/text-to-speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      await throwForFailedResponse(response, `TTS error: ${response.status}`);
    }

    return response.blob();
  });
}
